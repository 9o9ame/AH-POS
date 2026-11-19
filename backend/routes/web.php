<?php

use App\Http\Controllers\AuthSessionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PlatformController;
use App\Http\Controllers\PlatformAuthController;
use App\Http\Controllers\TenantStaffController;
use App\Http\Controllers\TenantDeviceController;
use App\Http\Controllers\DefinitionMasterController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\CashShiftController;
use App\Http\Controllers\HeldSaleController;
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


// Inventory v1: tenant-owned warehouses, stock inwards and signed movement balances.
// Sale stock-out reuses this ledger; accounting journals still pending.
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


// Immutable, local-only sale return pilot: linked partial refunds and stock reversal.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/sale-returns', [SaleReturnController::class, 'index'])
        ->middleware('tenant.permission:returns.read');
    Route::post('/api/tenants/{tenant}/sale-returns', [SaleReturnController::class, 'store'])
        ->middleware('tenant.permission:returns.create');
});


// Local pilot: shift snapshots link only transactions created while shift is open.
// Old/unassigned documents are never silently pulled into a cashier close.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/cash-shifts', [CashShiftController::class, 'index'])
        ->middleware('tenant.permission:cash_shifts.read');
    Route::post('/api/tenants/{tenant}/cash-shifts', [CashShiftController::class, 'open'])
        ->middleware('tenant.permission:cash_shifts.open');
    Route::post('/api/tenants/{tenant}/cash-shifts/{shift}/close', [CashShiftController::class, 'close'])
        ->middleware('tenant.permission:cash_shifts.close');
});


// Server-persisted unposted invoices. Cashier-scoped, not inventory reservations.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/sale-holds', [HeldSaleController::class, 'index'])
        ->middleware('tenant.permission:sales.holds.read');
    Route::post('/api/tenants/{tenant}/sale-holds', [HeldSaleController::class, 'save'])
        ->middleware('tenant.permission:sales.holds.write');
    Route::post('/api/tenants/{tenant}/sale-holds/{hold}/discard', [HeldSaleController::class, 'discard'])
        ->middleware('tenant.permission:sales.holds.write');
});


// Real tenant-scoped product definition masters (not static mock menu items).
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/definitions/{kind}', [DefinitionMasterController::class, 'index'])
        ->middleware('tenant.permission:definitions.read');
    Route::post('/api/tenants/{tenant}/definitions/{kind}', [DefinitionMasterController::class, 'store'])
        ->middleware('tenant.permission:definitions.manage');
    Route::patch('/api/tenants/{tenant}/definitions/{kind}/{master}/status', [DefinitionMasterController::class, 'setStatus'])
        ->middleware('tenant.permission:definitions.manage');
});


// Super Admin Platform authority is separate from tenant context. Platform
// operators never acquire business data access through these routes.
Route::post('/api/platform/auth/login', [PlatformAuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware('platform.auth')->group(function (): void {
    Route::post('/api/platform/auth/logout', [PlatformAuthController::class, 'logout']);
    Route::post('/api/platform/auth/separate-identity', [PlatformAuthController::class, 'separateIdentity'])
        ->middleware(['platform.permission:platform.staff.manage', 'throttle:3,1']);
    Route::get('/api/platform/me', [PlatformController::class, 'me']);
    Route::get('/api/platform/overview', [PlatformController::class, 'overview'])
        ->middleware('platform.permission:platform.overview.read');
    Route::get('/api/platform/admins', [PlatformController::class, 'admins'])
        ->middleware('platform.permission:platform.admins.read');
    Route::get('/api/platform/admins/{tenant}/owner-candidates', [PlatformController::class, 'ownerCandidates'])
        ->middleware('platform.permission:platform.admins.create');
    Route::post('/api/platform/admins/{tenant}/assign-owner', [PlatformController::class, 'assignExistingOwner'])
        ->middleware(['platform.permission:platform.admins.create', 'throttle:8,1']);
    Route::post('/api/platform/admins', [PlatformController::class, 'createAdmin'])
        ->middleware(['platform.permission:platform.admins.create', 'throttle:8,1']);
    Route::get('/api/platform/staff', [PlatformController::class, 'staff'])
        ->middleware('platform.permission:platform.staff.read');
    Route::post('/api/platform/staff', [PlatformController::class, 'createStaff'])
        ->middleware(['platform.permission:platform.staff.manage', 'throttle:8,1']);
    Route::get('/api/platform/audit', [PlatformController::class, 'auditEvents'])
        ->middleware('platform.permission:platform.audit.read');
});


// Staff management is strictly tenant Admin RBAC. New staff receive only a
// pre-defined cashier, purchaser, inventory or manager role. No platform powers.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/staff', [TenantStaffController::class, 'index'])
        ->middleware('tenant.permission:tenant.members.read');
    Route::get('/api/tenants/{tenant}/staff/role-templates', [TenantStaffController::class, 'roleTemplates'])
        ->middleware('tenant.permission:tenant.members.read');
    Route::post('/api/tenants/{tenant}/staff', [TenantStaffController::class, 'store'])
        ->middleware(['tenant.permission:tenant.members.manage', 'throttle:8,1']);
    Route::patch('/api/tenants/{tenant}/staff/{staff}/status', [TenantStaffController::class, 'changeStatus'])
        ->middleware('tenant.permission:tenant.members.manage');

    Route::get('/api/tenants/{tenant}/devices', [TenantDeviceController::class, 'index'])
        ->middleware('tenant.permission:tenant.devices.read');
    Route::post('/api/tenants/{tenant}/devices/{device}/decision', [TenantDeviceController::class, 'decision'])
        ->middleware('tenant.permission:tenant.devices.manage');
});

// These two routes must remain reachable by an authenticated tenant member
// with pending device status; all normal tenant routes are blocked by the
// central ResolveTenantContext device check until an Admin approves.
Route::middleware(['auth', 'tenant.context', 'tenant.db-scope'])->group(function (): void {
    Route::get('/api/tenants/{tenant}/device/status', [TenantDeviceController::class, 'status'])
        ->name('tenant.device.status');
    Route::post('/api/tenants/{tenant}/device/request', [TenantDeviceController::class, 'request'])
        ->middleware('throttle:5,1')->name('tenant.device.request');
});
