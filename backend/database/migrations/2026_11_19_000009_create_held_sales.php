<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('held_sales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->uuid('client_ref');
            $table->string('title', 120);
            $table->foreignId('warehouse_id')->nullable();
            $table->foreignId('customer_id')->nullable();
            $table->string('amount_paid', 32)->nullable();
            $table->jsonb('lines');
            $table->string('status', 16)->default('held');
            $table->foreignId('posted_sale_id')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'cashier_id', 'client_ref']);
            $table->index(['tenant_id', 'cashier_id', 'status', 'updated_at'], 'held_sale_cashier_index');
            $table->foreign(['tenant_id', 'warehouse_id'], 'held_sale_warehouse_fk')
                ->references(['tenant_id', 'id'])->on('warehouses')->restrictOnDelete();
            $table->foreign(['tenant_id', 'customer_id'], 'held_sale_customer_fk')
                ->references(['tenant_id', 'id'])->on('parties')->restrictOnDelete();
            $table->foreign(['tenant_id', 'posted_sale_id'], 'held_sale_posted_sale_fk')
                ->references(['tenant_id', 'id'])->on('sales')->restrictOnDelete();
        });
        DB::statement("ALTER TABLE held_sales ADD CONSTRAINT held_sales_status_check CHECK (status IN ('held', 'consumed', 'discarded'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('held_sales');
    }
};
