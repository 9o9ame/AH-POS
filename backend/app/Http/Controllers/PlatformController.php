<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use App\Support\PlatformPermissions;
use App\Support\TenantPermissions;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

final class PlatformController extends Controller
{
    private function audit(Request $request, string $action, string $type, ?string $ulid = null, array $metadata = []): void
    {
        DB::table('platform_audit_events')->insert([
            'ulid' => (string) Str::ulid(),
            'actor_id' => $request->user()->getKey(),
            'action' => $action,
            'target_type' => $type,
            'target_ulid' => $ulid,
            'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'ip_address' => $request->ip(),
            'created_at' => now(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $permissions = collect(PlatformPermissions::known())
            ->filter(fn (string $permission): bool => app(PlatformPermissions::class)
                ->allows((int) $request->user()->getKey(), $permission))
            ->values()->all();

        if ($permissions === []) abort(403);

        return response()->json(['data' => [
            'name' => $request->user()->name,
            'permissions' => $permissions,
        ]]);
    }

    public function overview(): JsonResponse
    {
        return response()->json(['data' => [
            'admins' => DB::table('tenants')->count(),
            'active_admins' => DB::table('tenants')->where('status', 'active')->count(),
            'platform_staff' => DB::table('platform_user_roles')->distinct('user_id')->count('user_id'),
        ]]);
    }

    public function admins(): JsonResponse
    {
        // Explicit platform read authority. Deliberately excludes tenant
        // financial records, product counts, stock, sensitive ledgers.
        $rows = DB::table('tenants as t')
            ->leftJoin('tenant_roles as r', function ($join): void {
                $join->on('r.tenant_id', '=', 't.id')->where('r.name', 'Admin Owner');
            })
            ->leftJoin('tenant_membership_roles as mr', function ($join): void {
                $join->on('mr.tenant_id', '=', 't.id')->on('mr.role_id', '=', 'r.id');
            })
            ->leftJoin('tenant_memberships as m', function ($join): void {
                $join->on('m.tenant_id', '=', 't.id')
                    ->on('m.id', '=', 'mr.membership_id')
                    ->where('m.status', 'active');
            })
            ->leftJoin('users as u', 'u.id', '=', 'm.user_id')
            ->orderBy('t.id', 'desc')
            ->limit(200)
            ->get(['t.ulid', 't.name', 't.status', 't.created_at',
                'u.name as owner_name', 'u.email as owner_email'])
            ->unique('ulid')->values();

        return response()->json(['data' => $rows]);
    }

    public function createAdmin(Request $request): JsonResponse
    {
        $values = $request->validate([
            'business_name' => ['required', 'string', 'min:2', 'max:160'],
            'owner_name' => ['required', 'string', 'min:2', 'max:160'],
            'owner_email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', Password::min(12)->mixedCase()->numbers()->symbols()],
        ]);
        $email = strtolower(trim($values['owner_email']));
        if (DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists()) {
            return response()->json(['message' => 'Email already belongs to an account; use a new email.'], 409);
        }

        try {
            $result = DB::transaction(function () use ($values, $email, $request): array {
            $owner = User::create([
                'name' => trim($values['owner_name']),
                'email' => $email,
                'password' => $values['password'],
            ]);
            $tenant = Tenant::create(['name' => trim($values['business_name'])]);

            $membership = DB::table('tenant_memberships')->insertGetId([
                'tenant_id' => $tenant->getKey(), 'user_id' => $owner->getKey(),
                'status' => 'active', 'created_at' => now(), 'updated_at' => now(),
            ]);
            $roleId = DB::table('tenant_roles')->insertGetId([
                'tenant_id' => $tenant->getKey(), 'ulid' => (string) Str::ulid(),
                'name' => 'Admin Owner', 'created_at' => now(), 'updated_at' => now(),
            ]);
            foreach (TenantPermissions::known() as $permission) {
                DB::table('tenant_role_permissions')->insert([
                    'tenant_id' => $tenant->getKey(),
                    'role_id' => $roleId, 'permission' => $permission,
                ]);
            }
            DB::table('tenant_membership_roles')->insert([
                'tenant_id' => $tenant->getKey(), 'membership_id' => $membership,
                'role_id' => $roleId,
            ]);
            $this->audit($request, 'platform.admin.created', 'tenant', $tenant->ulid, [
                'owner_email' => $owner->email,
            ]);
            return [
                'ulid' => $tenant->ulid, 'name' => $tenant->name,
                'status' => 'active', 'owner_name' => $owner->name, 'owner_email' => $owner->email,
            ];
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23505') {
                return response()->json(['message' => 'Duplicate account or role. Please refresh.'], 409);
            }
            throw $exception;
        }

        return response()->json(['data' => $result], 201);
    }

    public function staff(): JsonResponse
    {
        $users = DB::table('platform_user_roles as ur')
            ->join('users as u', 'u.id', '=', 'ur.user_id')
            ->join('platform_roles as r', 'r.id', '=', 'ur.role_id')
            ->orderBy('u.name')->limit(200)
            ->get(['u.name', 'u.email', 'r.name as platform_role']);

        return response()->json(['data' => $users]);
    }

    public function createStaff(Request $request): JsonResponse
    {
        $values = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', Password::min(12)->mixedCase()->numbers()->symbols()],
            'role' => ['required', 'in:Support Operator,Admin Manager'],
        ]);
        $email = strtolower(trim($values['email']));
        if (DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists()) {
            return response()->json(['message' => 'Email already belongs to an account.'], 409);
        }

        $result = DB::transaction(function () use ($values, $email, $request): array {
            $user = User::create([
                'name' => trim($values['name']), 'email' => $email,
                'password' => $values['password'],
            ]);
            $permissions = $values['role'] === 'Support Operator'
                ? ['platform.overview.read', 'platform.admins.read']
                : ['platform.overview.read', 'platform.admins.read', 'platform.admins.create'];
            $roleId = PlatformPermissions::ensureRole($values['role'], $permissions);
            DB::table('platform_user_roles')->insert([
                'user_id' => $user->getKey(), 'role_id' => $roleId,
            ]);
            $this->audit($request, 'platform.staff.created', 'platform_staff', null, [
                'email' => $user->email, 'role' => $values['role'],
            ]);
            return ['name' => $user->name, 'email' => $user->email, 'platform_role' => $values['role']];
        });

        return response()->json(['data' => $result], 201);
    }

    public function auditEvents(): JsonResponse
    {
        $events = DB::table('platform_audit_events as e')
            ->join('users as u', 'u.id', '=', 'e.actor_id')
            ->orderBy('e.id', 'desc')->limit(100)
            ->get(['e.ulid', 'e.action', 'e.target_type', 'e.target_ulid',
                'e.created_at', 'u.name as actor_name']);
        return response()->json(['data' => $events]);
    }
}
