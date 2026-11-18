<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

/**
 * PostgreSQL only, never RefreshDatabase. User data rolled back after each test.
 */
final class AuthSessionTest extends TestCase
{
    private bool $transactionStarted = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'pgsql' ||
            config('database.connections.pgsql.database') !== 'ahpos_test') {
            throw new RuntimeException('AuthSessionTest must use ahpos_test PostgreSQL.');
        }

        // Avoid persistent session/cache writes when testing authentication.
        config()->set('session.driver', 'array');
        config()->set('cache.default', 'array');
        DB::beginTransaction();
        $this->transactionStarted = true;
    }

    protected function tearDown(): void
    {
        try {
            if ($this->transactionStarted) {
                DB::rollBack();
            }
        } finally {
            parent::tearDown();
        }
    }

    public function test_guest_cannot_access_profile_or_logout(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_wrong_password_does_not_log_in(): void
    {
        User::factory()->create([
            'email' => 'example-user@ahpos.test',
            'password' => Hash::make('correct-secret'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'example-user@ahpos.test',
            'password' => 'wrong-secret',
        ])->assertUnauthorized();

        $this->assertGuest('web');
    }

    public function test_successful_login_profile_and_logout(): void
    {
        User::factory()->create([
            'name' => 'AH Test User',
            'email' => 'example-user@ahpos.test',
            'password' => Hash::make('correct-secret'),
        ]);

        $this->postJson('/api/login', [
            'email' => 'example-user@ahpos.test',
            'password' => 'correct-secret',
        ])->assertOk()->assertJsonPath('data.email', 'example-user@ahpos.test')
            ->assertJsonMissingPath('data.id')
            ->assertJsonMissingPath('data.password');

        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.name', 'AH Test User')
            ->assertJsonMissingPath('data.id');

        $this->postJson('/api/logout')->assertOk();
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_login_requires_valid_email_and_password(): void
    {
        $this->postJson('/api/login', ['email' => 'invalid', 'password' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }
}
