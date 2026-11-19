<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Permission evaluation always uses the authenticated membership and
 * the resolved tenant. An empty role/permission assignment means DENY.
 */
final class TenantPermissions
{
    public function allows(int $userId, int $tenantId, string $permission): bool
    {
        if ($userId < 1 || $tenantId < 1 || ! in_array($permission, self::known(), true)) {
            return false;
        }

        return DB::table('tenant_memberships as m')
            ->join('tenants as t', 't.id', '=', 'm.tenant_id')
            ->join('tenant_membership_roles as mr', function ($join): void {
                $join->on('mr.tenant_id', '=', 'm.tenant_id')
                    ->on('mr.membership_id', '=', 'm.id');
            })
            ->join('tenant_role_permissions as rp', function ($join): void {
                $join->on('rp.tenant_id', '=', 'mr.tenant_id')
                    ->on('rp.role_id', '=', 'mr.role_id');
            })
            ->where('m.user_id', $userId)
            ->where('m.tenant_id', $tenantId)
            ->where('m.status', 'active')
            ->where('t.status', 'active')
            ->where('rp.permission', $permission)
            ->exists();
    }

    /** @return list<string> */
    public static function known(): array
    {
        return [
            'tenant.settings.read',
            'tenant.members.read',
            'tenant.members.manage',
            'products.read',
            'products.create',
            'parties.read',
            'parties.create',
            'warehouses.read',
            'warehouses.create',
            'inventory.read',
            'inventory.receive',
        ];
    }
}
