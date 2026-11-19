<?php

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Explicit one-time local development provisioning.
 * No seeders, default credentials, automatic grants, or production access.
 */
Artisan::command('ahpos:provision-test-account', function (): int {
    if (! app()->environment('local')
        || config('database.default') !== 'pgsql'
        || config('database.connections.pgsql.database') !== 'ahpos_test'
        || ! in_array(config('database.connections.pgsql.host'), ['127.0.0.1', 'localhost'], true)) {
        $this->error('Refusing: only local PostgreSQL ahpos_test is allowed.');
        return 1;
    }

    $this->warn('LOCAL TEST ONLY: accepts weak passwords (minimum 3 characters). Never reuse credentials or expose this service publicly.');
    $this->warn('Creates one local test user, tenant and ACTIVE membership in ahpos_test.');
    if (! $this->confirm('Continue?', false)) {
        $this->info('Cancelled; no data changed.');
        return 0;
    }

    $name = trim((string) $this->ask('Test user display name'));
    $email = strtolower(trim((string) $this->ask('Test user email')));
    $tenantName = trim((string) $this->ask('Test tenant name'));
    $password = (string) $this->secret('Password (hidden; minimum 3 characters, LOCAL TEST ONLY)');
    $again = (string) $this->secret('Confirm password (hidden)');

    $validation = Validator::make(
        compact('name', 'email', 'tenantName', 'password'),
        [
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'tenantName' => ['required', 'string', 'min:2', 'max:160'],
            'password' => ['required', 'string', 'min:3', 'max:255'],
        ]
    );

    if ($validation->fails() || ! hash_equals($password, $again)) {
        $this->error('Invalid input, duplicate email, password under 3 characters or password mismatch. No data changed.');
        return 1;
    }

    // All three rows commit together or nothing is saved.
    $result = DB::transaction(function () use ($name, $email, $tenantName, $password): array {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password, // User's hashed cast stores only a hash.
        ]);
        $tenant = Tenant::create(['name' => $tenantName]);
        DB::table('tenant_memberships')->insert([
            'user_id' => $user->getKey(),
            'tenant_id' => $tenant->getKey(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['email' => $user->email, 'ulid' => $tenant->ulid];
    });

    $this->info('Local test account created successfully.');
    $this->line('Login email: '.$result['email']);
    $this->line('Tenant ULID: '.$result['ulid']);

    return 0;
})->purpose('Interactively create one local AH-POS test user and tenant; never for production');


/**
 * Read-only RLS deployment preflight. Does not create roles, change policies,
 * run migrations, or switch the live DB connection.
 */
Artisan::command('ahpos:rls-preflight', function (): int {
    if (config('database.default') !== 'pgsql'
        || config('database.connections.pgsql.database') !== 'ahpos_test') {
        $this->error('Refusing: this preflight is restricted to PostgreSQL ahpos_test.');
        return 2;
    }

    $db = DB::selectOne(
        'SELECT current_database() AS database_name, current_user AS role_name, '.
        'CASE WHEN r.rolsuper THEN 1 ELSE 0 END AS is_superuser, '.
        'CASE WHEN r.rolbypassrls THEN 1 ELSE 0 END AS bypasses_rls '.
        'FROM pg_roles r WHERE r.rolname = current_user'
    );

    if ($db === null) {
        $this->error('Could not inspect the current PostgreSQL role.');
        return 2;
    }

    $this->line('Database: '.$db->database_name);
    $this->line('Active DB role: '.$db->role_name);

    $safeRole = (int) $db->is_superuser === 0 && (int) $db->bypasses_rls === 0;
    $this->line('No SUPERUSER/BYPASSRLS: '.($safeRole ? 'YES' : 'NO'));

    $tables = [
        'tenant_roles',
        'tenant_role_permissions',
        'tenant_membership_roles',
    ];
    $results = DB::select(
        "SELECT c.relname AS table_name, owner.rolname AS owner_name,
                CASE WHEN c.relrowsecurity THEN 1 ELSE 0 END AS rls_enabled,
                CASE WHEN c.relforcerowsecurity THEN 1 ELSE 0 END AS rls_forced,
                CASE WHEN EXISTS (SELECT 1 FROM pg_policies p
                        WHERE p.schemaname = n.nspname
                          AND p.tablename = c.relname) THEN 1 ELSE 0 END AS has_policy
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_roles owner ON owner.oid = c.relowner
         WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
           AND c.relname IN (?, ?, ?)
         ORDER BY c.relname",
        $tables
    );

    $ready = $safeRole && count($results) === count($tables);

    foreach ($results as $result) {
        $notOwner = $result->owner_name !== $db->role_name;
        $this->line(sprintf(
            '%s: owner=%s | non-owner=%s | RLS=%s | FORCE=%s | policy=%s',
            $result->table_name,
            $result->owner_name,
            $notOwner ? 'YES' : 'NO',
            (int) $result->rls_enabled === 1 ? 'YES' : 'NO',
            (int) $result->rls_forced === 1 ? 'YES' : 'NO',
            (int) $result->has_policy === 1 ? 'YES' : 'NO',
        ));

        $ready = $ready && $notOwner && (int) $result->rls_enabled === 1
            && (int) $result->rls_forced === 1 && (int) $result->has_policy === 1;
    }

    if (! $ready) {
        $this->warn('NOT READY: RLS must not be claimed as enforced. No changes made.');
        return 1;
    }

    $this->warn('CATALOG CHECKS PASS ONLY: runtime privileges, policies, cross-tenant access and login flows still require active verification.');
    return 0;
})->purpose('Read-only PostgreSQL RBAC RLS readiness report; never changes the database');


/**
 * Explicit local development catalog grant to an already active tenant member.
 * No web endpoint can assign permissions and no user is granted automatically.
 */
Artisan::command('ahpos:grant-local-catalog', function (): int {
    if (! app()->environment('local')
        || config('database.default') !== 'pgsql'
        || config('database.connections.pgsql.database') !== 'ahpos_test'
        || ! in_array(config('database.connections.pgsql.host'), ['127.0.0.1', 'localhost'], true)) {
        $this->error('Refusing: only a local PostgreSQL ahpos_test database is allowed.');
        return 1;
    }

    $email = strtolower(trim((string) $this->ask('Existing test user email')));
    $tenantUlid = strtoupper(trim((string) $this->ask('Existing tenant ULID')));
    $membership = DB::table('tenant_memberships as m')
        ->join('users as u', 'u.id', '=', 'm.user_id')
        ->join('tenants as t', 't.id', '=', 'm.tenant_id')
        ->where('u.email', $email)
        ->where('t.ulid', $tenantUlid)
        ->where('m.status', 'active')
        ->where('t.status', 'active')
        ->select(['m.id as membership_id', 'm.tenant_id', 't.name as tenant_name'])
        ->first();

    if ($membership === null) {
        $this->error('No active membership found for the supplied user and tenant; no changes.');
        return 1;
    }

    $this->warn('LOCAL TEST ONLY: grant local catalog, parties and inventory permissions to '.$email.' for '.$membership->tenant_name.'.');
    if (! $this->confirm('Grant these permissions?', false)) {
        $this->line('Cancelled; no changes.');
        return 0;
    }

    DB::transaction(function () use ($membership): void {
        $role = DB::table('tenant_roles')
            ->where('tenant_id', $membership->tenant_id)
            ->where('name', 'Local Catalog Operator')->first();

        $roleId = $role?->id;
        if ($roleId === null) {
            $roleId = DB::table('tenant_roles')->insertGetId([
                'tenant_id' => $membership->tenant_id,
                'ulid' => (string) \Illuminate\Support\Str::ulid(),
                'name' => 'Local Catalog Operator',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach (['products.read', 'products.create', 'parties.read', 'parties.create', 'warehouses.read', 'warehouses.create', 'inventory.read', 'inventory.receive'] as $permission) {
            DB::table('tenant_role_permissions')->insertOrIgnore([
                'tenant_id' => $membership->tenant_id,
                'role_id' => $roleId,
                'permission' => $permission,
            ]);
        }
        DB::table('tenant_membership_roles')->insertOrIgnore([
            'tenant_id' => $membership->tenant_id,
            'membership_id' => $membership->membership_id,
            'role_id' => $roleId,
        ]);
    });

    $this->info('Local catalog, party and inventory permissions granted successfully.');
    return 0;
})->purpose('Explicitly authorize one local test membership for catalog and party directory development');
