<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** PostgreSQL tenant composite-FK regression tests. All created rows roll back. */
final class TenantRbacIntegrityTest extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('TenantRbacIntegrityTest requires PostgreSQL ahpos_test.');
        }

        DB::beginTransaction();
        $this->transactionStarted = true;
    }

    protected function tearDown(): void
    {
        try {
            if ($this->transactionStarted) {
                DB::rollBack();
            }
        } finally {
            parent::tearDown();
        }
    }

    public function test_role_from_different_tenant_cannot_be_assigned_to_membership(): void
    {
        $alpha = Tenant::create(['name' => 'Role Owner A']);
        $beta = Tenant::create(['name' => 'Member Owner B']);
        $roleId = $this->role($alpha);
        $membershipId = $this->membership($beta);

        try {
            // Nest transaction creates a SAVEPOINT so FK error cannot poison
            // the surrounding rollback-only PostgreSQL test transaction.
            DB::transaction(fn () => DB::table('tenant_membership_roles')->insert([
                'tenant_id' => $beta->getKey(),
                'membership_id' => $membershipId,
                'role_id' => $roleId,
            ]));
            $this->fail('Cross-tenant role assignment unexpectedly succeeded.');
        } catch (QueryException $exception) {
            $this->assertSame('23503', $exception->errorInfo[0] ?? null);
        }

        $this->assertSame(0, DB::table('tenant_membership_roles')->count());
    }

    public function test_role_permission_cannot_reference_role_in_other_tenant(): void
    {
        $alpha = Tenant::create(['name' => 'Role Owner A']);
        $beta = Tenant::create(['name' => 'Permission Owner B']);
        $roleId = $this->role($alpha);

        try {
            DB::transaction(fn () => DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $beta->getKey(),
                'role_id' => $roleId,
                'permission' => 'tenant.settings.read',
            ]));
            $this->fail('Cross-tenant role permission unexpectedly succeeded.');
        } catch (QueryException $exception) {
            $this->assertSame('23503', $exception->errorInfo[0] ?? null);
        }

        $this->assertSame(0, DB::table('tenant_role_permissions')->count());
    }

    private function role(Tenant $tenant): int
    {
        return (int) DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(),
            'ulid' => (string) Str::ulid(),
            'name' => 'Role',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function membership(Tenant $tenant): int
    {
        return (int) DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(),
            'user_id' => User::factory()->create()->getKey(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
