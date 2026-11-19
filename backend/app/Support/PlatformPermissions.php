<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

final class PlatformPermissions
{
    /** @return list<string> */
    public static function known(): array
    {
        return [
            'platform.overview.read',
            'platform.admins.read', 'platform.admins.create',
            'platform.staff.read', 'platform.staff.manage',
            'platform.audit.read',
        ];
    }

    public function allows(int $userId, string $permission): bool
    {
        if ($userId <= 0 || ! in_array($permission, self::known(), true)) {
            return false;
        }

        return DB::table('platform_user_roles as ur')
            ->join('platform_role_permissions as rp', 'rp.role_id', '=', 'ur.role_id')
            ->where('ur.user_id', $userId)
            ->where('rp.permission', $permission)
            ->exists();
    }

    public static function allAdminRolePermissions(): array
    {
        // No implicit tenant access; strictly the Platform RBAC contract.
        return self::known();
    }

    /** Create a platform role only when explicitly delegated by an authorized source. */
    public static function ensureRole(string $name, array $permissions): int
    {
        $id = DB::table('platform_roles')->where('name', $name)->value('id');
        if ($id === null) {
            $id = DB::table('platform_roles')->insertGetId([
                'ulid' => (string) \Illuminate\Support\Str::ulid(),
                'name' => $name, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        foreach ($permissions as $permission) {
            if (! in_array($permission, self::known(), true)) {
                throw new \InvalidArgumentException('Unknown platform permission.');
            }
            DB::table('platform_role_permissions')->insertOrIgnore([
                'role_id' => $id, 'permission' => $permission,
            ]);
        }
        return (int) $id;
    }
}
