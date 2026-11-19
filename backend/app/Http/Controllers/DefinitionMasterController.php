<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class DefinitionMasterController extends Controller
{
    private const TYPES = [
        'categories' => 'product_categories',
        'subcategories' => 'product_subcategories',
        'brands' => 'product_brands',
        'units' => 'product_units',
    ];

    private function table(string $kind): string
    {
        return self::TYPES[$kind] ?? abort(404);
    }

    public function index(string $tenant, string $kind, TenantContext $context): JsonResponse
    {
        $table = $this->table($kind);
        $query = DB::table($table.' as m')->where('m.tenant_id', $context->id())
            ->orderBy('m.name')->orderBy('m.id');
        if ($kind === 'subcategories') {
            $data = $query->join('product_categories as c', function ($join): void {
                $join->on('c.tenant_id', '=', 'm.tenant_id')->on('c.id', '=', 'm.category_id');
            })->get(['m.ulid', 'm.code', 'm.name', 'm.is_active',
                'c.ulid as category_ulid', 'c.name as category_name']);
        } else {
            $data = $query->get(['m.ulid', 'm.code', 'm.name', 'm.is_active']);
        }
        return response()->json(['data' => $data]);
    }

    public function store(Request $request, string $tenant, string $kind, TenantContext $context): JsonResponse
    {
        $table = $this->table($kind);
        $request->merge([
            'code' => strtoupper(trim((string) $request->input('code', ''))),
            'name' => trim((string) $request->input('name', '')),
        ]);
        $data = $request->validate([
            'code' => ['required', 'string', 'regex:/^[A-Z0-9][A-Z0-9_-]{0,47}$/D'],
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'category_ulid' => [$kind === 'subcategories' ? 'required' : 'prohibited', 'ulid'],
        ]);
        $tenantId = $context->id();
        $categoryId = null;
        if ($kind === 'subcategories') {
            $categoryId = DB::table('product_categories')
                ->where('tenant_id', $tenantId)
                ->where('ulid', strtoupper($data['category_ulid']))
                ->where('is_active', true)->value('id');
            if ($categoryId === null) {
                return response()->json(['message' => 'Parent category unavailable in this tenant.'], 404);
            }
        }
        $exists = DB::table($table)->where('tenant_id', $tenantId)
            ->when($categoryId !== null, fn ($q) => $q->where('category_id', $categoryId))
            ->where(function ($q) use ($data): void {
                $q->where('code', $data['code'])
                    ->orWhereRaw('lower(name) = lower(?)', [$data['name']]);
            })->exists();
        if ($exists) {
            return response()->json(['message' => 'Code or name already exists in this master.'], 409);
        }
        $ulid = (string) Str::ulid();
        try {
            DB::table($table)->insert([
                'tenant_id' => $tenantId, 'ulid' => $ulid,
                'code' => $data['code'], 'name' => $data['name'],
                ...($categoryId === null ? [] : ['category_id' => $categoryId]),
                'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23505') {
                return response()->json(['message' => 'Duplicate code or name.'], 409);
            }
            throw $exception;
        }
        return response()->json(['data' => [
            'ulid' => $ulid, 'code' => $data['code'], 'name' => $data['name'],
            'is_active' => true,
            ...($kind === 'subcategories' ? ['category_ulid' => strtoupper($data['category_ulid'])] : []),
        ]], 201);
    }

    public function setStatus(
        Request $request, string $tenant, string $kind, string $master, TenantContext $context
    ): JsonResponse {
        $table = $this->table($kind);
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $query = DB::table($table)
            ->where('tenant_id', $context->id())->where('ulid', strtoupper($master));
        if (! $query->exists()) {
            return response()->json(['message' => 'Master item not found for this tenant.'], 404);
        }
        $query->update(['is_active' => $data['is_active'], 'updated_at' => now()]);
        return response()->json(['data' => ['ulid' => strtoupper($master), 'is_active' => (bool) $data['is_active']]]);
    }
}
