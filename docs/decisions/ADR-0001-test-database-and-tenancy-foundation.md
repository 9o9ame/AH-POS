# ADR-0001: One development database and tenant foundation

Status: Partially implemented; security signoff pending.
Date: 2026-11-19

## Decision
Use one PostgreSQL `ahpos_test` database while developing. Tenant records and membership associations are stored in shared schema. This is **not** a single-tenant design. Legacy SQL Server backups are test/reference only; use a fresh backup for a separately approved, reconciled go-live import.

Current bootstrap adds only `tenants` and `tenant_memberships` alongside default Laravel user/session/cache/job tables. No business ownership tables, branch/warehouse roles, billing, production migrations or legacy import yet.

Tenant IDs are internal BIGINT; public tenant selection uses ULIDs. Tenant selection alone does not authorize access. Authenticated membership and active tenant state are mandatory; untrusted client tenant identifiers never become trusted query scopes. A request-scoped TenantContext throws when missing.

## Security gates (not yet complete)
- Do not expose tenant-scoped write APIs before auth, scoped services, policies and negative tests.
- Never use an app DB owner/superuser as the final production runtime role. Separate migration owner and least-privileged runtime role; test PostgreSQL RLS with FORCE ROW LEVEL SECURITY and non-BYPASSRLS role.
- Expand to roles/permissions and composite tenant-scoped keys for branch/warehouse/business tables.
- Dedicated PostgreSQL test suite must use disposable database/transaction safeguards; never run destructive RefreshDatabase on persistent user data.
- No tenant records automatically seeded. No default access grant.
- Future staging and production require separate domains, credentials, storage and databases; promotion via staging tests.

## Verification
Schema migrations and unit tests committed but NOT executed in the assistant environment. Run `php artisan migrate:status` then `php artisan migrate --force` **only in confirmed empty development ahpos_test**, then `php artisan test --filter=TenantContextTest`. Local testing results must be reported before acceptance.
