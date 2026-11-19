<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

final class OperationsReportController extends Controller
{
    public function overview(TenantContext $context): JsonResponse
    {
        $tenantId = $context->id();

        $sales = DB::table('sales')->where('tenant_id', $tenantId)
            ->selectRaw('COUNT(*) AS document_count, COALESCE(SUM(total),0)::numeric(20,4)::text AS total')
            ->first();
        $purchases = DB::table('purchases')->where('tenant_id', $tenantId)
            ->selectRaw('COUNT(*) AS document_count, COALESCE(SUM(total),0)::numeric(20,4)::text AS total')
            ->first();

        $daily = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->selectRaw('DATE(created_at) AS day, COUNT(*) AS sale_count, SUM(total)::numeric(20,4)::text AS total')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('day')
            ->get();

        $stocked = DB::table('stock_movements')
            ->where('tenant_id', $tenantId)
            ->selectRaw('product_id, warehouse_id, SUM(quantity) AS balance')
            ->groupBy('product_id', 'warehouse_id')
            ->havingRaw('SUM(quantity) > 0')
            ->get()->count();

        return response()->json(['data' => [
            'cash_sales' => [
                'count' => (int) ($sales->document_count ?? 0),
                'total' => (string) ($sales->total ?? '0.0000'),
            ],
            'purchases' => [
                'count' => (int) ($purchases->document_count ?? 0),
                'total' => (string) ($purchases->total ?? '0.0000'),
            ],
            'stocked_product_locations' => $stocked,
            'daily_cash_sales' => $daily,
            'disclaimer' => 'Local pilot operational totals; not accounting, tax, profit or reconciled financial reports.',
        ]]);
    }
}
