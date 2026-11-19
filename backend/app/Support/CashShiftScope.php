<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Attach a cash document to its cashier's active warehouse shift, if any.
 * Caller must already hold the warehouse row lock. The session row lock
 * serializes with close, preventing cash documents being posted after close.
 */
final class CashShiftScope
{
    public static function activeId(int $tenantId, int $warehouseId, int $cashierId): ?int
    {
        $shift = DB::table('cash_shifts as sh')
            ->where('sh.tenant_id', $tenantId)
            ->where('sh.warehouse_id', $warehouseId)
            ->where('sh.cashier_id', $cashierId)
            ->whereNotExists(fn ($query) => $query->selectRaw('1')
                ->from('cash_shift_closures as cc')
                ->whereColumn('cc.shift_id', 'sh.id')
                ->whereColumn('cc.tenant_id', 'sh.tenant_id'))
            ->orderByDesc('sh.id')
            ->lockForUpdate()
            ->first(['sh.id']);

        return $shift === null ? null : (int) $shift->id;
    }
}
