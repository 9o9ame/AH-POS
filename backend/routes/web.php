<?php

use App\Http\Controllers\AuthSessionController;
use App\Models\Tenant;
use Illuminate\Http\Request;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => view('welcome'));

// Same-origin CSRF handshake for the Vite dev proxy and later browser SPA.
// Session token is returned only to the current browser, never cached.
Route::get('/api/csrf', function (Request $request) {
    return response()->json(['token' => $request->session()->token()])
        ->header('Cache-Control', 'no-store');
});

// Session cookies + Laravel web CSRF protection; no public registration or default users.
Route::post('/api/login', [AuthSessionController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('auth')->group(function (): void {
    Route::get('/api/me', [AuthSessionController::class, 'me']);
    Route::post('/api/logout', [AuthSessionController::class, 'logout']);
});

// Authenticated tenant chooser: active memberships and active tenants only.
// Never trust a client tenant ID; return only public identifiers and approved names.
Route::middleware('auth')
    ->get('/api/my/tenants', function (Request $request) {
        $tenants = Tenant::query()
            ->where('status', 'active')
            ->whereHas('memberships', fn ($query) => $query
                ->where('user_id', $request->user()->getKey())
                ->where('status', 'active'))
            ->orderBy('name')
            ->get(['ulid', 'name']);

        return response()->json(['data' => $tenants]);
    });

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
