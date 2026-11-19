<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\PlatformPermissions;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

/** One focused platform-vs-tenant security test, rolled back in ahpos_test. */
final class PlatformOnboardingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Only migrated local PostgreSQL ahpos_test is permitted.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_platform_bootstrap_role_creates_admin_without_leaking_platform_authority(): void
    {
        $super = User::factory()->create();
        $ordinary = User::factory()->create();
        $this->getJson('/api/platform/me')->assertUnauthorized();
        $this->actingAs($ordinary)->getJson('/api/platform/overview')->assertForbidden();
        $this->getJson('/api/platform/me')->assertForbidden();

        $roleId = PlatformPermissions::ensureRole('Super Admin', PlatformPermissions::known());
        DB::table('platform_user_roles')->insert([
            'user_id' => $super->getKey(), 'role_id' => $roleId,
        ]);

        $this->actingAs($super)->getJson('/api/platform/me')
            ->assertOk()->assertJsonFragment(['platform.admins.create']);
        $created = $this->postJson('/api/platform/admins', [
            'business_name' => 'Retail Demo Store',
            'owner_name' => 'Store Owner',
            'owner_email' => 'owner-demo-'.uniqid().'@example.com',
            'password' => 'StrongTest123!Password',
        ])->assertCreated()->json('data');
        $this->assertNotEmpty($created['ulid']);

        $tenantId = DB::table('tenants')->where('ulid', $created['ulid'])->value('id');
        $this->assertNotNull($tenantId);
        $this->assertSame(1, DB::table('tenant_memberships')
            ->where('tenant_id', $tenantId)->where('status', 'active')->count());
        $this->assertSame(1, DB::table('tenant_roles')
            ->where('tenant_id', $tenantId)->where('name', 'Admin Owner')->count());
        $this->assertSame(1, DB::table('platform_audit_events')
            ->where('action', 'platform.admin.created')->where('target_ulid', $created['ulid'])->count());

        // Super Admin's platform role alone must NOT grant the created tenant.
        $this->getJson('/api/tenants/'.$created['ulid'].'/products')->assertNotFound();

        $owner = User::query()->where('email', $created['owner_email'])->firstOrFail();
        $this->actingAs($owner)->getJson('/api/platform/overview')->assertForbidden();
        $this->getJson('/api/tenants/'.$created['ulid'].'/products')->assertOk();

        $this->actingAs($super);
        $staff = $this->postJson('/api/platform/staff', [
            'name' => 'Support Worker', 'email' => 'support-'.uniqid().'@example.com',
            'password' => 'StrongTest123!Password', 'role' => 'Support Operator',
        ])->assertCreated()->json('data');
        $support = User::query()->where('email', $staff['email'])->firstOrFail();
        $this->actingAs($support);
        $this->getJson('/api/platform/admins')->assertOk();
        $this->postJson('/api/platform/admins', [
            'business_name' => 'Forbidden Store', 'owner_name' => 'No Permissions',
            'owner_email' => 'denied-'.uniqid().'@example.com',
            'password' => 'StrongTest123!Password',
        ])->assertForbidden();
        $this->getJson('/api/platform/audit')->assertForbidden();
        $this->getJson('/api/tenants/'.$created['ulid'].'/products')->assertNotFound();

        $this->assertSame(1, DB::table('tenants')->where('ulid', $created['ulid'])->count());
    }
}
