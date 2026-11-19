<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_roles', function (Blueprint $table): void {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->string('name', 80)->unique();
            $table->timestamps();
        });

        Schema::create('platform_role_permissions', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained('platform_roles')->restrictOnDelete();
            $table->string('permission', 100);
            $table->primary(['role_id', 'permission']);
        });

        Schema::create('platform_user_roles', function (Blueprint $table): void {
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('role_id')->constrained('platform_roles')->restrictOnDelete();
            $table->primary(['user_id', 'role_id']);
        });

        Schema::create('platform_audit_events', function (Blueprint $table): void {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 80);
            $table->string('target_type', 40);
            $table->string('target_ulid', 26)->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->ipAddress('ip_address')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['created_at', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_audit_events');
        Schema::dropIfExists('platform_user_roles');
        Schema::dropIfExists('platform_role_permissions');
        Schema::dropIfExists('platform_roles');
    }
};
