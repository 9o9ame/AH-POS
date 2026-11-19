<?php

use App\Http\Middleware\ResolveTenantContext;
use App\Http\Middleware\RequireTenantPermission;
use App\Http\Middleware\RequirePlatformPermission;
use App\Http\Middleware\TenantDbScope;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant.context' => ResolveTenantContext::class,
            'tenant.permission' => RequireTenantPermission::class,
            'tenant.db-scope' => TenantDbScope::class,
            'platform.permission' => RequirePlatformPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
