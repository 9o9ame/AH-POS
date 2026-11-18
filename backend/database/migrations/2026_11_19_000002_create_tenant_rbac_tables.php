<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_roles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->ulid('ulid')->unique();
            $table->string('name', 80);
            $table->timestamps();
            $table->unique(['tenant_id', 'name']);
            $table->unique(['tenant_id', 'id']);
        });

        Schema::create('tenant_role_permissions', function (Blueprint $table): void {
            $table->foreignId('tenant_id');
            $table->foreignId('role_id');
            $table->string('permission', 100);
            $table->primary(['tenant_id', 'role_id', 'permission'], 'tenant_role_permission_pk');
            $table->foreign(['tenant_id', 'role_id'], 'role_permission_tenant_role_fk')
                ->references(['tenant_id', 'id'])->on('tenant_roles')->restrictOnDelete();
        });

        Schema::table('tenant_memberships', function (Blueprint $table): void {
            $table->unique(['tenant_id', 'id']);
        });

        Schema::create('tenant_membership_roles', function (Blueprint $table): void {
            $table->foreignId('tenant_id');
            $table->foreignId('membership_id');
            $table->foreignId('role_id');
            $table->primary(['tenant_id', 'membership_id', 'role_id'], 'membership_role_pk');
            $table->foreign(['tenant_id', 'membership_id'], 'membership_role_membership_fk')
                ->references(['tenant_id', 'id'])->on('tenant_memberships')->restrictOnDelete();
            $table->foreign(['tenant_id', 'role_id'], 'membership_role_role_fk')
                ->references(['tenant_id', 'id'])->on('tenant_roles')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_membership_roles');
        Schema::dropIfExists('tenant_role_permissions');
        Schema::dropIfExists('tenant_roles');
        Schema::table('tenant_memberships', fn (Blueprint $table) => $table->dropUnique(['tenant_id', 'id']));
    }
};
