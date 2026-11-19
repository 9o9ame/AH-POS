<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_shifts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('warehouse_id');
            $table->foreignId('cashier_id')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->decimal('opening_cash', 20, 4);
            $table->string('opening_note', 500)->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'id']);
            $table->foreign(['tenant_id', 'warehouse_id'], 'cash_shift_warehouse_fk')
                ->references(['tenant_id', 'id'])->on('warehouses')->restrictOnDelete();
        });

        Schema::create('cash_shift_closures', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('shift_id');
            $table->foreignId('closed_by')->constrained('users')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->decimal('cash_sales', 20, 4);
            $table->decimal('cash_refunds', 20, 4);
            $table->decimal('expected_cash', 20, 4);
            $table->decimal('counted_cash', 20, 4);
            $table->decimal('difference', 20, 4);
            $table->string('closing_note', 500)->nullable();
            $table->timestamps();
            $table->unique('shift_id');
            $table->foreign(['tenant_id', 'shift_id'], 'cash_closure_shift_fk')
                ->references(['tenant_id', 'id'])->on('cash_shifts')->restrictOnDelete();
        });

        Schema::table('sales', function (Blueprint $table): void {
            $table->foreignId('cash_shift_id')->nullable();
            $table->foreign(['tenant_id', 'cash_shift_id'], 'sale_cash_shift_fk')
                ->references(['tenant_id', 'id'])->on('cash_shifts')->restrictOnDelete();
        });
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->foreignId('cash_shift_id')->nullable();
            $table->foreign(['tenant_id', 'cash_shift_id'], 'return_cash_shift_fk')
                ->references(['tenant_id', 'id'])->on('cash_shifts')->restrictOnDelete();
        });

        foreach (['cash_shifts', 'cash_shift_closures'] as $table) {
            DB::statement("CREATE TRIGGER ahpos_{$table}_no_mutation BEFORE UPDATE OR DELETE ON {$table} FOR EACH ROW EXECUTE FUNCTION ahpos_protect_stock_movement()");
        }
        DB::statement('ALTER TABLE cash_shifts ADD CONSTRAINT cash_shift_opening_nonnegative CHECK (opening_cash >= 0)');
    }

    public function down(): void
    {
        foreach (['cash_shift_closures', 'cash_shifts'] as $table) {
            DB::statement("DROP TRIGGER IF EXISTS ahpos_{$table}_no_mutation ON {$table}");
        }
        Schema::table('sale_returns', function (Blueprint $table): void {
            $table->dropForeign('return_cash_shift_fk');
            $table->dropColumn('cash_shift_id');
        });
        Schema::table('sales', function (Blueprint $table): void {
            $table->dropForeign('sale_cash_shift_fk');
            $table->dropColumn('cash_shift_id');
        });
        Schema::dropIfExists('cash_shift_closures');
        Schema::dropIfExists('cash_shifts');
    }
};
