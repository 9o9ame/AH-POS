<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** Critical integrated purchase -> stock-in -> cash sale -> stock-out.
 * Single migrated PostgreSQL ahpos_test only; all test inserts rolled back.
 */
final class TradeWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('TradeWorkflowTest requires PostgreSQL ahpos_test.');
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

    public function test_purchase_to_cash_sale_is_atomic_repriced_and_idempotent(): void
    {
        $tenant = Tenant::create(['name' => 'Pilot Trade Alpha']);
        $other = Tenant::create(['name' => 'Pilot Trade Other']);
        $user = User::factory()->create();

        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Trade test operator', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['purchases.create', 'purchases.read', 'sales.create', 'sales.read', 'inventory.read'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role, 'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);

        $warehouseUlid = (string) Str::ulid();
        $warehouse = DB::table('warehouses')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => $warehouseUlid,
            'code' => 'TRD', 'name' => 'Trade Location', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $supplierUlid = (string) Str::ulid();
        DB::table('parties')->insert([
            'tenant_id' => $tenant->getKey(), 'ulid' => $supplierUlid,
            'type' => 'supplier', 'name' => 'Supply Vendor', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $productUlid = (string) Str::ulid();
        $product = DB::table('products')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => $productUlid,
            'sku' => 'SALE-TEST', 'name' => 'Cash Item', 'sale_price' => '100.0000',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $foreignUlid = (string) Str::ulid();
        DB::table('products')->insert([
            'tenant_id' => $other->getKey(), 'ulid' => $foreignUlid,
            'sku' => 'FOREIGN', 'name' => 'Foreign Item', 'sale_price' => '100.0000',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $purchasePayload = [
            'supplier_ulid' => $supplierUlid, 'warehouse_ulid' => $warehouseUlid,
            'idempotency_key' => (string) Str::uuid(), 'reference' => 'P-001',
            'lines' => [['product_ulid' => $productUlid, 'quantity' => '5', 'unit_cost' => '60.0000']],
        ];
        $this->actingAs($user)->postJson("/api/tenants/{$tenant->ulid}/purchases", $purchasePayload)
            ->assertCreated()->assertJsonPath('data.total', '300.0000');
        $this->postJson("/api/tenants/{$tenant->ulid}/purchases", $purchasePayload)
            ->assertOk()->assertJsonPath('data.replayed', true);

        $salePayload = [
            'warehouse_ulid' => $warehouseUlid, 'customer_ulid' => null,
            'idempotency_key' => (string) Str::uuid(), 'amount_paid' => '250.0000',
            'lines' => [['product_ulid' => $productUlid, 'quantity' => '2']],
            'total' => '0.0000', // forged money is ignored by the server
        ];
        $saleUlid = $this->postJson("/api/tenants/{$tenant->ulid}/sales", $salePayload)
            ->assertCreated()->assertJsonPath('data.total', '200.0000')
            ->assertJsonPath('data.change_due', '50.0000')->json('data.ulid');
        $this->postJson("/api/tenants/{$tenant->ulid}/sales", $salePayload)
            ->assertOk()->assertJsonPath('data.replayed', true);

        $this->getJson("/api/tenants/{$tenant->ulid}/sales/{$saleUlid}")
            ->assertOk()->assertJsonPath('data.lines.0.unit_price', '100.0000');

        $this->assertSame(1, DB::table('purchases')->where('tenant_id', $tenant->getKey())->count());
        $this->assertSame(1, DB::table('sales')->where('tenant_id', $tenant->getKey())->count());
        $this->assertSame(2, DB::table('stock_movements')
            ->where('tenant_id', $tenant->getKey())->count());
        $balance = DB::table('stock_movements')->where('tenant_id', $tenant->getKey())
            ->where('warehouse_id', $warehouse)->where('product_id', $product)
            ->selectRaw('SUM(quantity)::text AS qty')->first();
        $this->assertSame('3.000000', $balance->qty);

        $this->postJson("/api/tenants/{$tenant->ulid}/sales", [
            ...$salePayload, 'idempotency_key' => (string) Str::uuid(),
            'lines' => [['product_ulid' => $productUlid, 'quantity' => '10']],
        ])->assertUnprocessable();

        $this->postJson("/api/tenants/{$tenant->ulid}/sales", [
            ...$salePayload, 'idempotency_key' => (string) Str::uuid(),
            'lines' => [['product_ulid' => $foreignUlid, 'quantity' => '1']],
        ])->assertNotFound();

        $this->assertSame(2, DB::table('stock_movements')
            ->where('tenant_id', $tenant->getKey())->count());
    }
}
