<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantStaffAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class TenantStaffDeviceWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Migrated PostgreSQL ahpos_test required.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    private function grantOwner(Tenant $tenant, User $user): void
    {
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Admin Owner', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach ([
            'tenant.members.read', 'tenant.members.manage',
            'tenant.devices.read', 'tenant.devices.manage', 'products.read',
        ] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role, 'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);
    }

    public function test_tenant_staff_is_role_scoped_and_device_approval_is_required(): void
    {
        $tenant = Tenant::create(['name' => 'Staff Security A']);
        $foreign = Tenant::create(['name' => 'Staff Security B']);
        $admin = User::factory()->create();
        $foreignAdmin = User::factory()->create();
        $this->grantOwner($tenant, $admin);
        $this->grantOwner($foreign, $foreignAdmin);
        $url = '/api/tenants/'.$tenant->ulid;
        $staffEmail = 'cashier-'.Str::lower(Str::random(12)).'@example.test';

        $this->actingAs($foreignAdmin)
            ->postJson($url.'/staff', [
                'name' => 'Wrong Tenant', 'email' => $staffEmail,
                'password' => 'StrongLocalPass12!', 'role' => 'Cashier',
            ])->assertNotFound();

        $this->actingAs($admin);
        $this->getJson($url.'/staff')->assertOk();
        $this->postJson($url.'/staff', [
            'name' => 'Counter Cashier', 'email' => $staffEmail,
            'password' => 'StrongLocalPass12!', 'role' => 'Cashier',
        ])->assertCreated()->assertJsonPath('data.requires_device_approval', true);
        $staff = User::query()->where('email', $staffEmail)->firstOrFail();
        $this->assertSame(0, DB::table('platform_user_roles')
            ->where('user_id', $staff->getKey())->count());
        $membership = DB::table('tenant_memberships')->where('tenant_id', $tenant->getKey())
            ->where('user_id', $staff->getKey())->first();
        $this->assertTrue((bool) $membership->requires_device_approval);

        $this->actingAs($staff);
        $this->getJson($url.'/products')->assertStatus(423)
            ->assertJsonPath('code', 'DEVICE_APPROVAL_REQUIRED');
        $this->getJson($url.'/staff')->assertStatus(423);
        $this->getJson($url.'/device/status')
            ->assertOk()->assertJsonPath('data.status', 'unregistered');
        $request = $this->postJson($url.'/device/request', [
            'device_name' => 'Front Counter Browser',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');
        $deviceUlid = $request->json('data.device_ulid');
        $this->assertSame(1, DB::table('tenant_staff_devices')
            ->where('ulid', $deviceUlid)->where('status', 'pending')->count());

        $this->actingAs($foreignAdmin)
            ->postJson($url.'/devices/'.$deviceUlid.'/decision', ['decision' => 'approve'])
            ->assertNotFound();
        $this->actingAs($admin)
            ->postJson($url.'/devices/'.$deviceUlid.'/decision', ['decision' => 'approve'])
            ->assertOk()->assertJsonPath('data.status', 'approved');
        $this->assertSame(1, DB::table('tenant_staff_devices')
            ->where('ulid', $deviceUlid)->where('status', 'approved')->count());

        // The approval is tied to the original secret stored only as a hash,
        // not to a user-controlled device ULID or another tenant's session.
        $rawToken = str_repeat('ab', 32);
        DB::table('tenant_staff_devices')->where('ulid', $deviceUlid)
            ->update(['token_hash' => hash('sha256', $rawToken)]);
        $fakeRequest = Request::create($url.'/products');
        $fakeRequest->cookies->set(TenantStaffAccess::cookieName($tenant->ulid), $rawToken);
        $this->assertSame('approved', TenantStaffAccess::currentDevice(
            $fakeRequest, (int) $tenant->getKey(), (int) $membership->id, $tenant->ulid,
        )?->status);

        $this->postJson($url.'/devices/'.$deviceUlid.'/decision', ['decision' => 'revoke'])
            ->assertOk()->assertJsonPath('data.status', 'revoked');
        $this->assertSame('revoked', TenantStaffAccess::currentDevice(
            $fakeRequest, (int) $tenant->getKey(), (int) $membership->id, $tenant->ulid,
        )?->status);
        $this->actingAs($staff)
            ->getJson($url.'/products')->assertStatus(423);

        $this->actingAs($admin)
            ->patchJson($url.'/staff/'.rawurlencode($staffEmail).'/status', [
                'status' => 'suspended',
            ])->assertOk()->assertJsonPath('data.status', 'suspended');
        $this->actingAs($staff)
            ->getJson($url.'/device/status')->assertNotFound();
    }
}
