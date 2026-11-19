<?php

namespace App\Http\Controllers;

use App\Support\DocumentPosting;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class HeldSaleController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();
        $cashierId = $request->user()->getKey();
        $drafts = DB::table('held_sales as h')
            ->leftJoin('warehouses as w', function ($join): void {
                $join->on('w.tenant_id', '=', 'h.tenant_id')->on('w.id', '=', 'h.warehouse_id');
            })
            ->leftJoin('parties as c', function ($join): void {
                $join->on('c.tenant_id', '=', 'h.tenant_id')->on('c.id', '=', 'h.customer_id');
            })
            ->where('h.tenant_id', $tenantId)->where('h.cashier_id', $cashierId)
            ->where('h.status', 'held')->orderByDesc('h.updated_at')->limit(100)
            ->get([
                'h.ulid', 'h.client_ref', 'h.title', 'h.amount_paid', 'h.lines',
                'h.created_at', 'h.updated_at',
                'w.ulid as warehouse_ulid', 'w.name as warehouse_name',
                'c.ulid as customer_ulid', 'c.name as customer_name',
            ]);

        $decoded = $drafts->map(function (object $draft): array {
            $data = (array) $draft;
            $data['lines'] = json_decode((string) $draft->lines, true, 512, JSON_THROW_ON_ERROR);
            return $data;
        });

        $productUlids = $decoded->flatMap(fn (array $draft) =>
            array_column($draft['lines'], 'product_ulid'))->unique()->values()->all();
        $products = DB::table('products')->where('tenant_id', $tenantId)
            ->whereIn('ulid', $productUlids)
            ->get(['ulid', 'sku', 'name', 'barcode', 'sale_price', 'is_active'])->keyBy('ulid');

        return response()->json(['data' => $decoded->map(function (array $draft) use ($products): array {
            $draft['lines'] = array_map(function (array $line) use ($products): array {
                $product = $products->get($line['product_ulid']);
                return [
                    'product_ulid' => $line['product_ulid'],
                    'quantity' => $line['quantity'],
                    'product' => $product,
                ];
            }, $draft['lines']);
            return $draft;
        })->values()]);
    }

    public function save(Request $request, TenantContext $context): JsonResponse
    {
        DocumentPosting::assertLocalOnly();
        $data = $request->validate([
            'client_ref' => ['required', 'uuid'],
            'title' => ['required', 'string', 'max:120'],
            'warehouse_ulid' => ['nullable', 'ulid'],
            'customer_ulid' => ['nullable', 'ulid'],
            'amount_paid' => ['nullable', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
            'lines' => ['required', 'array', 'min:1', 'max:50'],
            'lines.*.product_ulid' => ['required', 'ulid'],
            'lines.*.quantity' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,13})(?:\\.[0-9]{1,6})?$/D'],
        ]);
        $tenantId = $context->id();
        $cashierId = $request->user()->getKey();
        $key = strtolower($data['client_ref']);
        DocumentPosting::lockKey($tenantId, 'sale-hold', $key);

        $warehouseId = null;
        if (! empty($data['warehouse_ulid'])) {
            $warehouseId = DB::table('warehouses')
                ->where('tenant_id', $tenantId)
                ->where('ulid', strtoupper($data['warehouse_ulid']))
                ->where('is_active', true)->value('id');
            if ($warehouseId === null) {
                return response()->json(['message' => 'Warehouse unavailable in this tenant.'], 404);
            }
        }

        $customerId = null;
        if (! empty($data['customer_ulid'])) {
            $customerId = DB::table('parties')
                ->where('tenant_id', $tenantId)
                ->where('ulid', strtoupper($data['customer_ulid']))
                ->where('type', 'customer')->where('is_active', true)->value('id');
            if ($customerId === null) {
                return response()->json(['message' => 'Customer unavailable in this tenant.'], 404);
            }
        }

        $seen = [];
        $lines = [];
        foreach ($data['lines'] as $line) {
            $productUlid = strtoupper($line['product_ulid']);
            if (isset($seen[$productUlid])) {
                return response()->json(['message' => 'Duplicate product in held invoice.'], 422);
            }
            $seen[$productUlid] = true;
            if (! DB::table('products')->where('tenant_id', $tenantId)
                ->where('ulid', $productUlid)->where('is_active', true)->exists()) {
                return response()->json(['message' => 'Product unavailable in this tenant.'], 404);
            }
            if (! \App\Support\DocumentMath::greaterThanZero((string) $line['quantity'])) {
                return response()->json(['message' => 'Hold quantity must be positive.'], 422);
            }
            $lines[] = ['product_ulid' => $productUlid, 'quantity' => (string) $line['quantity']];
        }

        $old = DB::table('held_sales')
            ->where('tenant_id', $tenantId)->where('cashier_id', $cashierId)
            ->where('client_ref', $key)->lockForUpdate()->first(['id', 'ulid', 'status']);
        if ($old !== null && $old->status !== 'held') {
            return response()->json(['message' => 'Held invoice already completed or discarded.'], 409);
        }

        $fields = [
            'title' => trim($data['title']),
            'warehouse_id' => $warehouseId,
            'customer_id' => $customerId,
            'amount_paid' => $data['amount_paid'] ?? null,
            'lines' => json_encode($lines, JSON_THROW_ON_ERROR),
            'updated_at' => now(),
        ];
        if ($old !== null) {
            DB::table('held_sales')->where('tenant_id', $tenantId)->where('id', $old->id)
                ->update($fields);
            return response()->json(['data' => ['ulid' => $old->ulid, 'saved' => true]]);
        }

        $ulid = (string) Str::ulid();
        DB::table('held_sales')->insert([
            ...$fields,
            'tenant_id' => $tenantId,
            'cashier_id' => $cashierId,
            'client_ref' => $key,
            'ulid' => $ulid,
            'status' => 'held',
            'created_at' => now(),
        ]);

        return response()->json(['data' => ['ulid' => $ulid, 'saved' => true]], 201);
    }

    public function discard(Request $request, string $tenant, string $hold, TenantContext $context): JsonResponse
    {
        DocumentPosting::assertLocalOnly();
        $updated = DB::table('held_sales')
            ->where('tenant_id', $context->id())
            ->where('cashier_id', $request->user()->getKey())
            ->where('ulid', strtoupper($hold))
            ->where('status', 'held')
            ->update(['status' => 'discarded', 'updated_at' => now()]);
        if ($updated === 0) {
            return response()->json(['message' => 'Held invoice not found or already completed.'], 404);
        }
        return response()->json(['data' => ['discarded' => true]]);
    }
}
