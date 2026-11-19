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

## 2026-11-19 — Test provisioning convenience change
User requested minimum three-character passwords for temporary local development accounts (e.g. `123`). Local-only command updated, with explicit warning; original failed command reported no data changed. No verification yet; accepted progress unchanged.

## 2026-11-19 — Tenant RBAC first slice implemented/unverified
Browser screenshot confirms signed-in React user and authorized tenant listing, not yet tenant Select response. Committed tenant-scoped role and permission schema with composite FKs, default-deny permission middleware and 4 new PostgreSQL negative access tests; **migration and new tests not yet run locally**. RLS remains **not enabled** pending safe non-owner runtime role and transaction-scoped context (ADR-0002). Accepted percentage remains 0%.

## 2026-11-19 — RBAC migration/test user evidence, RLS prerequisite implementation
User verified RBAC migration DONE and 12 tests PASS (24 assertions) across TenantRbacTest and TenantAccessTest; 7 API routes present. Committed transaction-scoped `app.tenant_id` middleware used on RBAC probe, and 5 new DB scope/composite-FK regression tests (NOT YET RUN). RLS enforcement and non-owner runtime role not installed. Accepted completion remains unchanged at 0%.

## 2026-11-19 — 17 security tests PASS; read-only RLS preflight implemented
User-verified local evidence: TenantDbTransactionTest 3 PASS/5 assertions, TenantRbacIntegrityTest 2 PASS/4 assertions, TenantRbacTest 4 PASS/7 assertions, TenantAccessTest 8 PASS/17 assertions; **17 total tests PASS / 33 assertions**. Added read-only PostgreSQL role/RLS catalog preflight and test, unexecuted. RLS not enabled; non-owner runtime role not created. No accepted milestone increment.

## 2026-11-19 — Delivery reprioritized to 10-day operational POS MVP
User explicitly prioritized functional business features over repeated test-only milestones. New computer cloned repository; local database/runtime not yet configured. Committed P3 product catalog schema, secured create/list APIs, React product editor/list, explicit dev-only catalog grant and one critical feature test. **Not migrated or built locally yet** on the new PC; not accepted. P1 RLS remains pending, and full ERP scope in ten days is not a safe commitment. `docs/NEW_WINDOWS_DEV_SETUP.md` sets proposed delivery order and release gates.

## 2026-11-19 — New PC operational setup confirmed, focused catalog failure diagnosed
New Windows machine: PHP/Node/Composer/PostgreSQL installed; all 6 Laravel migrations DONE including Products; local test user+tenant+catalog grant created; frontend/backend servers running. Focused `ProductCatalogTest` reported 2 FAIL due to stale Laravel tenant context across multiple HTTP calls, not DB installation. Fixed context release in middleware `finally`, pending one focused local re-test and product save smoke. Accepted progress unchanged until verified.

## 2026-11-19 — Catalog CRUD browser verified, parties workflow source added
User screenshot confirmed authenticated tenant selection and product `Socks` saved and listed with PKR 100.0000 price. Added new `parties` migration, secured customer/supplier create/list/search API, React directory tabs and entry forms; local-only grant CLI can add `parties.read/create`. New code **not run locally**, not accepted yet. No repeat of previously passing suites. Production finance/security release gates pending; 10-day operational MVP priority unchanged.

## 2026-11-19 — Product + customer browser proof; major UI + inbound stock batch
User independently verified `parties` migration and catalog+party permissions, Vite production build PASS (32 modules), and customer Anwaar saved and listed in `ali` tenant. Responding to request for substantial work per turn and visible progress: committed redesigned sidebar/dashboard/theme/navigation and warehouse + inbound stock posting module (warehouse creation, stock-in, balances, movement history, idempotency/tenant protection). One focused critical `InventoryWorkflowTest` added. **New batch not yet migrated/verified on user PC**, UI design provisional, no financial posting or production approval. Keep 0% accepted per existing milestone gating, despite concrete development progress.

## 2026-11-19 — Inventory focused regression PASS and premium UI enhancement
User-verified `warehouses_and_stock_movements` migration DONE and inventory critical test **1 PASS / 11 assertions**. No browser stock-in confirmation yet. Replaced repetitive local grant requirement via a guarded, explicitly assigned Local Catalog Operator role with fixed local-only business permission allowlist; production RBAC unchanged. Added searchable Ctrl+K command palette and purposeful motion/glass UX polish, pending local refresh. No accepted P2/production security status change.

