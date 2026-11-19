<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

/**
 * Local developer/test convenience only; never makes production API credentials
 * weaker. In ahpos_test on loopback under APP_ENV=local/testing, minimum is 3.
 */
final class DevelopmentPasswordRules
{
    /** @return array<int, mixed> */
    public static function creation(): array
    {
        $localPilot = app()->environment('local', 'testing')
            && config('database.default') === 'pgsql'
            && config('database.connections.pgsql.database') === 'ahpos_test'
            && in_array(config('database.connections.pgsql.host'), ['127.0.0.1', 'localhost'], true);
        return $localPilot
            ? ['required', 'string', 'min:3']
            : ['required', 'string', Password::min(12)->mixedCase()->numbers()->symbols()];
    }
}
