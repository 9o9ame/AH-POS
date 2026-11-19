<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

final class DocumentPosting
{
    /**
     * Guards duplicate submissions across concurrent HTTP workers.
     * Only call inside tenant.db-scope PostgreSQL transaction.
     */
    public static function lockKey(int $tenantId, string $kind, string $key): void
    {
        DB::select('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
            "ahpos:{$tenantId}:{$kind}:{$key}",
        ]);
    }

    public static function lockWarehouse(int $tenantId, int $warehouseId): void
    {
        DB::table('warehouses')
            ->where('tenant_id', $tenantId)
            ->where('id', $warehouseId)
            ->lockForUpdate()->first(['id']);
    }

    public static function payloadHash(array $input): string
    {
        return hash('sha256', json_encode($input, JSON_THROW_ON_ERROR));
    }

    public static function assertLocalOnly(): void
    {
        // PHPUnit sets APP_ENV=testing even when the test DB is the same local
        // ahpos_test. Permit that mode only inside an actual test process.
        $approvedEnvironment = app()->environment('local')
            || (app()->environment('testing') && app()->runningUnitTests());

        if (! $approvedEnvironment
            || config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test'
            || ! in_array(config('database.connections.pgsql.host'), ['127.0.0.1', 'localhost'], true)) {
            abort(503, 'Financial posting is disabled until accounting and production release gates are completed.');
        }
    }
}
