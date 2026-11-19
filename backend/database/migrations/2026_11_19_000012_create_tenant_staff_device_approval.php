<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Existing local members remain usable. Only newly provisioned
        // staff will require approval, until a deliberate legacy enrollment.
        Schema::table('tenant_memberships', function (Blueprint $table): void {
            $table->boolean('requires_device_approval')->default(false);
        });

        Schema::create('tenant_staff_devices', function (Blueprint $table): void {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id');
            $table->foreignId('membership_id');
            $table->string('device_name', 100);
            $table->char('token_hash', 64)->unique();
            $table->string('status', 20)->default('pending');
            $table->ipAddress('requested_ip')->nullable();
            $table->text('requested_agent')->nullable();
            $table->timestampTz('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestampTz('revoked_at')->nullable();
            $table->timestamps();
            $table->foreign(['tenant_id', 'membership_id'], 'staff_device_tenant_member_fk')
                ->references(['tenant_id', 'id'])->on('tenant_memberships')->restrictOnDelete();
            $table->index(['tenant_id', 'membership_id', 'status']);
        });

        Schema::create('tenant_staff_audit_events', function (Blueprint $table): void {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('tenant_id')->constrained('tenants')->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 90);
            $table->string('subject_ulid', 26)->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->ipAddress('ip_address')->nullable();
            $table->timestampTz('created_at')->useCurrent();
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_staff_audit_events');
        Schema::dropIfExists('tenant_staff_devices');
        Schema::table('tenant_memberships', fn (Blueprint $table) => $table->dropColumn('requires_device_approval'));
    }
};
