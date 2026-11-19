<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('supplier_id');
            $table->foreignId('warehouse_id');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->uuid('idempotency_key');
            $table->char('payload_hash', 64);
            $table->string('reference', 100)->nullable();
            $table->decimal('total', 20, 4);
            $table->string('status', 16)->default('posted');
            $table->timestamps();
            $table->unique(['tenant_id', 'id']);
            $table->unique(['tenant_id', 'idempotency_key']);
            $table->foreign(['tenant_id', 'supplier_id'], 'purchase_supplier_tenant_fk')
                ->references(['tenant_id', 'id'])->on('parties')->restrictOnDelete();
            $table->foreign(['tenant_id', 'warehouse_id'], 'purchase_warehouse_tenant_fk')
                ->references(['tenant_id', 'id'])->on('warehouses')->restrictOnDelete();
        });

        Schema::create('purchase_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id');
            $table->foreignId('purchase_id');
            $table->foreignId('product_id');
            $table->ulid('ulid')->unique();
            $table->decimal('quantity', 20, 6);
            $table->decimal('unit_cost', 20, 4);
            $table->decimal('line_total', 20, 4);
            $table->foreign(['tenant_id', 'purchase_id'], 'purchase_line_document_fk')
                ->references(['tenant_id', 'id'])->on('purchases')->restrictOnDelete();
            $table->foreign(['tenant_id', 'product_id'], 'purchase_line_product_fk')
                ->references(['tenant_id', 'id'])->on('products')->restrictOnDelete();
            $table->index(['tenant_id', 'purchase_id']);
        });

        Schema::create('sales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('warehouse_id');
            $table->foreignId('customer_id')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->uuid('idempotency_key');
            $table->char('payload_hash', 64);
            $table->decimal('subtotal', 20, 4);
            $table->decimal('total', 20, 4);
            $table->decimal('amount_paid', 20, 4);
            $table->decimal('change_due', 20, 4);
            $table->string('payment_method', 16)->default('cash');
            $table->string('status', 16)->default('posted');
            $table->timestamps();
            $table->unique(['tenant_id', 'id']);
            $table->unique(['tenant_id', 'idempotency_key']);
            $table->foreign(['tenant_id', 'warehouse_id'], 'sale_warehouse_tenant_fk')
                ->references(['tenant_id', 'id'])->on('warehouses')->restrictOnDelete();
            $table->foreign(['tenant_id', 'customer_id'], 'sale_customer_tenant_fk')
                ->references(['tenant_id', 'id'])->on('parties')->restrictOnDelete();
        });

        Schema::create('sale_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id');
            $table->foreignId('sale_id');
            $table->foreignId('product_id');
            $table->ulid('ulid')->unique();
            $table->string('sku', 64);
            $table->string('product_name', 180);
            $table->decimal('quantity', 20, 6);
            $table->decimal('unit_price', 20, 4);
            $table->decimal('line_total', 20, 4);
            $table->foreign(['tenant_id', 'sale_id'], 'sale_line_document_fk')
                ->references(['tenant_id', 'id'])->on('sales')->restrictOnDelete();
            $table->foreign(['tenant_id', 'product_id'], 'sale_line_product_fk')
                ->references(['tenant_id', 'id'])->on('products')->restrictOnDelete();
            $table->index(['tenant_id', 'sale_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->foreignId('purchase_id')->nullable();
            $table->foreignId('sale_id')->nullable();
            $table->foreign(['tenant_id', 'purchase_id'], 'stock_purchase_tenant_fk')
                ->references(['tenant_id', 'id'])->on('purchases')->restrictOnDelete();
            $table->foreign(['tenant_id', 'sale_id'], 'stock_sale_tenant_fk')
                ->references(['tenant_id', 'id'])->on('sales')->restrictOnDelete();
        });

        // Reuse the existing append-only inventory ledger for both directions.
        // Stock issue is negative, and positive quantity still required for inwards.
        DB::statement('ALTER TABLE stock_movements DROP CONSTRAINT stock_movement_qty_positive');
        DB::statement("ALTER TABLE stock_movements DROP CONSTRAINT stock_movement_type_check");
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_direction_check CHECK ((type IN ('opening', 'receipt') AND quantity > 0) OR (type = 'sale' AND quantity < 0))");
        DB::statement('ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_nonzero CHECK (quantity <> 0)');
        // Prevent UPDATE/DELETE at the database level, including accidental ORM writes.
        DB::unprepared(<<<'SQL'
CREATE FUNCTION ahpos_protect_stock_movement() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Posted stock movements are append-only';
END;
$$;
CREATE TRIGGER ahpos_stock_no_mutation
BEFORE UPDATE OR DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION ahpos_protect_stock_movement();
SQL);
        foreach (['purchases', 'purchase_lines', 'sales', 'sale_lines'] as $table) {
            DB::unprepared("CREATE TRIGGER ahpos_{$table}_no_mutation BEFORE UPDATE OR DELETE ON {$table} FOR EACH ROW EXECUTE FUNCTION ahpos_protect_stock_movement()");
        }

        DB::statement("ALTER TABLE purchases ADD CONSTRAINT purchase_total_nonnegative CHECK (total >= 0)");
        DB::statement("ALTER TABLE sales ADD CONSTRAINT sale_total_nonnegative CHECK (total >= 0 AND amount_paid >= total AND change_due = amount_paid - total)");
        DB::statement("ALTER TABLE purchase_lines ADD CONSTRAINT purchase_line_positive CHECK (quantity > 0 AND unit_cost >= 0 AND line_total >= 0)");
        DB::statement("ALTER TABLE sale_lines ADD CONSTRAINT sale_line_positive CHECK (quantity > 0 AND unit_price >= 0 AND line_total >= 0)");
    }

    public function down(): void
    {
        foreach (['purchases', 'purchase_lines', 'sales', 'sale_lines'] as $table) {
            DB::unprepared("DROP TRIGGER IF EXISTS ahpos_{$table}_no_mutation ON {$table}");
        }
        DB::unprepared('DROP TRIGGER IF EXISTS ahpos_stock_no_mutation ON stock_movements');
        DB::unprepared('DROP FUNCTION IF EXISTS ahpos_protect_stock_movement()');
        DB::statement('ALTER TABLE stock_movements DROP CONSTRAINT stock_movement_direction_check');
        DB::statement('ALTER TABLE stock_movements DROP CONSTRAINT stock_movement_nonzero');
        DB::statement('ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_qty_positive CHECK (quantity > 0)');
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_type_check CHECK (type IN ('opening', 'receipt'))");
        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->dropForeign('stock_sale_tenant_fk');
            $table->dropForeign('stock_purchase_tenant_fk');
            $table->dropColumn(['sale_id', 'purchase_id']);
        });
        Schema::dropIfExists('sale_lines');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('purchase_lines');
        Schema::dropIfExists('purchases');
    }
};
