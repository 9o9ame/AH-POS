<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\PlatformPermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Platform login lives in its own session realm. Web/tenant login is never
 * evidence of Platform authority, even if the same user has a platform role.
 */
final class RequirePlatformSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->session()->get('platform_user_id');
        if (! is_int($id) && ! ctype_digit((string) $id)) {
            return response()->json(['message' => 'Platform sign-in required.'], 401);
        }
        $user = User::query()->find((int) $id);
        if ($user === null || ! app(PlatformPermissions::class)->hasAny((int) $user->getKey())) {
            $request->session()->forget('platform_user_id');
            return response()->json(['message' => 'Platform access denied.'], 401);
        }
        // Platform controllers intentionally depend only on this resolver,
        // not Laravel's default tenant web-authenticated identity.
        $request->setUserResolver(static fn () => $user);
        return $next($request);
    }
}
