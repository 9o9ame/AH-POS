<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** One critical tenant-master integration; all writes rolled back. */
final class ProductDefinitionMastersTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Requires migrated local PostgreSQL ahpos_test.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_master_references_are_tenant_owned_and_parent_category_consistent(): void
    {
        $tenant = Tenant::create(['name' => 'Master A']);
        $other = Tenant::create(['name' => 'Master B']);
        $user = User::factory()->create();
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Master Operator', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['definitions.read', 'definitions.manage', 'products.create', 'products.read'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role, 'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);

        $this->actingAs($user);
        $url = "/api/tenants/{$tenant->ulid}";
        $category = $this->postJson("$url/definitions/categories", [
            'code' => 'GRO', 'name' => 'Groceries',
        ])->assertCreated()->json('data.ulid');
        $otherCategory = $this->postJson("$url/definitions/categories", [
            'code' => 'HOME', 'name' => 'Household',
        ])->assertCreated()->json('data.ulid');
        $subcategory = $this->postJson("$url/definitions/subcategories", [
            'code' => 'DRY', 'name' => 'Dry goods', 'category_ulid' => $category,
        ])->assertCreated()->json('data.ulid');
        $brand = $this->postJson("$url/definitions/brands", [
            'code' => 'GEN', 'name' => 'General Brand',
        ])->assertCreated()->json('data.ulid');
        $unit = $this->postJson("$url/definitions/units", [
            'code' => 'PCS', 'name' => 'Pieces',
        ])->assertCreated()->json('data.ulid');

        $this->postJson("$url/definitions/categories", [
            'code' => 'GRO2', 'name' => 'groceries',
        ])->assertStatus(409);
        $this->getJson("$url/definitions/subcategories")
            ->assertOk()->assertJsonPath('data.0.category_ulid', $category);

        $this->postJson("$url/products", [
            'sku' => 'DEF-1', 'name' => 'Definition-linked product', 'sale_price' => '250.0000',
            'category_ulid' => $category, 'subcategory_ulid' => $subcategory,
            'brand_ulid' => $brand, 'unit_ulid' => $unit,
        ])->assertCreated();
        $this->getJson("$url/products")
            ->assertOk()->assertJsonPath('data.0.category_ulid', $category)
            ->assertJsonPath('data.0.brand_ulid', $brand)
            ->assertJsonPath('data.0.unit_ulid', $unit);

        $this->postJson("$url/products", [
            'sku' => 'DEF-2', 'name' => 'Wrong parent', 'sale_price' => '3.0000',
            'category_ulid' => $otherCategory, 'subcategory_ulid' => $subcategory,
        ])->assertUnprocessable();

        $foreignBrand = (string) Str::ulid();
        DB::table('product_brands')->insert([
            'tenant_id' => $other->getKey(), 'ulid' => $foreignBrand, 'code' => 'OTHER',
            'name' => 'Other Tenant Brand', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->postJson("$url/products", [
            'sku' => 'DEF-3', 'name' => 'Foreign brand', 'sale_price' => '3.0000',
            'brand_ulid' => $foreignBrand,
        ])->assertUnprocessable();

        // ResolveTenantContext intentionally returns 404 for a tenant where
        // the authenticated user has no active membership. Do not reveal
        // whether another tenant exists with a 403 permission response.
        $this->postJson("/api/tenants/{$other->ulid}/definitions/brands", [
            'code' => 'HACK', 'name' => 'Invalid attempt',
        ])->assertNotFound();

        $this->assertSame(1, DB::table('products')->where('tenant_id', $tenant->getKey())->count());
    }
}
