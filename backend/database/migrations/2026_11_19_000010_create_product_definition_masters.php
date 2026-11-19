<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['product_categories', 'product_brands', 'product_units'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
                $table->ulid('ulid')->unique();
                $table->string('code', 48);
                $table->string('name', 120);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->unique(['tenant_id', 'id']);
                $table->unique(['tenant_id', 'code'], $name.'_tenant_code_unique');
            });
            DB::statement("CREATE UNIQUE INDEX {$name}_tenant_lower_name_unique ON {$name} (tenant_id, lower(name))");
        }

        Schema::create('product_subcategories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('category_id');
            $table->ulid('ulid')->unique();
            $table->string('code', 48);
            $table->string('name', 120);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'id']);
            $table->unique(['tenant_id', 'category_id', 'id'], 'subcat_tenant_category_id_unique');
            $table->unique(['tenant_id', 'category_id', 'code'], 'subcat_tenant_category_code_unique');
            $table->foreign(['tenant_id', 'category_id'], 'subcat_tenant_category_fk')
                ->references(['tenant_id', 'id'])->on('product_categories')->restrictOnDelete();
        });
        DB::statement('CREATE UNIQUE INDEX subcat_tenant_category_lower_name_unique ON product_subcategories (tenant_id, category_id, lower(name))');

        Schema::table('products', function (Blueprint $table): void {
            $table->foreignId('category_id')->nullable();
            $table->foreignId('subcategory_id')->nullable();
            $table->foreignId('brand_id')->nullable();
            $table->foreignId('unit_id')->nullable();
            $table->foreign(['tenant_id', 'category_id'], 'product_category_fk')
                ->references(['tenant_id', 'id'])->on('product_categories')->restrictOnDelete();
            $table->foreign(['tenant_id', 'category_id', 'subcategory_id'], 'product_subcategory_fk')
                ->references(['tenant_id', 'category_id', 'id'])->on('product_subcategories')->restrictOnDelete();
            $table->foreign(['tenant_id', 'brand_id'], 'product_brand_fk')
                ->references(['tenant_id', 'id'])->on('product_brands')->restrictOnDelete();
            $table->foreign(['tenant_id', 'unit_id'], 'product_unit_fk')
                ->references(['tenant_id', 'id'])->on('product_units')->restrictOnDelete();
        });

        DB::statement('ALTER TABLE products ADD CONSTRAINT product_subcategory_requires_category CHECK (subcategory_id IS NULL OR category_id IS NOT NULL)');
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropForeign('product_subcategory_fk');
            $table->dropForeign('product_category_fk');
            $table->dropForeign('product_brand_fk');
            $table->dropForeign('product_unit_fk');
            $table->dropColumn(['subcategory_id', 'category_id', 'brand_id', 'unit_id']);
        });
        Schema::dropIfExists('product_subcategories');
        Schema::dropIfExists('product_units');
        Schema::dropIfExists('product_brands');
        Schema::dropIfExists('product_categories');
    }
};
