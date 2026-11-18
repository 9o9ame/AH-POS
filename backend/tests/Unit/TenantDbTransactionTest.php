<?php

namespace Tests\Unit;

use App\Support\TenantContext;
use App\Support\TenantDbTransaction;
use Illuminate\Support\Facades\DB;
use LogicException;
use RuntimeException;
use Tests\TestCase;

final class TenantDbTransactionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Requires local PostgreSQL ahpos_test.');
        }
    }

    public function test_missing_tenant_context_fails_closed(): void
    {
        $this->expectException(LogicException::class);
        app(TenantDbTransaction::class)->run(fn () => 'unreachable');
    }

    public function test_transaction_local_setting_is_visible_only_during_scope(): void
    {
        app(TenantContext::class)->setFromAuthenticatedMembership(12345);

        $inside = app(TenantDbTransaction::class)->run(function (): string {
            return (string) DB::selectOne("SELECT current_setting('app.tenant_id', true) AS tenant_id")->tenant_id;
        });

        $this->assertSame('12345', $inside);

        // The transaction ended; its setting must not remain authenticated.
        $outside = DB::selectOne("SELECT current_setting('app.tenant_id', true) AS tenant_id")->tenant_id;
        $this->assertNotSame('12345', $outside);
    }

    public function test_transaction_rolls_back_on_exception_and_clears_scope(): void
    {
        app(TenantContext::class)->setFromAuthenticatedMembership(54321);
        try {
            app(TenantDbTransaction::class)->run(function (): never {
                throw new RuntimeException('Simulated failure');
            });
            $this->fail('Expected exception');
        } catch (RuntimeException $exception) {
            $this->assertSame('Simulated failure', $exception->getMessage());
        }

        $outside = DB::selectOne("SELECT current_setting('app.tenant_id', true) AS tenant_id")->tenant_id;
        $this->assertNotSame('54321', $outside);
    }
}
