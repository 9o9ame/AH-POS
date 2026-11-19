<?php

namespace App\Http\Controllers;

use App\Support\DocumentMath;
use App\Support\DocumentPosting;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CashShiftController extends Controller
{
    public function index(Request $request, TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();
        $cashierId = $request->user()->getKey();

        $shifts = DB::table('cash_shifts as s')
            ->join('warehouses as w', function ($join): void {
                $join->on('w.tenant_id', '=', 's.tenant_id')
                    ->on('w.id', '=', 's.warehouse_id');
            })
            ->leftJoin('cash_shift_closures as c', function ($join): void {
                $join->on('c.tenant_id', '=', 's.tenant_id')
                    ->on('c.shift_id', '=', 's.id');
            })
            ->where('s.tenant_id', $tenantId)->where('s.cashier_id', $cashierId)
            ->orderByDesc('s.id')->limit(30)
            ->get([
                's.ulid', 's.opening_cash', 's.opening_note', 's.created_at',
                'w.ulid as warehouse_ulid', 'w.name as warehouse_name',
                'c.ulid as closure_ulid', 'c.cash_sales', 'c.cash_refunds',
                'c.expected_cash', 'c.counted_cash', 'c.difference', 'c.created_at as closed_at',
            ]);

        $output = [];
        foreach ($shifts as $shift) {
            $item = (array) $shift;
            $item['is_open'] = $shift->closure_ulid === null;
            if ($item['is_open']) {
                $totals = $this->totals($tenantId, $this->getShiftId($tenantId, $shift->ulid));
                $item['cash_sales'] = $totals['sales'];
                $item['cash_refunds'] = $totals['refunds'];
                $item['expected_cash'] = DocumentMath::change(
                    DocumentMath::sum([(string) $shift->opening_cash, $totals['sales']]),
                    $totals['refunds']
                );
            }
            $output[] = $item;
        }
        return response()->json(['data' => $output]);
    }

    public function open(Request $request, TenantContext $context): JsonResponse
    {
        DocumentPosting::assertLocalOnly();
        $data = $request->validate([
            'warehouse_ulid' => ['required', 'ulid'],
            'opening_cash' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
            'opening_note' => ['nullable', 'string', 'max:500'],
        ]);
        $tenantId = $context->id();
        $userId = $request->user()->getKey();
        $warehouse = DB::table('warehouses')->where('tenant_id', $tenantId)
            ->where('ulid', strtoupper($data['warehouse_ulid']))
            ->where('is_active', true)->first(['id']);

        if ($warehouse === null) {
            return response()->json(['message' => 'Active warehouse not found.'], 404);
        }

        DocumentPosting::lockWarehouse($tenantId, (int) $warehouse->id);
        $openShift = $this->active($tenantId, (int) $warehouse->id, $userId);
        if ($openShift !== null) {
            return response()->json(['message' => 'An open shift already exists for this cashier and warehouse.'], 409);
        }

        $ulid = (string) Str::ulid();
        DB::table('cash_shifts')->insert([
            'tenant_id' => $tenantId, 'warehouse_id' => $warehouse->id,
            'cashier_id' => $userId, 'ulid' => $ulid,
            'opening_cash' => $data['opening_cash'],
            'opening_note' => trim((string) ($data['opening_note'] ?? '')) ?: null,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['data' => ['ulid' => $ulid, 'is_open' => true]], 201);
    }

    public function close(Request $request, string $tenant, string $shift, TenantContext $context): JsonResponse
    {
        DocumentPosting::assertLocalOnly();
        $data = $request->validate([
            'counted_cash' => ['required', 'regex:/^(?:0|[1-9][0-9]{0,15})(?:\\.[0-9]{1,4})?$/D'],
            'closing_note' => ['nullable', 'string', 'max:500'],
        ]);
        $tenantId = $context->id();
        $userId = $request->user()->getKey();
        $selected = DB::table('cash_shifts')->where('tenant_id', $tenantId)
            ->where('cashier_id', $userId)->where('ulid', strtoupper($shift))
            ->first(['id', 'warehouse_id', 'opening_cash']);

        if ($selected === null) {
            return response()->json(['message' => 'Cashier shift not found.'], 404);
        }

        // Both POS posting and closure lock warehouse first, then shift.
        DocumentPosting::lockWarehouse($tenantId, (int) $selected->warehouse_id);
        DB::table('cash_shifts')->where('tenant_id', $tenantId)
            ->where('id', $selected->id)->lockForUpdate()->first(['id']);

        $previous = DB::table('cash_shift_closures')
            ->where('tenant_id', $tenantId)->where('shift_id', $selected->id)
            ->first(['ulid']);
        if ($previous !== null) {
            return response()->json(['message' => 'This shift has already been closed.'], 409);
        }

        $totals = $this->totals($tenantId, (int) $selected->id);
        $expected = DocumentMath::change(
            DocumentMath::sum([(string) $selected->opening_cash, $totals['sales']]),
            $totals['refunds']
        );
        // Differences can legitimately be negative; no float math.
        $difference = DocumentMath::change((string) $data['counted_cash'], $expected);
        $ulid = (string) Str::ulid();

        DB::table('cash_shift_closures')->insert([
            'tenant_id' => $tenantId, 'shift_id' => $selected->id,
            'closed_by' => $userId, 'ulid' => $ulid,
            'cash_sales' => $totals['sales'], 'cash_refunds' => $totals['refunds'],
            'expected_cash' => $expected, 'counted_cash' => $data['counted_cash'],
            'difference' => $difference,
            'closing_note' => trim((string) ($data['closing_note'] ?? '')) ?: null,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['data' => [
            'closure_ulid' => $ulid, 'cash_sales' => $totals['sales'],
            'cash_refunds' => $totals['refunds'],
            'expected_cash' => $expected,
            'counted_cash' => $data['counted_cash'],
            'difference' => $difference,
        ]], 201);
    }

    private function getShiftId(int $tenantId, string $ulid): int
    {
        return (int) DB::table('cash_shifts')->where('tenant_id', $tenantId)
            ->where('ulid', $ulid)->value('id');
    }

    private function active(int $tenantId, int $warehouseId, int $userId): ?object
    {
        return DB::table('cash_shifts as s')
            ->where('s.tenant_id', $tenantId)
            ->where('s.warehouse_id', $warehouseId)
            ->where('s.cashier_id', $userId)
            ->whereNotExists(fn ($query) => $query->selectRaw('1')
                ->from('cash_shift_closures as c')
                ->whereColumn('c.tenant_id', 's.tenant_id')
                ->whereColumn('c.shift_id', 's.id'))
            ->first(['s.id']);
    }

    /** @return array{sales:string,refunds:string} */
    private function totals(int $tenantId, int $shiftId): array
    {
        $sales = DB::table('sales')->where('tenant_id', $tenantId)
            ->where('cash_shift_id', $shiftId)
            ->selectRaw('COALESCE(SUM(total),0)::numeric(20,4)::text as amount')->first();
        $refunds = DB::table('sale_returns')->where('tenant_id', $tenantId)
            ->where('cash_shift_id', $shiftId)
            ->selectRaw('COALESCE(SUM(refund_total),0)::numeric(20,4)::text as amount')->first();
        return [
            'sales' => (string) $sales->amount,
            'refunds' => (string) $refunds->amount,
        ];
    }
}
