<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class ProductController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $input = $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
        ]);

        $query = DB::table('products')
            ->where('products.tenant_id', $context->id())
            ->leftJoin('product_categories as pc', function ($join): void {
                $join->on('pc.tenant_id', '=', 'products.tenant_id')->on('pc.id', '=', 'products.category_id');
            })
            ->leftJoin('product_subcategories as psc', function ($join): void {
                $join->on('psc.tenant_id', '=', 'products.tenant_id')->on('psc.id', '=', 'products.subcategory_id');
            })
            ->leftJoin('product_brands as pb', function ($join): void {
                $join->on('pb.tenant_id', '=', 'products.tenant_id')->on('pb.id', '=', 'products.brand_id');
            })
            ->leftJoin('product_units as pu', function ($join): void {
                $join->on('pu.tenant_id', '=', 'products.tenant_id')->on('pu.id', '=', 'products.unit_id');
            })
            ->select(['products.ulid', 'products.sku', 'products.name', 'products.barcode', 'products.sale_price', 'products.is_active',
                'pc.ulid as category_ulid', 'psc.ulid as subcategory_ulid',
                'pb.ulid as brand_ulid', 'pu.ulid as unit_ulid'])
            ->orderBy('products.name')->orderBy('products.id');

        $search = trim($input['q'] ?? '');
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                // Treat % and _ as plain characters, not SQL wildcards.
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
                $q->where('products.name', 'ilike', $term)
                    ->orWhere('products.sku', 'ilike', $term)
                    ->orWhere('products.barcode', 'ilike', $term);
            });
        }

        return response()->json($query->paginate(30));
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();

        // Canonicalize before uniqueness validation so padded SKU/barcode cannot bypass it.
        $request->merge([
            'sku' => trim((string) $request->input('sku', '')),
            'name' => trim((string) $request->input('name', '')),
            'barcode' => $request->filled('barcode') ? trim((string) $request->input('barcode')) : null,
        ]);

        $data = $request->validate([
            'sku' => [
                'required', 'string', 'max:64',
                Rule::unique('products', 'sku')->where('tenant_id', $tenantId),
            ],
            'name' => ['required', 'string', 'max:180'],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('products', 'barcode')->where('tenant_id', $tenantId),
            ],
            'sale_price' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
            'category_ulid' => ['nullable', 'ulid'],
            'subcategory_ulid' => ['nullable', 'ulid'],
            'brand_ulid' => ['nullable', 'ulid'],
            'unit_ulid' => ['nullable', 'ulid'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $categoryId = $this->masterId('product_categories', $tenantId, $data['category_ulid'] ?? null);
        $subcategoryId = $this->masterId('product_subcategories', $tenantId, $data['subcategory_ulid'] ?? null,
            $categoryId);
        $brandId = $this->masterId('product_brands', $tenantId, $data['brand_ulid'] ?? null);
        $unitId = $this->masterId('product_units', $tenantId, $data['unit_ulid'] ?? null);

        $ulid = (string) Str::ulid();
        DB::table('products')->insert([
            'tenant_id' => $tenantId,
            'ulid' => $ulid,
            'sku' => trim($data['sku']),
            'name' => trim($data['name']),
            'barcode' => isset($data['barcode']) && trim($data['barcode']) !== '' ? trim($data['barcode']) : null,
            'sale_price' => $data['sale_price'],
            'category_id' => $categoryId,
            'subcategory_id' => $subcategoryId,
            'brand_id' => $brandId,
            'unit_id' => $unitId,
            'is_active' => $data['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $product = DB::table('products')
            ->where('tenant_id', $tenantId)->where('ulid', $ulid)
            ->first(['ulid', 'sku', 'name', 'barcode', 'sale_price', 'is_active']);

        return response()->json(['data' => $product], 201);
    }
    /**
     * Resolve optional catalog masters by tenant ULID. The second category
     * argument is enforced for subcategories; no client BIGINT is accepted.
     */
    private function masterId(string $table, int $tenantId, ?string $ulid, ?int $categoryId = null): ?int
    {
        if ($ulid === null || $ulid === '') return null;
        if ($table === 'product_subcategories' && $categoryId === null) {
            abort(422, 'Select a parent category for this subcategory.');
        }
        $query = DB::table($table)
            ->where('tenant_id', $tenantId)
            ->where('ulid', strtoupper($ulid))
            ->where('is_active', true);
        if ($table === 'product_subcategories') {
            $query->where('category_id', $categoryId);
        }
        $id = $query->value('id');
        if ($id === null) abort(422, 'Selected product master is missing or inactive.');
        return (int) $id;
    }

}
