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

final class SaleController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        return response()->json(['data' => DB::table('sales as s')
            ->leftJoin('parties as c', function ($join): void {
                $join->on('c.id', '=', 's.customer_id')->on('c.tenant_id', '=', 's.tenant_id');
            })
            ->where('s.tenant_id', $context->id())->orderByDesc('s.id')->limit(50)
            ->get(['s.ulid', 's.total', 's.amount_paid', 's.change_due',
                's.status', 's.created_at', 'c.name as customer_name'])]);
    }

    public function show(string $tenant, string $sale, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();
        $header = DB::table('sales as s')
            ->join('warehouses as w', function ($join): void {
                $join->on('w.id', '=', 's.warehouse_id')->on('w.tenant_id', '=', 's.tenant_id');
            })
            ->leftJoin('parties as c', function ($join): void {
                $join->on('c.id', '=', 's.customer_id')->on('c.tenant_id', '=', 's.tenant_id');
            })
            ->where('s.tenant_id', $tenantId)->where('s.ulid', strtoupper($sale))
            ->first(['s.id', 's.ulid', 's.subtotal', 's.total', 's.amount_paid',
                's.change_due', 's.payment_method', 's.status', 's.created_at',
                'w.name as warehouse_name', 'c.name as customer_name']);
        if ($header === null) abort(404);

        $lines = DB::table('sale_lines')->where('tenant_id', $tenantId)
            ->where('sale_id', $header->id)->orderBy('id')
            ->get(['ulid', 'sku', 'product_name', 'quantity', 'unit_price', 'line_total']);
        unset($header->id);
        return response()->json(['data' => ['sale' => $header, 'lines' => $lines]]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        // Until approved chart of accounts, tax configuration and posting journals
        // exist, cash-sale posting is a LOCAL DEV pilot, NOT a production feature.
        DocumentPosting::assertLocalOnly();
        $data = $request->validate([
            'warehouse_ulid' => ['required', 'ulid'],
            'customer_ulid' => ['nullable', 'ulid'],
            'idempotency_key' => ['required', 'uuid'],
            'hold_ulid' => ['nullable', 'ulid'],
            'amount_paid' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.product_ulid' => ['required', 'ulid'],
            'lines.*.quantity' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,13})(?:\\.[0-9]{1,6})?$/D'],
        ]);

        $tenantId = $context->id();
        $key = strtolower($data['idempotency_key']);
        $signatureParts = [
            strtoupper($data['warehouse_ulid']),
            strtoupper((string) ($data['customer_ulid'] ?? '')),
            (string) $data['amount_paid'], $data['lines'],
        ];
        // Preserve the existing idempotency fingerprint for ordinary cash
        // sales; add held bill identity only when the request explicitly has one.
        if (! empty($data['hold_ulid'])) {
            $signatureParts[] = strtoupper($data['hold_ulid']);
        }
        $signature = DocumentPosting::payloadHash($signatureParts);
        DocumentPosting::lockKey($tenantId, 'sale', $key);
        $existing = DB::table('sales')->where('tenant_id', $tenantId)
            ->where('idempotency_key', $key)->first(['ulid', 'payload_hash', 'total', 'change_due']);
        if ($existing !== null) {
            return $existing->payload_hash === $signature
                ? response()->json(['data' => [
                    'ulid' => $existing->ulid, 'total' => $existing->total,
                    'change_due' => $existing->change_due, 'replayed' => true,
                ]]) : response()->json(['message' => 'This request key was used for another sale.'], 409);
        }

        $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)
            ->where('ulid', strtoupper($data['warehouse_ulid']))
            ->where('is_active', true)->first(['id']);
        if ($warehouse === null) {
            return response()->json(['message' => 'Warehouse not found for this tenant.'], 404);
        }

        $customerId = null;
        if (! empty($data['customer_ulid'])) {
            $customer = DB::table('parties')->where('tenant_id', $tenantId)
                ->where('ulid', strtoupper($data['customer_ulid']))
                ->where('type', 'customer')->where('is_active', true)->first(['id']);
            if ($customer === null) {
                return response()->json(['message' => 'Customer not found for this tenant.'], 404);
            }
            $customerId = $customer->id;
        }

        // Serializes checkout for the warehouse across concurrent cashiers.
        // Manual stock inwards are additive; sale stock-outs use this same lock.
        DocumentPosting::lockWarehouse($tenantId, (int) $warehouse->id);
        $holdId = null;
        if (! empty($data['hold_ulid'])) {
            $hold = DB::table('held_sales')
                ->where('tenant_id', $tenantId)
                ->where('cashier_id', $request->user()->getKey())
                ->where('ulid', strtoupper($data['hold_ulid']))
                ->lockForUpdate()->first(['id', 'status']);
            if ($hold === null || $hold->status !== 'held') {
                return response()->json(['message' => 'Held sale is already posted or unavailable. Refresh held invoices.'], 409);
            }
            $holdId = $hold->id;
        }
        $seen = [];
        $lines = [];
        foreach ($data['lines'] as $input) {
            $productUlid = strtoupper($input['product_ulid']);
            if (isset($seen[$productUlid])
                || ! DocumentMath::greaterThanZero((string) $input['quantity'])) {
                return response()->json(['message' => 'Products must be unique and quantity greater than zero.'], 422);
            }
            $seen[$productUlid] = true;
            $product = DB::table('products')->where('tenant_id', $tenantId)
                ->where('ulid', $productUlid)->where('is_active', true)
                ->first(['id', 'sku', 'name', 'sale_price']);
            if ($product === null) {
                return response()->json(['message' => 'Product unavailable in this tenant.'], 404);
            }

            $available = (string) DB::table('stock_movements')
                ->where('tenant_id', $tenantId)->where('warehouse_id', $warehouse->id)
                ->where('product_id', $product->id)
                ->selectRaw('COALESCE(SUM(quantity),0)::text AS balance')->first()->balance;
            if (! DocumentMath::covers($available, (string) $input['quantity'])) {
                return response()->json([
                    'message' => "Insufficient stock for {$product->name}. Available {$available}.",
                ], 422);
            }

            $qty = (string) $input['quantity'];
            $price = (string) $product->sale_price; // Server-owned price, never client-supplied.
            $lines[] = [
                'product_id' => $product->id, 'sku' => $product->sku, 'name' => $product->name,
                'quantity' => $qty, 'unit_price' => $price,
                'line_total' => DocumentMath::line($qty, $price),
            ];
        }

        $total = DocumentMath::sum(array_column($lines, 'line_total'));
        $paid = (string) $data['amount_paid'];
        if (! DocumentMath::covers($paid, $total)) {
            return response()->json(['message' => "Cash tendered is below total {$total}."], 422);
        }
        $change = DocumentMath::change($paid, $total);
        $now = now();
        $saleUlid = (string) Str::ulid();
        $saleId = DB::table('sales')->insertGetId([
            'tenant_id' => $tenantId, 'warehouse_id' => $warehouse->id,
            'cash_shift_id' => CashShiftScope::activeId($tenantId, (int) $warehouse->id, (int) $request->user()->getKey()),
            'customer_id' => $customerId, 'created_by' => $request->user()->getKey(),
            'ulid' => $saleUlid, 'idempotency_key' => $key, 'payload_hash' => $signature,
            'subtotal' => $total, 'total' => $total, 'amount_paid' => $paid,
            'change_due' => $change, 'payment_method' => 'cash', 'status' => 'posted',
            'created_at' => $now, 'updated_at' => $now,
        ]);

        foreach ($lines as $line) {
            DB::table('sale_lines')->insert([
                'tenant_id' => $tenantId, 'sale_id' => $saleId,
                'product_id' => $line['product_id'], 'ulid' => (string) Str::ulid(),
                'sku' => $line['sku'], 'product_name' => $line['name'],
                'quantity' => $line['quantity'], 'unit_price' => $line['unit_price'],
                'line_total' => $line['line_total'],
            ]);
            DB::table('stock_movements')->insert([
                'tenant_id' => $tenantId, 'warehouse_id' => $warehouse->id,
                'product_id' => $line['product_id'], 'sale_id' => $saleId,
                'created_by' => $request->user()->getKey(),
                'ulid' => (string) Str::ulid(), 'idempotency_key' => (string) Str::uuid(),
                'payload_hash' => $signature, 'type' => 'sale',
                'quantity' => '-'.$line['quantity'], 'unit_cost' => '0.0000',
                'note' => 'Cash sale '.$saleUlid, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        if ($holdId !== null) {
            DB::table('held_sales')->where('tenant_id', $tenantId)
                ->where('id', $holdId)->where('status', 'held')
                ->update(['status' => 'consumed', 'posted_sale_id' => $saleId, 'updated_at' => $now]);
        }

        return response()->json(['data' => [
            'ulid' => $saleUlid, 'total' => $total,
            'change_due' => $change, 'replayed' => false,
        ]], 201);
    }
}
