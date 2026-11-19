<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class TenantStaffAccess
{
    /** Permissions are server-defined and may not be supplied by a client. */
    public static function templates(): array
    {
        return [
            'Cashier' => [
                'products.read', 'parties.read', 'parties.create', 'warehouses.read',
                'inventory.read', 'sales.read', 'sales.create', 'sales.holds.read',
                'sales.holds.write', 'returns.read', 'returns.create',
                'cash_shifts.read', 'cash_shifts.open', 'cash_shifts.close',
            ],
            'Purchaser' => [
                'products.read', 'parties.read', 'parties.create', 'warehouses.read',
                'inventory.read', 'inventory.receive', 'purchases.read', 'purchases.create',
            ],
            'Inventory Clerk' => [
                'products.read', 'definitions.read', 'warehouses.read', 'inventory.read',
                'inventory.receive',
            ],
            'Manager' => [
                'products.read', 'products.create', 'definitions.read', 'definitions.manage',
                'parties.read', 'parties.create', 'warehouses.read', 'warehouses.create',
                'inventory.read', 'inventory.receive', 'purchases.read', 'purchases.create',
                'sales.read', 'sales.create', 'sales.holds.read', 'sales.holds.write',
                'returns.read', 'returns.create', 'cash_shifts.read', 'cash_shifts.open',
                'cash_shifts.close', 'reports.read',
            ],
        ];
    }

    public static function ensureRole(int $tenantId, string $name): int
    {
        $permissions = self::templates()[$name] ?? null;
        if ($permissions === null) throw new \InvalidArgumentException('Unknown staff role');
        foreach ($permissions as $permission) {
            if (! in_array($permission, TenantPermissions::known(), true)) {
                throw new \LogicException('Staff template has unknown permission: '.$permission);
            }
        }

        $roleId = DB::table('tenant_roles')
            ->where('tenant_id', $tenantId)->where('name', $name)->value('id');
        if ($roleId === null) {
            $roleId = DB::table('tenant_roles')->insertGetId([
                'tenant_id' => $tenantId, 'ulid' => (string) Str::ulid(),
                'name' => $name, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        // Do not re-purpose a pre-existing custom role with the same display
        // name but different permissions. A template must match exactly.
        $existing = DB::table('tenant_role_permissions')
            ->where('tenant_id', $tenantId)->where('role_id', $roleId)
            ->pluck('permission')->all();
        if ($existing !== []) {
            $sortedCurrent = $existing;
            $sortedTemplate = $permissions;
            sort($sortedCurrent);
            sort($sortedTemplate);
            if ($sortedCurrent !== $sortedTemplate) {
                throw new \DomainException('Existing tenant role conflicts with the staff template.');
            }
        } else {
            foreach ($permissions as $permission) {
                DB::table('tenant_role_permissions')->insertOrIgnore([
                    'tenant_id' => $tenantId, 'role_id' => $roleId, 'permission' => $permission,
                ]);
            }
        }
        return (int) $roleId;
    }

    public static function cookieName(string $tenantUlid): string
    {
        return 'ahpos_device_'.strtoupper($tenantUlid);
    }

    public static function currentDevice(Request $request, int $tenantId, int $membershipId, string $tenantUlid): ?object
    {
        $raw = $request->cookie(self::cookieName($tenantUlid));
        if (! is_string($raw) || strlen($raw) < 32) return null;
        return DB::table('tenant_staff_devices')
            ->where('tenant_id', $tenantId)
            ->where('membership_id', $membershipId)
            ->where('token_hash', hash('sha256', $raw))
            ->first(['ulid', 'status', 'device_name', 'approved_at', 'revoked_at']);
    }

    public static function audit(Request $request, int $tenantId, string $action, ?string $subjectUlid, array $metadata = []): void
    {
        DB::table('tenant_staff_audit_events')->insert([
            'ulid' => (string) Str::ulid(), 'tenant_id' => $tenantId,
            'actor_id' => (int) $request->user()->getKey(),
            'action' => $action, 'subject_ulid' => $subjectUlid,
            'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'ip_address' => $request->ip(), 'created_at' => now(),
        ]);
    }
}