## 2026-11-19 — Major P4/P5/P7 operational pilot batch, pending local run
User screenshot verifies redesigned sidebar, dashboard and Ctrl+K quick search. Committed purchasing documents + purchase lines, cash sale documents + line snapshots, shared signed/append-only stock movement ledger, server NUMERIC totals, warehouse lock, idempotent posted transactions, receipt detail/print, POS barcode/cart UX, purchasing editor, sales history, tenant operational report/dashboard live totals. **New migration and one focused `TradeWorkflowTest` not yet executed on user's computer; no production acceptance.** Posting is explicitly disabled outside local PostgreSQL `ahpos_test` until general ledger, tax/COGS, returns, RLS and UAT/reconciliation gates. See `docs/LOCAL_TRADE_PILOT_WORKFLOW.md`.

## 2026-11-19 — Cash sale and receipt live verified; PHPUnit environment issue fixed
User verified PostgreSQL trade migration DONE and browser receipt for Ali tenant: Socks 2 at PKR 100 = PKR 200, cash PKR 200. New `TradeWorkflowTest` failed 503 on first purchase because phpunit.xml sets APP_ENV=testing while local financial posting guard allowed only local. Corrected guard to allow actual PHPUnit testing on localhost PostgreSQL ahpos_test, pending targeted rerun. No repeated previous suites or migrations required. Actual production accounting/tax/RLS acceptance still pending.

## 2026-11-19 — Trade integrated test PASS, sales returns operational pilot committed
User independently verified `TradeWorkflowTest` 1 PASS/18 assertions and previously cash POS receipt for Socks qty 2 PKR 200. Implemented cash sale partial/full refunds as separate immutable documents tied via composite tenant/invoice FKs to original sale, with controlled stock reversal through existing ledger, duplicate protection, purchase/sale reporting split into gross/refund/net and new Sales Returns UI. Added one focused `CashReturnWorkflowTest`. **New migration, test and browser flow pending user execution**; no change to overall accepted percent or production financial posting gate.

## 2026-11-19 — Sales Returns browser screenshot; cash shift and close pilot added
User browser verified Sales Returns page and visible refund history (two records); focused CashReturnWorkflowTest result not supplied. Built operational Cash Register pilot in one batch: immutable per-cashier/warehouse shift and closing documents, transaction-linked cash sales/refunds, PostgreSQL numeric expected/counted/variance snapshots, concurrent-safe open/close endpoints, local RBAC gates, React opening/closing interface and history, sidebar and command navigation. One focused rollback-based `CashShiftWorkflowTest` added, **not yet migrated/tested/browsed locally**. No customer/tenant reset or prior suite reruns. Finance production posting and RLS still blocked pending full accounting acceptance.

## 2026-11-19 — Cash Register test PASS; multi-window cashier + persisted Sale Hold/Get added
User verified `CashShiftWorkflowTest` **1 PASS /21 assertions** on `ahpos_test` and visually confirmed Main Store open-shift cash register. Implemented desktop-style unlimited independent invoice modal windows, task dock and F2/Shift+F2 shortcuts for cashier/supplier flows, more responsive real server product search and isolated per-window idempotency. Read actual BluePOS master context as business behavior reference, not database/UI copy. Added additive held_sales schema and protected cashier-tenant Save Hold/Get/Discard lifecycle; linked held bill to a single posted sale atomically. One `HeldSaleWorkflowTest` committed, **migration/tests/browser not yet verified**. Source docs `docs/MULTI_INVOICE_WORKSPACE.md` and `docs/BLUEPOS_WORKFLOW_ADAPTATION.md`. No accepted % change/production authorization.

## 2026-11-19 — Held sale critical test verified; enterprise ERP module hierarchy and product masters committed
User independently ran `HeldSaleWorkflowTest` 1 PASS/14 assertions after additive 000009 migration DONE and reported browser tested. Responding to direct request that AH-POS reflect BluePOS's complete Definitions/Daily Entries/Reports/Tools/Administration/Help menu and submodules: created original AH-POS six-family top module ribbon, searchable grouped module workspace, active sidebar subgroups, canonical route vs planned statuses and taxonomy-wide Ctrl+K. Also implemented real category/subcategory/brand/unit tenant tables/APIs and Product linkage, 4-tab master UI and one new focused safety test. **Migration 000010, focused test and frontend build/browser unverified.** Do not count planned menu items as completed and do not increase acceptance based on source-only work; all production finance gates still unmet.

