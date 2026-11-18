# ADR-0002: Tenant RBAC and staged PostgreSQL RLS rollout

Date: 2026-11-19
Status: Tenant RBAC first implementation pending local tests; RLS NOT ENABLED.

## Implemented in this slice
- `tenant_roles` with internal BIGINT and public ULID; unique name per tenant
- `tenant_role_permissions` with composite tenant/role FK
- `tenant_membership_roles` with composite tenant-scoped FKs on both membership and role to prevent cross-tenant assignment
- Explicit allowlist of permission keys in `TenantPermissions` with default-deny membership/status/tenant checks
- Middleware: `auth` -> `tenant.context` -> `tenant.permission:<permission>`; sample read-only permission probe
- No user granted any roles automatically. Local test-account already created remains unprivileged until a separate audited provisioning workflow is approved.
- No client API may write roles/permissions yet.

## RLS is deliberately not enabled by this migration
Existing Laravel database connection uses `ahpos_app`, the owner of `ahpos_test`. PostgreSQL database/table owners and BYPASSRLS roles must not be considered constrained by ordinary RLS policies. `FORCE ROW LEVEL SECURITY` matters, but designing a policy before safe membership bootstrap and per-transaction DB context would lock out authorization flows or create scope leaks.

Safe rollout gate:
1. Create separate dedicated non-owner non-BYPASSRLS runtime role, migration owner remains separately privileged; audit ownership and grants, no superuser for web runtime.
2. Develop admission/bootstrap access for tenant selection without accidental tenant-wide row grants. Do not let user-controlled `set_config` impersonate another tenant; PHP application supplies tenant context only after verified membership, and DB credentials must never be exposed to tenants.
3. Start one database transaction for a tenant-scoped unit of work, set `SET LOCAL`/transaction-scoped application tenant identifier, and guarantee reset on commit/rollback and pooled connections. Background jobs must obtain the same verified context.
4. Add RLS to every tenant-owned business table with `ENABLE` and `FORCE`; policies deny on missing/malformed context. Test SELECT/INSERT/UPDATE/DELETE with two real tenant rows via non-owner role, including attempts to force context and access unscoped.
5. Include DB-level tenant-composite foreign keys, negative HTTP tests, cross-tenant write/queue/cache tests, audit and deployment migration procedures before acceptance.

This ADR is a security gate, not a claim that PostgreSQL RLS is active. Never run ad-hoc SQL altering current owner role, FORCE RLS, or grants on `ahpos_test` without the planned migration and full regression tests.
