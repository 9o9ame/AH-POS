<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\TenantContext;
use App\Support\TenantStaffAccess;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

final class TenantStaffController extends Controller
{
    public function index(TenantContext $context): JsonResponse
    {
        $members = DB::table('tenant_memberships as m')
            ->join('users as u', 'u.id', '=', 'm.user_id')
            ->leftJoin('tenant_membership_roles as mr', function ($join): void {
                $join->on('mr.membership_id', '=', 'm.id')->on('mr.tenant_id', '=', 'm.tenant_id');
            })
            ->leftJoin('tenant_roles as r', function ($join): void {
                $join->on('r.id', '=', 'mr.role_id')->on('r.tenant_id', '=', 'm.tenant_id');
            })
            ->where('m.tenant_id', $context->id())
            ->orderBy('u.name')->limit(250)
            ->get(['m.id as membership_id', 'm.status', 'm.requires_device_approval',
                'u.name', 'u.email', 'r.name as role_name', 'r.ulid as role_ulid']);
        return response()->json(['data' => $members->map(function ($member): array {
            return [
                'name' => $member->name, 'email' => $member->email,
                'status' => $member->status, 'requires_device_approval' => (bool) $member->requires_device_approval,
                'role' => $member->role_name,
            ];
        })->values()]);
    }

    public function roleTemplates(): JsonResponse
    {
        return response()->json(['data' => collect(TenantStaffAccess::templates())
            ->map(fn (array $permissions, string $name) => ['name' => $name, 'permissions' => $permissions])
            ->values()]);
    }

    public function store(Request $request, TenantContext $context): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', Password::min(12)->mixedCase()->numbers()->symbols()],
            'role' => ['required', 'in:Cashier,Purchaser,Inventory Clerk,Manager'],
        ]);
        $email = strtolower(trim($data['email']));
        if (DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists()) {
            return response()->json(['message' => 'Email already exists. Contact Admin for account assignment.'], 409);
        }

        try {
            $result = DB::transaction(function () use ($request, $context, $data, $email): array {
                $user = User::create([
                    'name' => trim($data['name']), 'email' => $email,
                    'password' => $data['password'],
                ]);
                $membership = DB::table('tenant_memberships')->insertGetId([
                    'tenant_id' => $context->id(), 'user_id' => $user->getKey(),
                    'status' => 'active', 'requires_device_approval' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $roleId = TenantStaffAccess::ensureRole($context->id(), $data['role']);
                DB::table('tenant_membership_roles')->insert([
                    'tenant_id' => $context->id(), 'membership_id' => $membership, 'role_id' => $roleId,
                ]);
                $tenant = DB::table('tenants')->where('id', $context->id())->value('ulid');
                TenantStaffAccess::audit($request, $context->id(), 'tenant.staff.created', (string) $tenant, [
                    'email' => $email, 'role' => $data['role'],
                ]);
                return [
                    'name' => $user->name, 'email' => $user->email,
                    'role' => $data['role'], 'status' => 'active', 'requires_device_approval' => true,
                ];
            });
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23505') {
                return response()->json(['message' => 'Staff email or role is already registered.'], 409);
            }
            throw $exception;
        }
        return response()->json(['data' => $result], 201);
    }

    public function changeStatus(Request $request, TenantContext $context, string $staff): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:active,suspended']]);
        $user = User::query()->where('email', strtolower($staff))->first();
        if ($user === null || $user->getKey() === $request->user()->getKey()) abort(404);

        $membership = DB::table('tenant_memberships')->where('tenant_id', $context->id())
            ->where('user_id', $user->getKey())->first();
        if ($membership === null) abort(404);
        if (DB::table('tenant_membership_roles as mr')
            ->join('tenant_roles as r', function ($join): void {
                $join->on('r.tenant_id', '=', 'mr.tenant_id')->on('r.id', '=', 'mr.role_id');
            })
            ->where('mr.tenant_id', $context->id())
            ->where('mr.membership_id', $membership->id)
            ->where('r.name', 'Admin Owner')->exists()) abort(403);

        DB::transaction(function () use ($request, $context, $membership, $data, $user): void {
            DB::table('tenant_memberships')->where('id', $membership->id)
                ->where('tenant_id', $context->id())->update([
                    'status' => $data['status'], 'updated_at' => now(),
                ]);
            if ($data['status'] === 'suspended') {
                DB::table('tenant_staff_devices')->where('tenant_id', $context->id())
                    ->where('membership_id', $membership->id)
                    ->where('status', 'approved')->update([
                        'status' => 'revoked', 'revoked_at' => now(), 'updated_at' => now(),
                    ]);
            }
            TenantStaffAccess::audit($request, $context->id(), 'tenant.staff.status', null, [
                'email' => $user->email, 'status' => $data['status'],
            ]);
        });
        return response()->json(['data' => ['email' => $user->email, 'status' => $data['status']]]);
    }
}
