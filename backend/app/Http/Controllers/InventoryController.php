<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class InventoryController extends Controller
{
    public function overview(TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();
        $balances = DB::table('stock_movements as m')
            ->join('products as p', function ($join): void {
                $join->on('p.id', '=', 'm.product_id')->on('p.tenant_id', '=', 'm.tenant_id');
            })
            ->join('warehouses as w', function ($join): void {
                $join->on('w.id', '=', 'm.warehouse_id')->on('w.tenant_id', '=', 'm.tenant_id');
            })
            ->where('m.tenant_id', $tenantId)
            ->groupBy('w.ulid', 'w.name', 'p.ulid', 'p.sku', 'p.name')
            ->orderBy('p.name')->orderBy('w.name')
            ->selectRaw('w.ulid AS warehouse_ulid, w.name AS warehouse_name, p.ulid AS product_ulid, p.sku, p.name AS product_name, SUM(m.quantity)::text AS quantity')
            ->limit(100)->get();

        $movements = DB::table('stock_movements as m')
            ->join('products as p', function ($join): void {
                $join->on('p.id', '=', 'm.product_id')->on('p.tenant_id', '=', 'm.tenant_id');
            })
            ->join('warehouses as w', function ($join): void {
                $join->on('w.id', '=', 'm.warehouse_id')->on('w.tenant_id', '=', 'm.tenant_id');
            })
            ->where('m.tenant_id', $tenantId)
            ->orderByDesc('m.id')
            ->limit(30)
            ->get([
                'm.ulid', 'm.type', 'm.quantity', 'm.unit_cost', 'm.note', 'm.created_at',
                'p.name as product_name', 'w.name as warehouse_name',
            ]);

        return response()->json(['data' => [
            'balances' => $balances,
            'movements' => $movements,
            'warehouse_count' => DB::table('warehouses')->where('tenant_id', $tenantId)->count(),
        ]]);
    }

    public function receive(Request $request, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();
        $data = $request->validate([
            'warehouse_ulid' => ['required', 'ulid'],
            'product_ulid' => ['required', 'ulid'],
            'idempotency_key' => ['required', 'ulid'],
            'type' => ['required', Rule::in(['opening', 'receipt'])],
            'quantity' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,13})(?:\\.[0-9]{1,6})?$/D'],
            'unit_cost' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        if (preg_match('/^0(?:\\.0+)?$/', (string) $data['quantity'])) {
            return response()->json(['message' => 'Quantity must be greater than zero.'], 422);
        }

        $warehouse = DB::table('warehouses')
            ->where('tenant_id', $tenantId)->where('ulid', strtoupper($data['warehouse_ulid']))
            ->where('is_active', true)->first(['id', 'ulid']);
        $product = DB::table('products')
            ->where('tenant_id', $tenantId)->where('ulid', strtoupper($data['product_ulid']))
            ->where('is_active', true)->first(['id', 'ulid']);

        if ($warehouse === null || $product === null) {
            return response()->json(['message' => 'Product or warehouse unavailable in this tenant.'], 404);
        }

        // Canonical decimal strings without float conversions for idempotency.
        $quantity = str_contains((string) $data['quantity'], '.')
            ? rtrim(rtrim((string) $data['quantity'], '0'), '.') : (string) $data['quantity'];
        $unitCost = str_contains((string) $data['unit_cost'], '.')
            ? rtrim(rtrim((string) $data['unit_cost'], '0'), '.') : (string) $data['unit_cost'];
        if ($quantity === '') $quantity = '0';
        if ($unitCost === '') $unitCost = '0';
        $note = trim((string) ($data['note'] ?? ''));
        $key = strtoupper($data['idempotency_key']);
        $hash = hash('sha256', json_encode([
            $tenantId, $warehouse->id, $product->id, $data['type'],
            $quantity, $unitCost, $note,
        ], JSON_THROW_ON_ERROR));

        $existing = DB::table('stock_movements')
            ->where('tenant_id', $tenantId)->where('idempotency_key', $key)
            ->first(['ulid', 'payload_hash']);
        if ($existing !== null) {
            return $existing->payload_hash === $hash
                ? response()->json(['data' => ['ulid' => $existing->ulid, 'replayed' => true]])
                : response()->json(['message' => 'Idempotency key already used with different details.'], 409);
        }

        $ulid = (string) Str::ulid();
        // ON CONFLICT DO NOTHING keeps the transaction usable during retries.
        $inserted = DB::table('stock_movements')->insertOrIgnore([
            'tenant_id' => $tenantId,
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'created_by' => $request->user()->getKey(),
            'ulid' => $ulid,
            'idempotency_key' => $key,
            'payload_hash' => $hash,
            'type' => $data['type'],
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'note' => $note !== '' ? $note : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        if ($inserted === 0) {
            $duplicate = DB::table('stock_movements')
                ->where('tenant_id', $tenantId)->where('idempotency_key', $key)
                ->first(['ulid', 'payload_hash']);
            if ($duplicate !== null && $duplicate->payload_hash === $hash) {
                return response()->json(['data' => ['ulid' => $duplicate->ulid, 'replayed' => true]]);
            }
            return response()->json(['message' => 'Duplicate or conflicting stock receipt.'], 409);
        }

        return response()->json(['data' => ['ulid' => $ulid, 'replayed' => false]], 201);
    }
}