## 2026-11-19 — Definitions integration blocked by missing RBAC known keys, fix committed
Master migration DONE on user local `ahpos_test`, targeted test FAILED 403 because `definitions.read/manage` omitted from canonical permissions registry. Added both keys; waiting only for targeted test rerun before claiming verification. No DB reset/old suite reruns.

## 2026-11-19 — Definition master test cross-tenant denial consistent with policy
User's targeted rerun passed 16 assertions then failed only at foreign-tenant response expectation 403 vs middleware-enforced 404. Kept fail-closed 404 security policy, updated focused assertion to assertNotFound; pending single targeted test rerun. No application production logic changed.

## 2026-11-19 — Product definitions critical test PASS; compact Admin UX delivered to source, Platform scoped
User verified one `ProductDefinitionMastersTest` PASS/17 assertions and browser Definitions six-family enterprise ribbon. Implemented compact top-ribbon shell (no second toolbar), direct server-verified single Admin workspace entry, hover/focus/pin contextual side menu, list-first modal CRUD for Product/Party/Master/Inventory, scoped themed skeletons, real tenant gross-sales bar & document-count donut, dashboard Sale/Purchase/Held actions and provisional low-stock colors. No backend migration. Architecture ADR-0003 specifies Super Admin Platform isolated from business tenant Admin, Platform staff, tenant employees/roles/device consented audit and phased device-scoped IndexedDB. **Frontend build/browser UX unverified; Platform/device backend and IndexedDB not implemented.** No accepted milestone percentage change.

## 2026-11-19 — User rejected edge hover trigger; top-ribbon hover/click pin behavior now committed
Two user screenshots showed correct list-first Products page but wrong detached sidebar edge trigger. Implemented top navigation as unique hover/focus trigger, clickable pin/unpin and family switch; removed left edge and duplicate hamburger, positioned drawer below ribbon, preserved subpage pinned state. **Source committed, Vite build and browser interaction review pending**; prior Platform/Admin/device and IndexedDB work still planned/not implemented. No accepted percentage change.

## 2026-11-19 — Platform Super Admin first real vertical slice committed (not verified)
After screenshot correction of top-hover ribbon and removal of edge button, added real separate Platform RBAC schema/guard, local explicit Super Admin bootstrap, authenticated Platform overview/Admin onboarding/Platform staff/audit APIs, Admin owner tenant role creation in one transaction, separate Platform UI and focused cross-scope denial test. **Migration 000011, PlatformOnboardingTest and frontend TypeScript/browser acceptance pending.** No actual device approval or tenant staff invitation yet. Count 0 accepted percentage until evidence and production security gates.

## 2026-11-19 — Platform verified; Admin staff and device approval implementation awaiting local evidence
User confirms Platform migration 000011 DONE, PlatformOnboardingTest 1 PASS/20 assertions and React Vite production build PASS, plus explicit local Super Admin bootstrap success for existing local account. New additive 000012 schema, fixed tenant staff templates, Admin staff creation/suspension, pending device registration via HttpOnly hashed cookie, owner approve/revoke, central 423 device guard, Administration screens, pending-device login screen, rollback-only focused staff/device integration test committed. Existing local memberships device exempt; no auto privilege grant. **No local migration/test/browser evidence for 000012 yet**; Platform UI browser UAT also pending. Production still blocked.

## 2026-11-19 — Staff test failed 404 and TS unused import; targeted repairs and GUI-first owner assignment
User migrated 000012 successfully; focused TenantStaffDeviceWorkflowTest failed 404 after 16 prior assertions, UI build failed TS6133 unused AppIcon; previous authorize command stranded user at tenant ULID. Fixed positional route args in device decision and staff status with named route parameters and removed unused import. Added Platform-only RBAC-audited Assign Owner workflow for existing tenant with selectable active member, no ULID CLI; one focused security test added. Both focused tests and frontend re-build pending. No data reset and no migration rerun.

## 2026-11-19 — Major architecture correction: independent vendor Platform vs tenant POS (source only)
Read BluePOS actual Platform App, routes, auth and backend Platform routes; found AH-POS previous Platform-button-in-tenant-shell violated reference architecture and user requirements. Removed Platform access from business App entirely. Added independent PlatformApp via /platform/* or platform.localhost, vendor-only login/shell/menu, independent Platform session and backend auth middleware, tenant-only login guard, one-time audited browser Super Admin identity transfer away from original Ali tenant user. Platform and POS no longer implicitly share session or user authorization. New PlatformRealmSeparationTest; affected Platform onboarding/owner tests updated. No migration; local tests/build/browser evidence pending. Other Platform modules shown as planned, not operational.
