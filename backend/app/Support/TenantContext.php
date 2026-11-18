<?php

namespace App\Support;

use LogicException;

/**
 * Request-scoped context; never accepts a tenant ID from an untrusted request.
 * Resolve it only from authenticated, active server-side memberships.
 */
final class TenantContext
{
    private ?int $tenantId = null;

    public function setFromAuthenticatedMembership(int $tenantId): void
    {
        if ($tenantId < 1 || $this->tenantId !== null) {
            throw new LogicException('Tenant context is missing or already set.');
        }

        $this->tenantId = $tenantId;
    }

    public function id(): int
    {
        return $this->tenantId ?? throw new LogicException('Tenant context was not resolved.');
    }
}
