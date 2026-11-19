<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class WarehouseController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        return response()->json(['data' => DB::table('warehouses')
            ->where('tenant_id', $context->id())
            ->orderBy('name')
            ->get(['ulid', 'code', 'name', 'is_active'])]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();
        $request->merge([
            'code' => strtoupper(trim((string) $request->input('code', ''))),
            'name' => trim((string) $request->input('name', '')),
        ]);
        $data = $request->validate([
            'code' => ['required', 'regex:/^[A-Z0-9][A-Z0-9_-]{0,39}$/D',
                Rule::unique('warehouses', 'code')->where('tenant_id', $tenantId)],
            'name' => ['required', 'string', 'max:160'],
        ]);

        $ulid = (string) Str::ulid();
        DB::table('warehouses')->insert([
            'tenant_id' => $tenantId,
            'ulid' => $ulid,
            'code' => $data['code'],
            'name' => $data['name'],
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['data' => DB::table('warehouses')
            ->where('tenant_id', $tenantId)->where('ulid', $ulid)
            ->first(['ulid', 'code', 'name', 'is_active'])], 201);
    }
}
