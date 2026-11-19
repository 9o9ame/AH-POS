<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\PlatformPermissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class PlatformAssignExistingOwnerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Only existing ahpos_test PostgreSQL may be used.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_platform_can_explicitly_assign_existing_business_owner_but_not_cross_tenant_members(): void
    {
        $platform = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Existing Local Business']);
        $secondTenant = Tenant::create(['name' => 'Other Existing Business']);

        $membershipId = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $member->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('tenant_memberships')->insert([
            'tenant_id' => $secondTenant->getKey(), 'user_id' => $outsider->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $base = '/api/platform/admins/'.$tenant->ulid;
        $this->actingAs($member)
            ->getJson($base.'/owner-candidates')->assertUnauthorized();
        $this->postJson($base.'/assign-owner', [
            'owner_email' => $member->email, 'confirm' => true,
        ])->assertUnauthorized();

        $roleId = PlatformPermissions::ensureRole('Super Admin', PlatformPermissions::known());
        DB::table('platform_user_roles')->insert([
            'user_id' => $platform->getKey(), 'role_id' => $roleId,
        ]);
        $this->withSession(['platform_user_id'=>$platform->getKey()])->actingAs($platform)
            ->getJson($base.'/owner-candidates')->assertOk()
            ->assertJsonPath('data.0.email', $member->email);

        $this->postJson($base.'/assign-owner', [
            'owner_email' => $outsider->email, 'confirm' => true,
        ])->assertNotFound();
        $this->assertSame(0, DB::table('tenant_membership_roles')
            ->where('tenant_id', $tenant->getKey())
            ->where('membership_id', $membershipId)->count());

        $this->postJson($base.'/assign-owner', [
            'owner_email' => $member->email, 'confirm' => true,
        ])->assertOk()->assertJsonPath('data.owner_email', $member->email);

        $role = DB::table('tenant_roles')->where('tenant_id', $tenant->getKey())
            ->where('name', 'Admin Owner')->first();
        $this->assertNotNull($role);
        $this->assertSame(1, DB::table('tenant_membership_roles')
            ->where('tenant_id', $tenant->getKey())
            ->where('membership_id', $membershipId)
            ->where('role_id', $role->id)->count());
        $this->assertSame(0, DB::table('platform_user_roles')
            ->where('user_id', $member->getKey())->count());

        $this->postJson($base.'/assign-owner', [
            'owner_email' => $member->email, 'confirm' => true,
        ])->assertStatus(409);

        $this->withSession(['platform_user_id'=>null])->actingAs($member)
            ->getJson('/api/tenants/'.$tenant->ulid.'/staff')->assertOk();
        $this->getJson('/api/platform/overview')->assertUnauthorized();
        $this->getJson('/api/tenants/'.$secondTenant->ulid.'/staff')->assertNotFound();
    }
}
