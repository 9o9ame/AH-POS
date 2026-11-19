<?php

namespace App\Http\Controllers;

use App\Support\DocumentMath;
use App\Support\CashShiftScope;
use App\Support\DocumentPosting;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class SaleReturnController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        return response()->json(['data' => DB::table('sale_returns as r')
            ->join('sales as s', function ($join): void {
                $join->on('s.id', '=', 'r.sale_id')->on('s.tenant_id', '=', 'r.tenant_id');
            })
            ->where('r.tenant_id', $context->id())->orderByDesc('r.id')->limit(50)
            ->get(['r.ulid', 's.ulid as sale_ulid', 'r.reason', 'r.refund_total',
                'r.refund_method', 'r.status', 'r.created_at'])]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        DocumentPosting::assertLocalOnly();
        // Normalize the audit reason before server-side length validation.
        $request->merge(['reason' => trim((string) $request->input('reason', ''))]);
        $data = $request->validate([
            'sale_ulid' => ['required', 'ulid'],
            'idempotency_key' => ['required', 'uuid'],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.sale_line_ulid' => ['required', 'ulid'],
            'lines.*.quantity' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,13})(?:\\.[0-9]{1,6})?$/D'],
        ]);
        $tenantId = $context->id();
        $saleUlid = strtoupper($data['sale_ulid']);
        $key = strtolower($data['idempotency_key']);
        $reason = trim($data['reason']);
        $hash = DocumentPosting::payloadHash([$saleUlid, $reason, $data['lines']]);

        DocumentPosting::lockKey($tenantId, 'sale-return', $key);
        $existing = DB::table('sale_returns')->where('tenant_id', $tenantId)
            ->where('idempotency_key', $key)->first(['ulid', 'payload_hash', 'refund_total']);
        if ($existing !== null) {
            return $existing->payload_hash === $hash
                ? response()->json(['data' => [
                    'ulid' => $existing->ulid, 'refund_total' => $existing->refund_total, 'replayed' => true,
                ]])
                : response()->json(['message' => 'Return request key used for different details.'], 409);
        }

        // Serialize all refunds against the same sale. Lock warehouse and sale in
        // a consistent order; the sale document itself remains immutable.
        $sale = DB::table('sales')->where('tenant_id', $tenantId)
            ->where('ulid', $saleUlid)->first(['id', 'warehouse_id', 'status', 'payment_method']);
        if ($sale === null || $sale->status !== 'posted' || $sale->payment_method !== 'cash') {
            return response()->json(['message' => 'Posted cash sale not available for return.'], 404);
        }
        DocumentPosting::lockWarehouse($tenantId, (int) $sale->warehouse_id);
        DB::table('sales')->where('tenant_id', $tenantId)
            ->where('id', $sale->id)->lockForUpdate()->first(['id']);

        $items = [];
        $seen = [];
        foreach ($data['lines'] as $input) {
            $originUlid = strtoupper($input['sale_line_ulid']);
            if (isset($seen[$originUlid]) || ! DocumentMath::greaterThanZero((string) $input['quantity'])) {
                return response()->json(['message' => 'Return items must be unique with positive quantity.'], 422);
            }
            $seen[$originUlid] = true;
            $origin = DB::table('sale_lines')->where('tenant_id', $tenantId)
                ->where('sale_id', $sale->id)->where('ulid', $originUlid)
                ->first(['id', 'product_id', 'quantity', 'unit_price', 'line_total']);
            if ($origin === null) {
                return response()->json(['message' => 'Return line does not belong to this sale.'], 404);
            }
            $prior = DB::table('sale_return_lines as rl')
                ->join('sale_returns as r', function ($join): void {
                    $join->on('r.id', '=', 'rl.return_id')->on('r.tenant_id', '=', 'rl.tenant_id');
                })
                ->where('rl.tenant_id', $tenantId)->where('r.sale_id', $sale->id)
                ->where('rl.sale_line_id', $origin->id)
                ->selectRaw('COALESCE(SUM(rl.quantity),0)::text as quantity, COALESCE(SUM(rl.refund_total),0)::text as amount')
                ->first();
            $newQuantity = DocumentMath::sumQuantity([(string) $prior->quantity, (string) $input['quantity']]);
            if (! DocumentMath::covers((string) $origin->quantity, $newQuantity)) {
                return response()->json(['message' => 'Return quantity exceeds remaining sold quantity.'], 422);
            }
            $refund = DocumentMath::line((string) $input['quantity'], (string) $origin->unit_price);
            if (! DocumentMath::covers((string) $origin->line_total,
                DocumentMath::sum([(string) $prior->amount, $refund]))) {
                return response()->json(['message' => 'Refund exceeds original sale line amount.'], 422);
            }
            $items[] = [
                'sale_line_id' => $origin->id, 'product_id' => $origin->product_id,
                'quantity' => (string) $input['quantity'], 'unit_price' => (string) $origin->unit_price,
                'refund_total' => $refund,
            ];
        }

        $refundTotal = DocumentMath::sum(array_column($items, 'refund_total'));
        $now = now();
        $returnUlid = (string) Str::ulid();
        $returnId = DB::table('sale_returns')->insertGetId([
            'tenant_id' => $tenantId, 'sale_id' => $sale->id, 'warehouse_id' => $sale->warehouse_id,
            'cash_shift_id' => CashShiftScope::activeId($tenantId, (int) $sale->warehouse_id, (int) $request->user()->getKey()),
            'created_by' => $request->user()->getKey(), 'ulid' => $returnUlid,
            'idempotency_key' => $key, 'payload_hash' => $hash,
            'reason' => $reason, 'refund_total' => $refundTotal, 'refund_method' => 'cash',
            'status' => 'posted', 'created_at' => $now, 'updated_at' => $now,
        ]);

        foreach ($items as $item) {
            DB::table('sale_return_lines')->insert([
                'tenant_id' => $tenantId, 'return_id' => $returnId, 'sale_id' => $sale->id,
                'sale_line_id' => $item['sale_line_id'], 'product_id' => $item['product_id'],
                'ulid' => (string) Str::ulid(), 'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'], 'refund_total' => $item['refund_total'],
            ]);
            DB::table('stock_movements')->insert([
                'tenant_id' => $tenantId, 'warehouse_id' => $sale->warehouse_id,
                'product_id' => $item['product_id'], 'sale_return_id' => $returnId,
                'created_by' => $request->user()->getKey(), 'ulid' => (string) Str::ulid(),
                'idempotency_key' => (string) Str::uuid(), 'payload_hash' => $hash,
                'type' => 'sale_return', 'quantity' => $item['quantity'],
                'unit_cost' => '0.0000', 'note' => 'Cash refund '.$returnUlid,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        return response()->json(['data' => [
            'ulid' => $returnUlid, 'sale_ulid' => $saleUlid,
            'refund_total' => $refundTotal, 'replayed' => false,
        ]], 201);
    }
}
