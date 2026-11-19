<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_lines', function (Blueprint $table): void {
            $table->unique(['tenant_id', 'id']);
        });

        Schema::create('sale_returns', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('sale_id');
            $table->foreignId('warehouse_id');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->uuid('idempotency_key');
            $table->char('payload_hash', 64);
            $table->string('reason', 500);
            $table->decimal('refund_total', 20, 4);
            $table->string('refund_method', 16)->default('cash');
            $table->string('status', 16)->default('posted');
            $table->timestamps();
            $table->unique(['tenant_id', 'id']);
            $table->unique(['tenant_id', 'idempotency_key']);
            $table->foreign(['tenant_id', 'sale_id'], 'sale_return_sale_fk')
                ->references(['tenant_id', 'id'])->on('sales')->restrictOnDelete();
            $table->foreign(['tenant_id', 'warehouse_id'], 'sale_return_warehouse_fk')
                ->references(['tenant_id', 'id'])->on('warehouses')->restrictOnDelete();
        });

        Schema::create('sale_return_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id');
            $table->foreignId('return_id');
            $table->foreignId('sale_line_id');
            $table->foreignId('product_id');
            $table->ulid('ulid')->unique();
            $table->decimal('quantity', 20, 6);
            $table->decimal('unit_price', 20, 4);
            $table->decimal('refund_total', 20, 4);
            $table->foreign(['tenant_id', 'return_id'], 'sale_return_line_header_fk')
                ->references(['tenant_id', 'id'])->on('sale_returns')->restrictOnDelete();
            $table->foreign(['tenant_id', 'sale_line_id'], 'sale_return_line_origin_fk')
                ->references(['tenant_id', 'id'])->on('sale_lines')->restrictOnDelete();
            $table->foreign(['tenant_id', 'product_id'], 'sale_return_line_product_fk')
                ->references(['tenant_id', 'id'])->on('products')->restrictOnDelete();
            $table->unique(['return_id', 'sale_line_id']);
        });

        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->foreignId('sale_return_id')->nullable();
            $table->foreign(['tenant_id', 'sale_return_id'], 'movement_sale_return_fk')
                ->references(['tenant_id', 'id'])->on('sale_returns')->restrictOnDelete();
        });

        DB::statement('ALTER TABLE stock_movements DROP CONSTRAINT stock_movement_direction_check');
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_direction_check CHECK ((type IN ('opening', 'receipt', 'sale_return') AND quantity > 0) OR (type = 'sale' AND quantity < 0))");
        DB::statement("ALTER TABLE sale_returns ADD CONSTRAINT sale_return_refund_nonnegative CHECK (refund_total >= 0)");
        DB::statement("ALTER TABLE sale_return_lines ADD CONSTRAINT sale_return_line_positive CHECK (quantity > 0 AND unit_price >= 0 AND refund_total >= 0)");

        foreach (['sale_returns', 'sale_return_lines'] as $table) {
            DB::statement("CREATE TRIGGER ahpos_{$table}_no_mutation BEFORE UPDATE OR DELETE ON {$table} FOR EACH ROW EXECUTE FUNCTION ahpos_protect_stock_movement()");
        }
    }

    public function down(): void
    {
        foreach (['sale_returns', 'sale_return_lines'] as $table) {
            DB::statement("DROP TRIGGER IF EXISTS ahpos_{$table}_no_mutation ON {$table}");
        }
        DB::statement('ALTER TABLE stock_movements DROP CONSTRAINT stock_movement_direction_check');
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_direction_check CHECK ((type IN ('opening', 'receipt') AND quantity > 0) OR (type = 'sale' AND quantity < 0))");
        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->dropForeign('movement_sale_return_fk');
            $table->dropColumn('sale_return_id');
        });
        Schema::dropIfExists('sale_return_lines');
        Schema::dropIfExists('sale_returns');
        Schema::table('sale_lines', function (Blueprint $table): void {
            $table->dropUnique(['tenant_id', 'id']);
        });
    }
};
