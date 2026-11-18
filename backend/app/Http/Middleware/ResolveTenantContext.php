<?php

namespace App\Http\Middleware;

use App\Models\TenantMembership;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A tenant ULID is a selector, not proof of authorization.
 * Requires an authenticated user and ACTIVE server-side membership.
 */
final class ResolveTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user === null) {
            abort(401);
        }

        $selectedUlid = $request->route('tenant');
        if (!is_string($selectedUlid) || !preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/i', $selectedUlid)) {
            abort(404);
        }

        $membership = TenantMembership::query()
            ->where('user_id', $user->getKey())
            ->where('status', 'active')
            ->whereHas('tenant', fn ($query) => $query
                ->where('ulid', strtoupper($selectedUlid))
                ->where('status', 'active'))
            ->first();

        if ($membership === null) {
            abort(404);
        }

        app(TenantContext::class)->setFromAuthenticatedMembership((int) $membership->tenant_id);

        return $next($request);
    }
}
