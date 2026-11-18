<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/**
 * Requires migrated PostgreSQL ahpos_test. Rows always rollback.
 * NEVER run migrate:fresh or RefreshDatabase on the persistent test DB.
 */
final class TenantRbacTest extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('TenantRbacTest requires PostgreSQL ahpos_test.');
        }

        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
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

    public function test_guest_cannot_use_permission_probe(): void
    {
        $tenant = Tenant::create(['name' => 'Alpha RBAC']);
        $this->getJson("/api/tenants/{$tenant->ulid}/rbac-check")->assertUnauthorized();
    }

    public function test_active_member_without_role_is_forbidden(): void
    {
        [$tenant, $user, $membership] = $this->member();

        $this->actingAs($user)
            ->getJson("/api/tenants/{$tenant->ulid}/rbac-check")
            ->assertForbidden();
    }

    public function test_explicit_permission_allows_only_members_own_tenant(): void
    {
        [$alpha, $user, $membership] = $this->member();
        $beta = Tenant::create(['name' => 'Beta RBAC']);

        $roleId = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $alpha->getKey(),
            'ulid' => (string) Str::ulid(),
            'name' => 'Reader',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_role_permissions')->insert([
            'tenant_id' => $alpha->getKey(),
            'role_id' => $roleId,
            'permission' => 'tenant.settings.read',
        ]);
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $alpha->getKey(),
            'membership_id' => $membership,
            'role_id' => $roleId,
        ]);

        $this->actingAs($user)
            ->getJson("/api/tenants/{$alpha->ulid}/rbac-check")
            ->assertOk()
            ->assertJsonPath('data.authorized', true);

        $this->getJson("/api/tenants/{$beta->ulid}/rbac-check")
            ->assertNotFound();
    }

    public function test_wrong_permission_or_inactive_membership_denies(): void
    {
        [$tenant, $user, $membership] = $this->member();
        $roleId = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(),
            'ulid' => (string) Str::ulid(),
            'name' => 'Member manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tenant_role_permissions')->insert([
            'tenant_id' => $tenant->getKey(),
            'role_id' => $roleId,
            'permission' => 'tenant.members.read',
        ]);
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(),
            'membership_id' => $membership,
            'role_id' => $roleId,
        ]);

        $this->actingAs($user)
            ->getJson("/api/tenants/{$tenant->ulid}/rbac-check")
            ->assertForbidden();

        DB::table('tenant_role_permissions')->insert([
            'tenant_id' => $tenant->getKey(),
            'role_id' => $roleId,
            'permission' => 'tenant.settings.read',
        ]);
        DB::table('tenant_memberships')->where('id', $membership)
            ->update(['status' => 'inactive']);

        $this->getJson("/api/tenants/{$tenant->ulid}/rbac-check")
            ->assertNotFound();
    }

    /** @return array{0:Tenant,1:User,2:int} */
    private function member(): array
    {
        $tenant = Tenant::create(['name' => 'Alpha RBAC']);
        $user = User::factory()->create();
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(),
            'user_id' => $user->getKey(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$tenant, $user, (int) $membership];
    }
}
