<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->string('type', 16);
            $table->string('name', 180);
            $table->string('phone', 40)->nullable();
            $table->string('email', 255)->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'type', 'name']);
            $table->unique(['tenant_id', 'id']);
            $table->check("type IN ('customer', 'supplier')");
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parties');
    }
};
