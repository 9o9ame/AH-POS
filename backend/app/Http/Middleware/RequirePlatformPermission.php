<?php

namespace App\Http\Middleware;

use App\Support\PlatformPermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequirePlatformPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }
        if (! app(PlatformPermissions::class)->allows((int) $user->getKey(), $permission)) {
            abort(403);
        }
        return $next($request);
    }
}
