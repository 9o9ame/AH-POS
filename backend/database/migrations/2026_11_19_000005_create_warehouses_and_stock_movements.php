<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->string('code', 40);
            $table->string('name', 160);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'id']);
            $table->unique(['tenant_id', 'code']);
        });

        Schema::create('stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('warehouse_id');
            $table->foreignId('product_id');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->ulid('idempotency_key');
            $table->char('payload_hash', 64);
            $table->string('type', 24);
            $table->decimal('quantity', 20, 6);
            $table->decimal('unit_cost', 20, 4);
            $table->string('note', 500)->nullable();
            $table->timestamps();

            $table->foreign(['tenant_id', 'warehouse_id'], 'stock_movement_warehouse_fk')
                ->references(['tenant_id', 'id'])->on('warehouses')->restrictOnDelete();
            $table->foreign(['tenant_id', 'product_id'], 'stock_movement_product_fk')
                ->references(['tenant_id', 'id'])->on('products')->restrictOnDelete();
            $table->unique(['tenant_id', 'idempotency_key']);
            $table->index(['tenant_id', 'warehouse_id', 'product_id']);
        });

        // Explicit PostgreSQL constraints. No unbounded stock edits.
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_qty_positive CHECK (quantity > 0)");
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_cost_nonnegative CHECK (unit_cost >= 0)");
        DB::statement("ALTER TABLE stock_movements ADD CONSTRAINT stock_movement_type_check CHECK (type IN ('opening', 'receipt'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('warehouses');
    }
};
