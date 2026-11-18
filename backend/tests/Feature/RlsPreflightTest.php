<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

/**
 * Read-only inspection on the configured persistent development DB.
 * Does not seed, migrate, or modify any records.
 */
final class RlsPreflightTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('RlsPreflightTest requires PostgreSQL ahpos_test.');
        }
    }

    public function test_read_only_preflight_reports_missing_rls_without_modifying_data(): void
    {
        $before = DB::table('tenant_roles')->count();

        $result = Artisan::call('ahpos:rls-preflight');
        $report = Artisan::output();

        self::assertContains($result, [0, 1]);
        self::assertStringContainsString('Database: ahpos_test', $report);
        self::assertStringContainsString('tenant_roles:', $report);
        self::assertStringContainsString('tenant_role_permissions:', $report);
        self::assertStringContainsString('tenant_membership_roles:', $report);
        self::assertStringContainsString(
            $result === 1 ? 'NOT READY' : 'CATALOG CHECKS PASS ONLY',
            $report
        );
        self::assertSame($before, DB::table('tenant_roles')->count());
    }
}
