<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

/**
 * Requires the existing disposable ahpos_test PostgreSQL database, already migrated.
 * Transactions roll back all test records. Never use RefreshDatabase/migrate:fresh.
 */
final class TenantAccessTest extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");
        if ($connection !== 'pgsql' || $database !== 'ahpos_test') {
            throw new RuntimeException('TenantAccessTest only runs on the dedicated ahpos_test PostgreSQL database.');
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

    public function test_guest_cannot_access_tenant_context(): void
    {
        $tenant = Tenant::create(['name' => 'Alpha Test']);

        $this->getJson("/api/tenants/{$tenant->ulid}/context")->assertUnauthorized();
    }

    public function test_authenticated_user_without_membership_cannot_access_tenant(): void
    {
        $tenant = Tenant::create(['name' => 'Alpha Test']);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson("/api/tenants/{$tenant->ulid}/context")
            ->assertNotFound();
    }

    public function test_membership_for_one_tenant_does_not_allow_access_to_another(): void
    {
        $alpha = Tenant::create(['name' => 'Alpha Test']);
        $beta = Tenant::create(['name' => 'Beta Test']);
        $user = User::factory()->create();
        $this->attach($alpha, $user);

        $this->actingAs($user)
            ->getJson("/api/tenants/{$beta->ulid}/context")
            ->assertNotFound();

        $this->getJson("/api/tenants/{$alpha->ulid}/context")
            ->assertOk()
            ->assertJsonPath('data.ulid', $alpha->ulid)
            ->assertJsonMissing(['id' => $alpha->getKey()]);
    }

    public function test_inactive_membership_is_denied(): void
    {
        $tenant = Tenant::create(['name' => 'Alpha Test']);
        $user = User::factory()->create();
        $this->attach($tenant, $user, 'inactive');

        $this->actingAs($user)
            ->getJson("/api/tenants/{$tenant->ulid}/context")
            ->assertNotFound();
    }

    public function test_inactive_tenant_is_denied(): void
    {
        $tenant = Tenant::create(['name' => 'Alpha Test']);
        $tenant->status = 'inactive';
        $tenant->save();
        $user = User::factory()->create();
        $this->attach($tenant, $user);

        $this->actingAs($user)
            ->getJson("/api/tenants/{$tenant->ulid}/context")
            ->assertNotFound();
    }

    private function attach(Tenant $tenant, User $user, string $status = 'active'): void
    {
        DB::table('tenant_memberships')->insert([
            'tenant_id' => $tenant->getKey(),
            'user_id' => $user->getKey(),
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
