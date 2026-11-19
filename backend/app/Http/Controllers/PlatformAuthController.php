<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\PlatformPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Support\DevelopmentPasswordRules;

final class PlatformAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $input = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $user = User::query()->whereRaw('lower(email) = ?', [
            strtolower(trim($input['email'])),
        ])->first();

        if ($user === null || ! Hash::check($input['password'], $user->password)
            || ! app(PlatformPermissions::class)->hasAny((int) $user->getKey())) {
            return response()->json(['message' => 'Invalid Platform credentials.'], 401);
        }

        // Signing in to Platform invalidates any current tenant web identity
        // in this browser. Different app realms cannot silently co-exist.
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        $request->session()->put('platform_user_id', (int) $user->getKey());

        return response()->json(['data' => [
            'name' => $user->name, 'email' => $user->email,
        ]])->header('Cache-Control', 'no-store');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Platform signed out.'])
            ->header('Cache-Control', 'no-store');
    }

    /**
     * One-time transition out of the legacy combined Ali tenant/Platform
     * account. The dedicated platform-only user has no tenant memberships.
     */
    public function separateIdentity(Request $request): JsonResponse
    {
        $input = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'email', 'max:255'],
            'password' => DevelopmentPasswordRules::creation(),
            'current_password' => ['required', 'string'],
            'confirm' => ['required', 'accepted'],
        ]);
        $actor = $request->user();
        if (! DB::table('tenant_memberships')->where('user_id', $actor->getKey())->exists()) {
            return response()->json(['message' => 'This Platform account is already separate from tenant identities.'], 409);
        }
        if (! Hash::check($input['current_password'], $actor->password)) {
            return response()->json(['message' => 'Current Platform password incorrect.'], 422);
        }
        $email = strtolower(trim($input['email']));
        if (DB::table('users')->whereRaw('lower(email) = ?', [$email])->exists()) {
            return response()->json(['message' => 'That email is already registered.'], 409);
        }
        $result = DB::transaction(function () use ($request, $actor, $input, $email): array {
            $actorRoleIds = DB::table('platform_user_roles')->where('user_id', $actor->getKey())
                ->lockForUpdate()->pluck('role_id')->all();
            $superAdminRoleId = DB::table('platform_roles')->where('name', 'Super Admin')->value('id');
            if ($superAdminRoleId === null || ! in_array((int) $superAdminRoleId, array_map('intval',$actorRoleIds), true)) {
                abort(403);
            }
            $newUser = User::create([
                'name' => trim($input['name']), 'email' => $email,
                'password' => $input['password'],
            ]);
            foreach ($actorRoleIds as $roleId) {
                DB::table('platform_user_roles')->insert([
                    'user_id' => $newUser->getKey(), 'role_id' => $roleId,
                ]);
            }
            // Transfer only Platform authority. The old user remains an
            // unchanged business member; new Platform account is not a tenant.
            DB::table('platform_user_roles')->where('user_id', $actor->getKey())->delete();
            DB::table('platform_audit_events')->insert([
                'ulid' => (string) Str::ulid(),
                'actor_id' => $actor->getKey(),
                'action' => 'platform.super_admin.identity_separated',
                'target_type' => 'platform_user',
                'target_ulid' => null,
                'metadata' => json_encode(['old_email' => $actor->email, 'new_email' => $email],
                    JSON_THROW_ON_ERROR),
                'ip_address' => $request->ip(),
                'created_at' => now(),
            ]);
            return ['name' => $newUser->name, 'email' => $newUser->email];
        });
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['data' => $result,
            'message' => 'Platform ownership transferred. Sign in using the new dedicated Platform account.',
        ])->header('Cache-Control', 'no-store');
    }
}
