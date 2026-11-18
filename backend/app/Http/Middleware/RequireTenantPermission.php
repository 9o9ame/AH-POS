<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use App\Support\TenantPermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireTenantPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        // No context = exception / deny. Never choose tenant from request payload.
        $tenantId = app(TenantContext::class)->id();

        if (! app(TenantPermissions::class)->allows((int) $user->getKey(), $tenantId, $permission)) {
            abort(403);
        }

        return $next($request);
    }
}
