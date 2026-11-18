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
