<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\PlatformPermissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** Non-destructive rollback-only check for Platform Admin suspension. */
final class PlatformAdminStatusTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Only migrated local PostgreSQL ahpos_test is allowed.');
        }
        config()->set('session.driver','array');
        config()->set('cache.default','array');
        DB::beginTransaction();
    }
    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_platform_can_suspend_and_reactivate_tenant_without_erasing_memberships_or_data(): void
    {
        $tenant = Tenant::create(['name'=>'Live Business Pilot']);
        $owner = User::factory()->create();
        $super = User::factory()->create();
        $support = User::factory()->create();
        $membershipId = DB::table('tenant_memberships')->insertGetId([
            'tenant_id'=>$tenant->getKey(), 'user_id'=>$owner->getKey(),
            'status'=>'active','created_at'=>now(),'updated_at'=>now(),
        ]);
        $roleId = DB::table('tenant_roles')->insertGetId([
            'tenant_id'=>$tenant->getKey(),'ulid'=>(string)Str::ulid(),
            'name'=>'Admin Owner','created_at'=>now(),'updated_at'=>now(),
        ]);
        DB::table('tenant_role_permissions')->insert([
            'tenant_id'=>$tenant->getKey(),'role_id'=>$roleId,'permission'=>'products.read',
        ]);
        DB::table('tenant_membership_roles')->insert([
            'tenant_id'=>$tenant->getKey(),'membership_id'=>$membershipId,'role_id'=>$roleId,
        ]);
        $superRole = PlatformPermissions::ensureRole('Super Admin',PlatformPermissions::known());
        $supportRole = PlatformPermissions::ensureRole('Support Operator',['platform.overview.read','platform.admins.read']);
        DB::table('platform_user_roles')->insert([
            ['user_id'=>$super->getKey(),'role_id'=>$superRole],
            ['user_id'=>$support->getKey(),'role_id'=>$supportRole],
        ]);
        $base='/api/platform/admins/'.$tenant->ulid.'/status';

        $this->withSession(['platform_user_id'=>$support->getKey()])->actingAs($support)
            ->patchJson($base,['status'=>'suspended','reason'=>'Compliance review'])
            ->assertForbidden();

        $this->withSession(['platform_user_id'=>$super->getKey()])->actingAs($super)
            ->patchJson($base,['status'=>'suspended','reason'=>'Compliance review'])
            ->assertOk()->assertJsonPath('data.status','suspended');
        $this->assertSame('suspended',DB::table('tenants')->where('id',$tenant->getKey())->value('status'));
        $this->assertSame(1,DB::table('tenant_memberships')
            ->where('tenant_id',$tenant->getKey())->where('user_id',$owner->getKey())->count());

        $this->withSession(['platform_user_id'=>null])->actingAs($owner)
            ->getJson('/api/tenants/'.$tenant->ulid.'/products')->assertNotFound();

        $this->withSession(['platform_user_id'=>$super->getKey()])->actingAs($super)
            ->patchJson($base,['status'=>'active','reason'=>'Review completed'])
            ->assertOk()->assertJsonPath('data.status','active');
        $this->assertSame(2,DB::table('platform_audit_events')
            ->where('target_ulid',$tenant->ulid)
            ->where('action','platform.admin.status_changed')->count());

        $this->withSession(['platform_user_id'=>null])->actingAs($owner)
            ->getJson('/api/tenants/'.$tenant->ulid.'/products')->assertOk();

        $this->withSession(['platform_user_id'=>$super->getKey()])->actingAs($super)
            ->patchJson($base,['status'=>'active','reason'=>'Repeat forbidden'])
            ->assertStatus(409);
        $this->patchJson('/api/platform/admins/not-a-ulid/status',[
            'status'=>'suspended','reason'=>'Invalid target',
        ])->assertNotFound();
    }
}
