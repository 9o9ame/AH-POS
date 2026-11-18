<?php

namespace App\Http\Middleware;

use App\Support\TenantDbTransaction;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Wraps scoped endpoints and their permission queries in one DB transaction.
 * Authentication and tenant membership MUST run before this middleware.
 */
final class TenantDbScope
{
    public function handle(Request $request, Closure $next): Response
    {
        return app(TenantDbTransaction::class)->run(fn (): Response => $next($request));
    }
}
