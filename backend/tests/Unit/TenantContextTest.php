<?php

namespace Tests\Unit;

use App\Support\TenantContext;
use LogicException;
use PHPUnit\Framework\TestCase;

final class TenantContextTest extends TestCase
{
    public function test_unresolved_context_fails_closed(): void
    {
        $this->expectException(LogicException::class);
        (new TenantContext())->id();
    }

    public function test_context_can_be_set_only_once(): void
    {
        $context = new TenantContext();
        $context->setFromAuthenticatedMembership(5);
        self::assertSame(5, $context->id());
        $this->expectException(LogicException::class);
        $context->setFromAuthenticatedMembership(6);
    }

    public function test_invalid_tenant_id_is_rejected(): void
    {
        $this->expectException(LogicException::class);
        (new TenantContext())->setFromAuthenticatedMembership(0);
    }
}
