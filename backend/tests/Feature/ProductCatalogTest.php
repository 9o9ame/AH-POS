<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/**
 * One critical catalog workflow: authorization + server-side tenant ownership.
 * Existing migrated ahpos_test only; test data rolled back, no RefreshDatabase.
 */
final class ProductCatalogTest extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'pgsql' ||
            config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('ProductCatalogTest requires PostgreSQL ahpos_test.');
        }

        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
        $this->transactionStarted = true;
    }

    protected function tearDown(): void
    {
        try {
            if ($this->transactionStarted) DB::rollBack();
        } finally {
            parent::tearDown();
        }
    }

    public function test_authorized_product_creation_and_tenant_isolation(): void
    {
        $alpha = Tenant::create(['name' => 'Product Tenant Alpha']);
        $beta = Tenant::create(['name' => 'Product Tenant Beta']);
        $user = User::factory()->create();

        $membershipId = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $alpha->getKey(),
            'user_id' => $user->getKey(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $roleId = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $alpha->getKey(),
            'ulid' => (string) Str::ulid(),
            'name' => 'Product Author',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        foreach (['products.read', 'products.create'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $alpha->getKey(),
                'role_id' => $roleId,
                'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $alpha->getKey(),
            'membership_id' => $membershipId,
            'role_id' => $roleId,
        ]);

        $this->actingAs($user)->postJson("/api/tenants/{$alpha->ulid}/products", [
            'sku' => '  ITEM-001  ',
            'name' => 'Sample Product',
            'sale_price' => '152.2500',
            'tenant_id' => $beta->getKey(), // Client-forged tenant must be ignored.
        ])->assertCreated()
            ->assertJsonPath('data.sku', 'ITEM-001')
            ->assertJsonPath('data.sale_price', '152.2500')
            ->assertJsonMissingPath('data.tenant_id')
            ->assertJsonMissingPath('data.id');

        $this->assertSame(1, DB::table('products')->where('tenant_id', $alpha->getKey())->count());
        $this->assertSame(0, DB::table('products')->where('tenant_id', $beta->getKey())->count());

        $this->getJson("/api/tenants/{$alpha->ulid}/products")
            ->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/tenants/{$beta->ulid}/products")->assertNotFound();

        $this->postJson("/api/tenants/{$alpha->ulid}/products", [
            'sku' => 'ITEM-001',
            'name' => 'Duplicate SKU',
            'sale_price' => '10',
        ])->assertUnprocessable();
    }

    public function test_member_without_catalog_role_cannot_read_or_create(): void
    {
        $tenant = Tenant::create(['name' => 'Unprivileged Tenant']);
        $user = User::factory()->create();
        DB::table('tenant_memberships')->insert([
            'tenant_id' => $tenant->getKey(),
            'user_id' => $user->getKey(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user)
            ->getJson("/api/tenants/{$tenant->ulid}/products")->assertForbidden();

        $this->postJson("/api/tenants/{$tenant->ulid}/products", [
            'sku' => 'DENIED',
            'name' => 'Not allowed',
            'sale_price' => '1',
        ])->assertForbidden();
    }
}
