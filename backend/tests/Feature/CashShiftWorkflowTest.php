<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** Critical local cashier workflow. No migrate:fresh; all data rolls back. */
final class CashShiftWorkflowTest extends TestCase
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

    public function test_cash_shift_tracks_only_linked_sale_refund_and_immutable_close(): void
    {
        $tenant = Tenant::create(['name' => 'Cash shift test']);
        $user = User::factory()->create();
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Cash pilot user', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['cash_shifts.read', 'cash_shifts.open', 'cash_shifts.close',
            'sales.create', 'sales.read', 'returns.create'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role, 'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);
        $wulid = (string) Str::ulid();
        $warehouseId = DB::table('warehouses')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => $wulid,
            'code' => 'CASH', 'name' => 'Cash Test Warehouse',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $productUlid = (string) Str::ulid();
        $productId = DB::table('products')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => $productUlid,
            'sku' => 'CASH-ITEM', 'name' => 'Cash Item', 'sale_price' => '100.0000',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('stock_movements')->insert([
            'tenant_id' => $tenant->getKey(), 'warehouse_id' => $warehouseId,
            'product_id' => $productId, 'created_by' => $user->getKey(),
            'ulid' => (string) Str::ulid(), 'idempotency_key' => (string) Str::uuid(),
            'payload_hash' => str_repeat('a', 64), 'type' => 'opening',
            'quantity' => '10', 'unit_cost' => '50',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($user);
        $url = "/api/tenants/{$tenant->ulid}";
        $shiftUlid = $this->postJson("$url/cash-shifts", [
            'warehouse_ulid' => $wulid, 'opening_cash' => '500.0000',
        ])->assertCreated()->json('data.ulid');

        $this->postJson("$url/cash-shifts", [
            'warehouse_ulid' => $wulid, 'opening_cash' => '999',
        ])->assertConflict();

        $saleUlid = $this->postJson("$url/sales", [
            'warehouse_ulid' => $wulid,
            'idempotency_key' => (string) Str::uuid(),
            'amount_paid' => '200',
            'lines' => [['product_ulid' => $productUlid, 'quantity' => '2']],
        ])->assertCreated()->json('data.ulid');

        $saleLineUlid = $this->getJson("$url/sales/$saleUlid")
            ->assertOk()->json('data.lines.0.ulid');

        $this->postJson("$url/sale-returns", [
            'sale_ulid' => $saleUlid,
            'idempotency_key' => (string) Str::uuid(),
            'reason' => 'Part refund',
            'lines' => [['sale_line_ulid' => $saleLineUlid, 'quantity' => '1']],
        ])->assertCreated()->assertJsonPath('data.refund_total', '100.0000');

        $this->getJson("$url/cash-shifts")->assertOk()
            ->assertJsonPath('data.0.is_open', true)
            ->assertJsonPath('data.0.cash_sales', '200.0000')
            ->assertJsonPath('data.0.cash_refunds', '100.0000')
            ->assertJsonPath('data.0.expected_cash', '600.0000');

        $this->postJson("$url/cash-shifts/$shiftUlid/close", [
            'counted_cash' => '590.0000', 'closing_note' => 'Ten rupees short',
        ])->assertCreated()
            ->assertJsonPath('data.cash_sales', '200.0000')
            ->assertJsonPath('data.cash_refunds', '100.0000')
            ->assertJsonPath('data.expected_cash', '600.0000')
            ->assertJsonPath('data.difference', '-10.0000');

        $this->postJson("$url/cash-shifts/$shiftUlid/close", [
            'counted_cash' => '600.0000',
        ])->assertConflict();

        $this->assertSame(1, DB::table('cash_shift_closures')
            ->where('tenant_id', $tenant->getKey())->count());

        $this->getJson("$url/cash-shifts")
            ->assertOk()->assertJsonPath('data.0.is_open', false)
            ->assertJsonPath('data.0.difference', '-10.0000');
    }
}
