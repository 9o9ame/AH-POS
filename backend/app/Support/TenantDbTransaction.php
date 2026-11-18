<?php

namespace App\Support;

use Closure;
use Illuminate\Support\Facades\DB;

/**
 * Execute authorized tenant work within a transaction-scoped PostgreSQL context.
 * This is only the application side of a future RLS rollout; no RLS is enabled.
 * Call only after ResolveTenantContext authenticated membership verification.
 */
final class TenantDbTransaction
{
    public function run(Closure $callback): mixed
    {
        $tenantId = app(TenantContext::class)->id();

        return DB::transaction(function () use ($tenantId, $callback): mixed {
            // The third argument true means SET LOCAL (transaction scope).
            // This does not authorize a tenant by itself; middleware has already
            // resolved a membership and the DB role must remain server-private.
            DB::select('SELECT set_config(?, ?, true)', ['app.tenant_id', (string) $tenantId]);

            return $callback();
        });
    }
}
