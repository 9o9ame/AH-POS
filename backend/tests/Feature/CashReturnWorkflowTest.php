<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** Critical local-only return integration; all rows transaction-rolled back. */
final class CashReturnWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('Requires existing migrated PostgreSQL ahpos_test.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_partial_cash_return_restocks_once_and_blocks_over_refund(): void
    {
        $tenant = Tenant::create(['name' => 'Return Pilot Tenant']);
        $user = User::factory()->create();
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Return Operator', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['returns.read', 'returns.create', 'reports.read'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role,
                'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);

        $productId = DB::table('products')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'sku' => 'RETURN-ITEM', 'name' => 'Test return item',
            'sale_price' => '100.0000', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $warehouseId = DB::table('warehouses')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'code' => 'RET', 'name' => 'Return Warehouse',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $saleUlid = (string) Str::ulid();
        $saleId = DB::table('sales')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'warehouse_id' => $warehouseId,
            'created_by' => $user->getKey(), 'ulid' => $saleUlid,
            'idempotency_key' => (string) Str::uuid(), 'payload_hash' => str_repeat('a', 64),
            'subtotal' => '200.0000', 'total' => '200.0000',
            'amount_paid' => '200.0000', 'change_due' => '0.0000',
            'payment_method' => 'cash', 'status' => 'posted',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $saleLineUlid = (string) Str::ulid();
        DB::table('sale_lines')->insert([
            'tenant_id' => $tenant->getKey(), 'sale_id' => $saleId,
            'product_id' => $productId, 'ulid' => $saleLineUlid,
            'sku' => 'RETURN-ITEM', 'product_name' => 'Test return item',
            'quantity' => '2', 'unit_price' => '100', 'line_total' => '200',
        ]);

        DB::table('stock_movements')->insert([
            'tenant_id' => $tenant->getKey(), 'warehouse_id' => $warehouseId,
            'product_id' => $productId, 'created_by' => $user->getKey(),
            'ulid' => (string) Str::ulid(), 'idempotency_key' => (string) Str::uuid(),
            'payload_hash' => str_repeat('b', 64), 'type' => 'opening',
            'quantity' => '5', 'unit_cost' => '50',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('stock_movements')->insert([
            'tenant_id' => $tenant->getKey(), 'warehouse_id' => $warehouseId,
            'product_id' => $productId, 'created_by' => $user->getKey(),
            'sale_id' => $saleId, 'ulid' => (string) Str::ulid(),
            'idempotency_key' => (string) Str::uuid(),
            'payload_hash' => str_repeat('c', 64), 'type' => 'sale',
            'quantity' => '-2', 'unit_cost' => '0',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $payload = [
            'sale_ulid' => $saleUlid, 'idempotency_key' => (string) Str::uuid(),
            'reason' => 'Customer return',
            'lines' => [['sale_line_ulid' => $saleLineUlid, 'quantity' => '1']],
        ];
        $this->actingAs($user)->postJson("/api/tenants/{$tenant->ulid}/sale-returns", $payload)
            ->assertCreated()->assertJsonPath('data.refund_total', '100.0000')
            ->assertJsonPath('data.replayed', false);
        $this->postJson("/api/tenants/{$tenant->ulid}/sale-returns", $payload)
            ->assertOk()->assertJsonPath('data.replayed', true);

        $this->postJson("/api/tenants/{$tenant->ulid}/sale-returns", [
            ...$payload, 'idempotency_key' => (string) Str::uuid(),
            'lines' => [['sale_line_ulid' => $saleLineUlid, 'quantity' => '2']],
        ])->assertUnprocessable();

        $this->postJson("/api/tenants/{$tenant->ulid}/sale-returns", [
            ...$payload, 'idempotency_key' => (string) Str::uuid(),
        ])->assertCreated();

        $this->postJson("/api/tenants/{$tenant->ulid}/sale-returns", [
            ...$payload, 'idempotency_key' => (string) Str::uuid(),
        ])->assertUnprocessable();

        $this->assertSame(2, DB::table('sale_returns')->where('tenant_id', $tenant->getKey())->count());
        $this->assertSame(4, DB::table('stock_movements')->where('tenant_id', $tenant->getKey())->count());
        $balance = DB::table('stock_movements')->where('tenant_id', $tenant->getKey())
            ->where('warehouse_id', $warehouseId)->where('product_id', $productId)
            ->selectRaw('SUM(quantity)::text as qty')->first();
        $this->assertSame('5.000000', $balance->qty);

        $this->getJson("/api/tenants/{$tenant->ulid}/reports/operations")
            ->assertOk()
            ->assertJsonPath('data.cash_sales.total', '200.0000')
            ->assertJsonPath('data.cash_returns.total', '200.0000')
            ->assertJsonPath('data.net_cash_sales', '0.0000');
    }
}
