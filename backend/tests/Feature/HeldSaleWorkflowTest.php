<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

/** One critical hold -> resume -> post regression on migrated ahpos_test. */
final class HeldSaleWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('HeldSaleWorkflowTest requires migrated PostgreSQL ahpos_test.');
        }
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
    }

    protected function tearDown(): void
    {
        try { DB::rollBack(); } finally { parent::tearDown(); }
    }

    public function test_server_held_bill_can_be_saved_updated_resumed_and_consumed_once(): void
    {
        $tenant = Tenant::create(['name' => 'Held Sales Tenant']);
        $user = User::factory()->create();
        $membership = DB::table('tenant_memberships')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'user_id' => $user->getKey(),
            'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $role = DB::table('tenant_roles')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
            'name' => 'Held Sale Tester', 'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach (['sales.holds.read', 'sales.holds.write', 'sales.create', 'sales.read'] as $permission) {
            DB::table('tenant_role_permissions')->insert([
                'tenant_id' => $tenant->getKey(), 'role_id' => $role, 'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insert([
            'tenant_id' => $tenant->getKey(), 'membership_id' => $membership, 'role_id' => $role,
        ]);

        $warehouseUlid = (string) Str::ulid();
        $warehouseId = DB::table('warehouses')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => $warehouseUlid,
            'code' => 'HLD', 'name' => 'Held Store',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $productUlid = (string) Str::ulid();
        $productId = DB::table('products')->insertGetId([
            'tenant_id' => $tenant->getKey(), 'ulid' => $productUlid,
            'sku' => 'HOLD-001', 'name' => 'Held Item', 'sale_price' => '100.0000',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('stock_movements')->insert([
            'tenant_id' => $tenant->getKey(), 'warehouse_id' => $warehouseId,
            'product_id' => $productId, 'created_by' => $user->getKey(),
            'ulid' => (string) Str::ulid(), 'idempotency_key' => (string) Str::uuid(),
            'payload_hash' => str_repeat('a', 64), 'type' => 'opening',
            'quantity' => '5', 'unit_cost' => '40',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($user);
        $url = "/api/tenants/{$tenant->ulid}";
        $clientRef = (string) Str::uuid();
        $payload = [
            'client_ref' => $clientRef, 'title' => 'Counter Customer A',
            'warehouse_ulid' => $warehouseUlid, 'customer_ulid' => null,
            'amount_paid' => '200', 'lines' => [
                ['product_ulid' => $productUlid, 'quantity' => '2'],
            ],
        ];
        $holdUlid = $this->postJson("$url/sale-holds", $payload)
            ->assertCreated()->json('data.ulid');
        $this->postJson("$url/sale-holds", $payload)
            ->assertOk()->assertJsonPath('data.ulid', $holdUlid);
        $this->assertSame(1, DB::table('held_sales')->where('tenant_id', $tenant->getKey())->count());

        $this->getJson("$url/sale-holds")->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.lines.0.product.ulid', $productUlid);

        $this->postJson("$url/sales", [
            'warehouse_ulid' => $warehouseUlid, 'customer_ulid' => null,
            'hold_ulid' => $holdUlid,
            'idempotency_key' => (string) Str::uuid(),
            'amount_paid' => '200',
            'lines' => [['product_ulid' => $productUlid, 'quantity' => '2']],
        ])->assertCreated()->assertJsonPath('data.total', '200.0000');

        $this->getJson("$url/sale-holds")->assertOk()->assertJsonCount(0, 'data');
        $this->assertSame('consumed', DB::table('held_sales')
            ->where('tenant_id', $tenant->getKey())->where('ulid', $holdUlid)->value('status'));

        $this->postJson("$url/sales", [
            'warehouse_ulid' => $warehouseUlid, 'customer_ulid' => null,
            'hold_ulid' => $holdUlid,
            'idempotency_key' => (string) Str::uuid(),
            'amount_paid' => '200',
            'lines' => [['product_ulid' => $productUlid, 'quantity' => '2']],
        ])->assertStatus(409);

        $balance = DB::table('stock_movements')
            ->where('tenant_id', $tenant->getKey())->where('product_id', $productId)
            ->selectRaw('SUM(quantity)::text AS qty')->first();
        $this->assertSame('3.000000', $balance->qty);
    }
}
