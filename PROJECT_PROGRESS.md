# AH-POS — Verified Progress

**As of:** 2026-11-18  
**Web baseline acceptance:** **0% / 100%**  
**Mobile acceptance:** **0%** (separate roadmap, deferred)  
**Current milestone:** P0 — Restore and inspect legacy database  
**Source of truth:** `PROJECT_MILESTONES.csv` and linked evidence in this file.

| Phase | Scope | Weight | Accepted fraction | Counted web contribution |
|---|---|---:|---:|---:|
| P0 | Legacy restore, inspect, mapping | 12% | 0 | 0% |
| P1 | Architecture, tenancy, security, CI | 13% | 0 | 0% |
| P2 | Brand, UI design, application shell | 8% | 0 | 0% |
| P3 | Master data and import engine | 14% | 0 | 0% |
| P4 | Purchase, inventory, accounting | 14% | 0 | 0% |
| P5 | Online sales, returns, receipts | 15% | 0 | 0% |
| P6 | Offline web sales and sync | 10% | 0 | 0% |
| P7 | Reports, administration, operations | 8% | 0 | 0% |
| P8 | AI copilot MVP | 6% | 0 | 0% |
| **Total** | **Web** | **100%** | | **0%** |

**Calculation:** sum of phase weight × independently accepted task fraction. `implemented_unverified` is **not accepted**. Any change to weights/scope needs an approved versioned baseline.

**Mobile trigger:** start planning/implementation of native companion after 70–80% evidence-based **accepted web** completion and stable tenancy, sales and sync API contracts.

## Evidence log
- 2026-11-18: Planning baseline and repo handoff created. No implementation acceptance evidence. Contribution remains 0%.

## Next gate
P0 success requires actual successful isolated restore or independently verifiable source schema export, a sanitized source inventory, key/relationship map, legacy-to-target mapping, and signed financial/stock reconciliation strategy. Until then, do not assert that data can be dumped straight into a tenant.

## 2026-11-18 P0 preparation checkpoint
Verified GitHub documentation and created unverified source inventory/mapping templates. Original backup unavailable; restoration and acceptance tests not run. P0 is blocked pending private backup access. Accepted web contribution remains **0%**, mobile **0%**.

## 2026-11-18 — Development initiated on explicit user direction
User approved beginning app development without waiting for exhaustive old-backup investigation. Added frontend React/TypeScript Vite starter and no-overwrite Laravel bootstrap script; local install, compilation, runtime, tests and database configuration **not executed/verified**. Planning now uses ONE AH-POS PostgreSQL test database; staging and production will be strictly separated on launch. P1 status `implemented_unverified`; P0 old backup mapping deferred to go-live fresh-backup acceptance. **Accepted web/mobile 0%.**

## 2026-11-19 — User-provided development verification
Frontend dependency installation succeeded, `npm run build` PASS, Vite dev server launched. Laravel 13 skeleton installation succeeded locally; its default Composer scripts unexpectedly created/migrated local SQLite; no PostgreSQL test DB created yet. Bootstrap script corrected in repo to use `--no-scripts` for future fresh installations (not locally retested). Backend generated source has not been committed. **No accepted P1 tenancy/security or POS workflow yet; accepted web/mobile progress remain 0%.**

## 2026-11-19 — PostgreSQL configuration prepared
Committed Laravel PostgreSQL defaults (`pgsql`, `ahpos_test`) and removed implicit SQLite creation in future Composer post-create. Existing user's local `.env` must be edited separately; PostgreSQL availability, connectivity, migrations and tenant isolation are not yet verified. Accepted 0%.

## 2026-11-19 — PostgreSQL connectivity and unverified P1 code
User successfully verified Laravel connects to `ahpos_test` (PostgreSQL 18.6, 0 tables). Tenant/membership schema migration, models, middleware and no-DB unit tests committed, **not yet migrated or executed**. This is partial P1 code without auth route wiring or RLS; no accepted percent increase.

## 2026-11-19 — Local migrations and basic tests verified; P1 security work continued
User-supplied evidence: PostgreSQL 18.6 `ahpos_test` has 11 tables, all 4 migrations completed, and 3 pure unit tests passed (4 assertions). Added guarded tenant context read-only route and 5 PostgreSQL rollback-only feature tests (unexecuted). P1 remains incomplete without authentication UX, RBAC, RLS and robust cross-tenant checks; accepted web/mobile completion remains **0%**.

## 2026-11-19 — Tenant middleware verification and chooser implementation
User supplied passing results: 5 PostgreSQL feature tests (8 assertions), 3 unit tests (4 assertions), route registration verified. Added an authenticated tenant chooser API and 3 more feature tests, **not yet executed**. This is meaningful evidence for a P1 subtask, but P1's broader acceptance criteria (authentication/RBAC/RLS/CI) are not met and no partial weight baseline approved; total accepted 0%.

## 2026-11-19 — Tenant chooser tests PASS and session-authentication source added
User verified **11 tests PASS / 21 assertions** across TenantAccessTest and TenantContextTest; route listing showed 2 expected routes. Implemented Laravel session login, profile, logout routes with throttling and CSRF via web routes plus 4 rollback-only auth feature tests (NOT yet run). No user registration/seeders, no migration, no RLS/RBAC. Overall accepted percentage unchanged while P1 security milestone is incomplete.

## 2026-11-19 — Auth tests PASS and React API integration added
User-verified results: AuthSessionTest 4 PASS (17 assertions), TenantAccessTest 8 PASS (17 assertions), TenantContextTest 3 PASS (4 assertions): **15 PASS, 38 assertions**. Committed browser login/logout, authorized tenant selector, same-origin CSRF token endpoint and typed API client. New React integration and backend CSRF endpoint not yet compiled/smoke-tested. No user provisioning or RBAC/RLS, no acceptance percentage change.

## 2026-11-19 — Browser dev-server startup and frontend build PASS
User independently verified all 6 API routes, AuthSessionTest 4 tests/17 assertions PASS, Laravel server on localhost:8000, React Vite build PASS (30 modules), dev server at 127.0.0.1:5174 because 5173 was already occupied. No browser/login end-to-end evidence yet. Added local-only interactive test user+tenant provisioning command, pending local execution. No acceptance baseline change; total remains 0%.
