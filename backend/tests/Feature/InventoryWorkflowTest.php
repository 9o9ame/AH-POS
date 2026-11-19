<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** Critical stock-in and idempotency checks. Existing ahpos_test; rollback only. */
final class InventoryWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Only migrated PostgreSQL ahpos_test is permitted.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try {
            DB::rollBack();
        } finally {
            parent::tearDown();
        }
    }

    public function test_authorized_stock_in_is_immutable_idempotent_and_tenant_scoped(): void
    {
        $tenant = Tenant::create(['name' => 'Inventory Alpha']);
        $other = Tenant::create(['name' => 'Inventory Beta']);
        $user = User::factory()->create();
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(), 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Inventory Operator', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['warehouses.read', 'warehouses.create', 'inventory.read', 'inventory.receive'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role,
                'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);
        $productUlid = (string) Str::ulid();
        DB::table('products')->insert([
            'tenant_id' => $tenant->getKey(), 'ulid' => $productUlid,
            'sku' => 'STOCK-A', 'name' => 'Stock Product A', 'sale_price' => '99',
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $foreignProduct = (string) Str::ulid();
        DB::table('products')->insert([
            'tenant_id' => $other->getKey(), 'ulid' => $foreignProduct,
            'sku' => 'STOCK-B', 'name' => 'Stock Product B', 'sale_price' => '99',
            'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $warehouse = $this->actingAs($user)
            ->postJson("/api/tenants/{$tenant->ulid}/warehouses", [
                'code' => 'MAIN', 'name' => 'Main Warehouse',
            ])->assertCreated()->json('data.ulid');

        $payload = [
            'warehouse_ulid' => $warehouse, 'product_ulid' => $productUlid,
            'idempotency_key' => (string) Str::uuid(), 'type' => 'opening',
            'quantity' => '100', 'unit_cost' => '25.0000', 'note' => 'Initial count',
        ];
        $this->postJson("/api/tenants/{$tenant->ulid}/inventory/receive", $payload)
            ->assertCreated()->assertJsonPath('data.replayed', false);

        $this->postJson("/api/tenants/{$tenant->ulid}/inventory/receive", $payload)
            ->assertOk()->assertJsonPath('data.replayed', true);

        $this->assertSame(1, DB::table('stock_movements')
            ->where('tenant_id', $tenant->getKey())->count());

        $this->getJson("/api/tenants/{$tenant->ulid}/inventory")
            ->assertOk()->assertJsonPath('data.balances.0.quantity', '100.000000');

        $this->postJson("/api/tenants/{$tenant->ulid}/inventory/receive", [
            ...$payload, 'idempotency_key' => (string) Str::uuid(), 'product_ulid' => $foreignProduct,
        ])->assertNotFound();

        $this->postJson("/api/tenants/{$tenant->ulid}/inventory/receive", [
            ...$payload, 'idempotency_key' => (string) Str::uuid(), 'quantity' => '0',
        ])->assertUnprocessable();

        $this->assertSame(1, DB::table('stock_movements')
            ->where('tenant_id', $tenant->getKey())->count());
    }
}
