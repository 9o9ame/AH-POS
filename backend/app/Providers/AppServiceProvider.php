<?php

namespace App\Providers;

use App\Support\TenantContext;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // A new context per request/job lifecycle, never a process-wide singleton.
        $this->app->scoped(TenantContext::class, fn () => new TenantContext());
    }

    public function boot(): void
    {
        //
    }
}
