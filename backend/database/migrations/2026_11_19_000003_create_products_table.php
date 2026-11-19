<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->string('sku', 64);
            $table->string('name', 180);
            $table->string('barcode', 100)->nullable();
            $table->decimal('sale_price', 20, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'sku']);
            $table->unique(['tenant_id', 'barcode']);
            $table->index(['tenant_id', 'name']);
            $table->unique(['tenant_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
