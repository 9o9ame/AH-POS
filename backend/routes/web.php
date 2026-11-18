<?php

use App\Models\Tenant;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('welcome'));

// Read-only integration probe. No tenant routes can bypass auth + membership checks.
// Temporary endpoint until real authentication/authorization APIs are implemented.
Route::middleware(['auth', 'tenant.context'])
    ->get('/api/tenants/{tenant}/context', function (TenantContext $context) {
        $tenant = Tenant::query()->findOrFail($context->id(), ['ulid', 'name']);
        return response()->json(['data' => [
            'ulid' => $tenant->ulid,
            'name' => $tenant->name,
        ]]);
    });
