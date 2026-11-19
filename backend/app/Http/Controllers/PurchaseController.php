<?php

namespace App\Http\Controllers;

use App\Support\DocumentMath;
use App\Support\DocumentPosting;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class PurchaseController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        return response()->json(['data' => DB::table('purchases as d')
            ->join('parties as s', function ($join): void {
                $join->on('s.id', '=', 'd.supplier_id')->on('s.tenant_id', '=', 'd.tenant_id');
            })
            ->join('warehouses as w', function ($join): void {
                $join->on('w.id', '=', 'd.warehouse_id')->on('w.tenant_id', '=', 'd.tenant_id');
            })
            ->where('d.tenant_id', $context->id())->orderByDesc('d.id')->limit(50)
            ->get(['d.ulid', 'd.reference', 'd.total', 'd.status', 'd.created_at',
                's.name as supplier_name', 'w.name as warehouse_name'])]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        DocumentPosting::assertLocalOnly();
        $data = $request->validate([
            'supplier_ulid' => ['required', 'ulid'],
            'warehouse_ulid' => ['required', 'ulid'],
            'idempotency_key' => ['required', 'uuid'],
            'reference' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.product_ulid' => ['required', 'ulid'],
            'lines.*.quantity' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,13})(?:\\.[0-9]{1,6})?$/D'],
            'lines.*.unit_cost' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
        ]);
        $tenantId = $context->id();
        $key = strtolower($data['idempotency_key']);
        $reference = trim((string) ($data['reference'] ?? ''));
        $signature = DocumentPosting::payloadHash([
            strtoupper($data['supplier_ulid']), strtoupper($data['warehouse_ulid']),
            $reference, $data['lines'],
        ]);

        DocumentPosting::lockKey($tenantId, 'purchase', $key);
        $existing = DB::table('purchases')->where('tenant_id', $tenantId)
            ->where('idempotency_key', $key)->first(['ulid', 'payload_hash', 'total']);
        if ($existing !== null) {
            return $existing->payload_hash === $signature
                ? response()->json(['data' => [
                    'ulid' => $existing->ulid, 'total' => $existing->total, 'replayed' => true,
                ]]) : response()->json(['message' => 'This request key was used for another purchase.'], 409);
        }

        $supplier = DB::table('parties')->where('tenant_id', $tenantId)
            ->where('ulid', strtoupper($data['supplier_ulid']))
            ->where('type', 'supplier')->where('is_active', true)->first(['id']);
        $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)
            ->where('ulid', strtoupper($data['warehouse_ulid']))
            ->where('is_active', true)->first(['id']);
        if ($supplier === null || $warehouse === null) {
            return response()->json(['message' => 'Active supplier or warehouse not found in this tenant.'], 404);
        }

        DocumentPosting::lockWarehouse($tenantId, (int) $warehouse->id);
        $lines = [];
        $seen = [];
        foreach ($data['lines'] as $line) {
            $ulid = strtoupper($line['product_ulid']);
            if (isset($seen[$ulid]) || ! DocumentMath::greaterThanZero((string) $line['quantity'])) {
                return response()->json(['message' => 'Each product must be unique and have positive quantity.'], 422);
            }
            $seen[$ulid] = true;
            $product = DB::table('products')->where('tenant_id', $tenantId)
                ->where('ulid', $ulid)->where('is_active', true)->first(['id']);
            if ($product === null) {
                return response()->json(['message' => 'Product not available for this tenant.'], 404);
            }
            $total = DocumentMath::line((string) $line['quantity'], (string) $line['unit_cost']);
            $lines[] = [
                'product_id' => $product->id, 'quantity' => (string) $line['quantity'],
                'unit_cost' => (string) $line['unit_cost'], 'line_total' => $total,
            ];
        }
        $total = DocumentMath::sum(array_column($lines, 'line_total'));
        $now = now();
        $documentUlid = (string) Str::ulid();
        $documentId = DB::table('purchases')->insertGetId([
            'tenant_id' => $tenantId, 'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouse->id, 'created_by' => $request->user()->getKey(),
            'ulid' => $documentUlid, 'idempotency_key' => $key, 'payload_hash' => $signature,
            'reference' => $reference !== '' ? $reference : null, 'total' => $total,
            'status' => 'posted', 'created_at' => $now, 'updated_at' => $now,
        ]);

        foreach ($lines as $line) {
            DB::table('purchase_lines')->insert([
                'tenant_id' => $tenantId, 'purchase_id' => $documentId,
                'product_id' => $line['product_id'], 'ulid' => (string) Str::ulid(),
                'quantity' => $line['quantity'], 'unit_cost' => $line['unit_cost'],
                'line_total' => $line['line_total'],
            ]);
            DB::table('stock_movements')->insert([
                'tenant_id' => $tenantId, 'warehouse_id' => $warehouse->id,
                'product_id' => $line['product_id'], 'purchase_id' => $documentId,
                'created_by' => $request->user()->getKey(), 'ulid' => (string) Str::ulid(),
                'idempotency_key' => (string) Str::uuid(),
                'payload_hash' => $signature, 'type' => 'receipt',
                'quantity' => $line['quantity'], 'unit_cost' => $line['unit_cost'],
                'note' => 'Purchase '.$documentUlid,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        return response()->json(['data' => [
            'ulid' => $documentUlid, 'total' => $total, 'replayed' => false,
        ]], 201);
    }
}
