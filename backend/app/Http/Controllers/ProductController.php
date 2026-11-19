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
            ->where('tenant_id', $context->id())
            ->select(['ulid', 'sku', 'name', 'barcode', 'sale_price', 'is_active'])
            ->orderBy('name')->orderBy('id');

        $search = trim($input['q'] ?? '');
        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                // Treat % and _ as plain characters, not SQL wildcards.
                $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search).'%';
                $q->where('name', 'ilike', $term)
                    ->orWhere('sku', 'ilike', $term)
                    ->orWhere('barcode', 'ilike', $term);
            });
        }

        return response()->json($query->paginate(30));
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();

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
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $ulid = (string) Str::ulid();
        DB::table('products')->insert([
            'tenant_id' => $tenantId,
            'ulid' => $ulid,
            'sku' => trim($data['sku']),
            'name' => trim($data['name']),
            'barcode' => isset($data['barcode']) && trim($data['barcode']) !== '' ? trim($data['barcode']) : null,
            'sale_price' => $data['sale_price'],
            'is_active' => $data['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $product = DB::table('products')
            ->where('tenant_id', $tenantId)->where('ulid', $ulid)
            ->first(['ulid', 'sku', 'name', 'barcode', 'sale_price', 'is_active']);

        return response()->json(['data' => $product], 201);
    }
}
