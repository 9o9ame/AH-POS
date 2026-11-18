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

## 2026-11-19 implementation/verification update
- User confirmed tenant RBAC migration ran and existing 4 RBAC / 8 tenant-access tests PASS (24 assertions).
- Implemented transaction-local `set_config('app.tenant_id', resolvedTenantId, true)` via parameterized SQL inside `DB::transaction`, after auth+membership; registered middleware on read-only RBAC permission probe. Added 3 scope lifecycle tests and 2 cross-tenant composite FK checks; neither new test suite has yet been run.
- **RLS still off.** Custom PostgreSQL GUC is not an authorization credential (DB clients can set it); the runtime role must be server-only and tenant context must come from an independently verified active user membership. In Laravel tests already wrapped in an outer transaction, nested SAVEPOINTs may keep a SET LOCAL value alive until the outer test transaction rolls back; no claim of per-request isolation from such a harness. Verify worker/connection-pool cleanup independently before deployment.
- Actual RLS migration will be gated on separated runtime/migration DB roles, reliable auth bootstrap reads, and tests proving denial of cross-tenant SELECT/INSERT/UPDATE/DELETE under a non-owner role. Do not add RLS to `users`, session storage, tenant chooser or membership admission queries without a separate safety design.

## 2026-11-19 verification and safe preflight
- User local results: TenantDbTransactionTest 3 PASS / 5 assertions; TenantRbacIntegrityTest 2 PASS / 4 assertions; TenantRbacTest 4 PASS / 7 assertions; TenantAccessTest 8 PASS / 17 assertions.
- Added read-only `ahpos:rls-preflight` to inspect existing PostgreSQL role, owner, RLS enable/force and policy presence for three RBAC pilot tables. Run against local `ahpos_test` only. Expected exit 1/NOT READY on the current owner-based Laravel setup; this is a successful diagnostic, not a failed migration.
- Catalog checks are necessary but not sufficient: they do not evaluate policy expressions, grants, connection bootstrap or cross-tenant row rejection. Enabling RLS and switching web runtime credentials require separate planned, tested deployment steps, without interrupting existing login.
