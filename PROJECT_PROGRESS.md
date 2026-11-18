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
