<?php

use App\Http\Controllers\AuthSessionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\OperationsReportController;
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

// Development RBAC integration probe. Does not expose tenant settings data.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope', 'tenant.permission:tenant.settings.read'])
    ->get('/api/tenants/{tenant}/rbac-check', fn () => response()->json([
        'data' => ['authorized' => true],
    ]));


// First operational business module: product catalog.
// Membership + scoped PostgreSQL transaction + RBAC enforced server-side.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/products', [ProductController::class, 'index'])
        ->middleware('tenant.permission:products.read');
    Route::post('/api/tenants/{tenant}/products', [ProductController::class, 'store'])
        ->middleware('tenant.permission:products.create');
});


// Operational customer and supplier directory: active tenant membership,
// transaction scope and explicit permissions required.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/parties', [PartyController::class, 'index'])
        ->middleware('tenant.permission:parties.read');
    Route::post('/api/tenants/{tenant}/parties', [PartyController::class, 'store'])
        ->middleware('tenant.permission:parties.create');
});


// Inventory v1: tenant-owned warehouses, stock inwards and read-only balances.
// No sale posting, stock decrements or accounting journal here.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/warehouses', [WarehouseController::class, 'index'])
        ->middleware('tenant.permission:warehouses.read');
    Route::post('/api/tenants/{tenant}/warehouses', [WarehouseController::class, 'store'])
        ->middleware('tenant.permission:warehouses.create');
    Route::get('/api/tenants/{tenant}/inventory', [InventoryController::class, 'overview'])
        ->middleware('tenant.permission:inventory.read');
    Route::post('/api/tenants/{tenant}/inventory/receive', [InventoryController::class, 'receive'])
        ->middleware('tenant.permission:inventory.receive');
});


// Local-only finance-pilot posting is guarded inside controllers until GL/tax approval.
// Every endpoint still authenticates, verifies tenant and checks specific role access.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/purchases', [PurchaseController::class, 'index'])
        ->middleware('tenant.permission:purchases.read');
    Route::post('/api/tenants/{tenant}/purchases', [PurchaseController::class, 'store'])
        ->middleware('tenant.permission:purchases.create');
    Route::get('/api/tenants/{tenant}/sales', [SaleController::class, 'index'])
        ->middleware('tenant.permission:sales.read');
    Route::post('/api/tenants/{tenant}/sales', [SaleController::class, 'store'])
        ->middleware('tenant.permission:sales.create');
    Route::get('/api/tenants/{tenant}/sales/{sale}', [SaleController::class, 'show'])
        ->middleware('tenant.permission:sales.read');
});

Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])
    ->get('/api/tenants/{tenant}/reports/operations', [OperationsReportController::class, 'overview'])
    ->middleware('tenant.permission:reports.read');
