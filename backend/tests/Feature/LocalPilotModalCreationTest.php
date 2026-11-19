<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\DevelopmentPasswordRules;
use App\Support\PlatformPermissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class LocalPilotModalCreationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Only existing local ahpos_test PostgreSQL allowed.');
        }
        config()->set('session.driver','array');
        config()->set('cache.default','array');
        DB::beginTransaction();
    }
    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_local_admin_and_platform_staff_forms_allow_three_character_passwords_and_never_share_memberships(): void
    {
        $super = User::factory()->create();
        $roleId = PlatformPermissions::ensureRole('Super Admin', PlatformPermissions::known());
        DB::table('platform_user_roles')->insert([
            'user_id'=>$super->getKey(),'role_id'=>$roleId,
        ]);
        $this->withSession(['platform_user_id'=>$super->getKey()])->actingAs($super);

        $adminEmail = 'modal-admin-'.Str::lower(Str::random(10)).'@example.test';
        $admin = $this->postJson('/api/platform/admins', [
            'business_name'=>'Modal Creation Pilot',
            'owner_name'=>'Tenant Owner',
            'owner_email'=>$adminEmail,
            'password'=>'abc',
        ])->assertCreated()->json('data');
        $this->assertNotEmpty($admin['ulid']);
        $owner = User::query()->where('email',$adminEmail)->firstOrFail();
        $this->assertTrue(Hash::check('abc',$owner->password));
        $this->assertSame(1,DB::table('tenant_memberships')
            ->where('user_id',$owner->getKey())->count());

        $operatorEmail = 'modal-support-'.Str::lower(Str::random(10)).'@example.test';
        $staff = $this->postJson('/api/platform/staff', [
            'name'=>'Support Local',
            'email'=>$operatorEmail,
            'password'=>'xyz',
            'role'=>'Support Operator',
        ])->assertCreated()->json('data');
        $this->assertSame($operatorEmail,$staff['email']);
        $operator = User::query()->where('email',$operatorEmail)->firstOrFail();
        $this->assertTrue(Hash::check('xyz',$operator->password));
        $this->assertSame(0,DB::table('tenant_memberships')
            ->where('user_id',$operator->getKey())->count());
        $this->assertSame(0,DB::table('platform_user_roles')
            ->where('user_id',$owner->getKey())->count());

        // Production/nonlocal must retain strong password restrictions
        // even if the frontend accidentally submits a short string.
        $original = config('database.connections.pgsql.database');
        try {
            config()->set('database.connections.pgsql.database','not_local_pilot');
            $this->assertTrue(Validator::make(
                ['password'=>'abc'],['password'=>DevelopmentPasswordRules::creation()],
            )->fails());
        } finally {
            config()->set('database.connections.pgsql.database',$original);
        }
    }
}
