<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\PlatformPermissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class PlatformRealmSeparationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Only existing migrated ahpos_test can run this test.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_business_and_platform_sign_in_are_separate_and_transfer_leaves_old_tenant_intact(): void
    {
        $old = User::create([
            'name' => 'Original Tenant Ali',
            'email' => 'original-'.Str::lower(Str::random(8)).'@example.test',
            'password' => 'OriginalStrong123!Pass',
        ]);
        $tenant = Tenant::create(['name' => 'Ali POS']);
        DB::table('tenant_memberships')->insert([
            'tenant_id' => $tenant->getKey(), 'user_id' => $old->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = PlatformPermissions::ensureRole('Super Admin', PlatformPermissions::known());
        DB::table('platform_user_roles')->insert([
            'user_id' => $old->getKey(), 'role_id' => $role,
        ]);

        $this->postJson('/api/login', [
            'email' => $old->email, 'password' => 'OriginalStrong123!Pass',
        ])->assertOk();
        $this->getJson('/api/me')->assertOk();
        // Business cookie alone does not authorize Platform endpoints.
        $this->getJson('/api/platform/me')->assertUnauthorized();

        $this->postJson('/api/platform/auth/login', [
            'email' => $old->email, 'password' => 'OriginalStrong123!Pass',
        ])->assertOk();
        $this->getJson('/api/platform/me')->assertOk();
        // Transitioning to Platform invalidates tenant web-auth realm.
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/tenants/'.$tenant->ulid.'/context')->assertUnauthorized();

        $newEmail = 'platform-dedicated-'.Str::lower(Str::random(8)).'@example.test';
        $this->postJson('/api/platform/auth/separate-identity', [
            'name' => 'Vendor Super Admin',
            'email' => $newEmail,
            'password' => 'NewPlatform123!Secure',
            'current_password' => 'OriginalStrong123!Pass',
            'confirm' => true,
        ])->assertOk()->assertJsonPath('data.email', $newEmail);

        $new = User::query()->where('email', $newEmail)->firstOrFail();
        $this->assertSame(0, DB::table('platform_user_roles')->where('user_id', $old->getKey())->count());
        $this->assertGreaterThan(0, DB::table('platform_user_roles')->where('user_id', $new->getKey())->count());
        $this->assertSame(0, DB::table('tenant_memberships')->where('user_id', $new->getKey())->count());
        $this->assertSame(1, DB::table('tenant_memberships')
            ->where('user_id', $old->getKey())->where('tenant_id', $tenant->getKey())->count());

        $this->getJson('/api/platform/me')->assertUnauthorized();
        $this->postJson('/api/platform/auth/login', [
            'email' => $old->email, 'password' => 'OriginalStrong123!Pass',
        ])->assertUnauthorized();
        $this->postJson('/api/login', [
            'email' => $old->email, 'password' => 'OriginalStrong123!Pass',
        ])->assertOk();
        $this->getJson('/api/my/tenants')->assertOk();

        $this->postJson('/api/platform/auth/login', [
            'email' => $newEmail, 'password' => 'NewPlatform123!Secure',
        ])->assertOk();
        $this->getJson('/api/platform/me')->assertOk();
        $this->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/login', [
            'email' => $newEmail, 'password' => 'NewPlatform123!Secure',
        ])->assertForbidden();
    }
}
