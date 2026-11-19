# AH-POS — Project Changelog

## 2026-11-18 — Project initialization (planning only)
- User created GitHub repository `9o9ame/AH-POS`.
- Set web-first POS/ERP vision, legacy SQL Server migration as mandatory P0, hard tenant-security rules, allowlisted offline sales and eventual mobile apps.
- Set AI copilot vision: navigation, read-only lookups and human-approved draft generation from text, audio, uploaded handwritten or chat messages.
- Created repository source-of-truth documentation, milestone tracking and cross-chat handoff protocol.
- Accepted implementation stays at **0%**.
- No app source code, schema, migrations, tests or deployments claimed.

## 2026-11-18 — P0 safe preparation checkpoint
- Independently inspected all mandatory AH-POS repository documents on `main`.
- Added `LEGACY_SCHEMA_INVENTORY.md` and `LEGACY_TO_AHPOS_MAPPING.csv` as explicitly unverified templates, without fabricated tables or real source data.
- Marked P0 blocked until original .bak becomes available privately in an isolated SQL Server environment.
- No application code, database operations, migrations or tests run. Accepted web/mobile progress remains 0%.
- Next: private backup custody/hash, isolated SQL Server metadata verification, safe restore and inventory extraction.


## 2026-11-18 — P0 SQL Server discovery recorded
- Recorded user-provided local SQLCMD evidence: SQL Server 2025 Express, DBSmilePOS 31 tables, DBSmilePOS_LAB 41 tables, 10 LAB-only App* tables.
- Recorded source backup file size and user-supplied SHA-256 fingerprint; HEADERONLY blocked by file access permissions.
- No claim of verified backup restore/provenance or identical data; no acceptance progress earned.


## 2026-11-18 — original backup upload fingerprint verification
- Directly read uploaded 261116416-byte backup and verified SHA-256 matches user-provided local fingerprint.
- Detected SQL Server backup signature and source metadata strings, but did not claim SQL Server restore or source-row verification.
- P0 continues; no application implementation acceptance (0%).


## 2026-11-18 — Super Admin AI/WhatsApp governance specified
- Recorded requirement that AI capabilities and official WhatsApp integrations are controlled by Super Admin (global/tenant enablement, plan access, quotas, budgets and compliance).
- Defined tenant-only permitted configuration, separate tenant-linked WhatsApp senders and permission-scoped AI tools, with audit and fail-closed checks.
- Documentation only; accepted implementation and P0 status unchanged.

## 2026-11-18 — Development kickoff and environment plan
- User changed priority: old SQL Server .bak is historical sample/testing reference; do final migration from fresh backup during approved go-live cutover.
- Agreed one PostgreSQL AH-POS test DB for development, separate staging/production environments after launch, staging-first promotions.
- Committed React/TS/Vite temporary developer shell and PowerShell safe Laravel 13 bootstrap script. Runtime/build tests not executed, no database was created or modified.
- Updated architecture/agent rules and milestone state; acceptance remains 0%.

## 2026-11-19 — Frontend build verified; backend local scaffold
- User supplied successful frontend TypeScript/Vite production build and Vite dev server output.
- User supplied successful local Laravel 13 Composer setup output; default skeleton post-create scripts implicitly created SQLite and ran three Laravel starter migrations.
- Fixed future-only bootstrap script with Composer `--no-scripts` and explicit APP_KEY generation, preventing unapproved automatic database operations. Updated script not yet locally tested.
- Backend generated locally, not yet present in GitHub; no PostgreSQL integration or multitenant implementation. Progress remains 0% accepted.

## 2026-11-19 — Switch Laravel defaults to PostgreSQL
- User pushed generated Laravel backend and frontend lockfile (`6356a22`).
- Updated committed backend defaults for `pgsql` and `ahpos_test`; removed auto SQLite/migration commands in Laravel Composer post-create hook, ignored TypeScript build cache.
- No app database created or migrated by GitHub changes. User must configure ignored local `.env` and verify PostgreSQL service/connection. No accepted milestone increment.

## 2026-11-19 — P1 tenant foundation source added
- User-provided PostgreSQL/Laravel connection evidence: PostgreSQL 18.6, ahpos_test 0 tables, ahpos_app connected.
- Added tenant/membership migration, models, fail-closed tenant context, authentication-dependent tenant resolution middleware and pure unit tests.
- No route registration, RLS or RBAC implemented; database migration and tests NOT executed in this session.
- ADR-0001 records one-test-database strategy and security gates. Accepted progress remains 0%.

## 2026-11-19 — P1 tenant-scoped read-only probe and negative tests
- User verified all four Laravel PostgreSQL migrations succeeded: 11 tables on `ahpos_test`; three `TenantContextTest` tests passed.
- Registered request-scoped tenant context and tenant middleware; added auth-guarded read-only tenant context probe using public ULID.
- Added rollback-only PostgreSQL feature tests for unauthorized, cross-tenant and inactive access; removed PHPUnit SQLite overrides.
- No new backend test execution by assistant; incomplete authentication/RLS/RBAC remains a release blocker.

## 2026-11-19 — Tenant access verification and chooser API
- User verified existing P1 tenant-access feature tests (5 PASS, 8 assertions) and tenant context unit tests (3 PASS, 4 assertions); read-only route registered.
- Implemented session-authenticated GET /api/my/tenants scoped to active memberships and tenants, returning ULID/name only.
- Added 3 new rollback-only negative feature tests; tests are pending local execution. No schema changes.
- Full authentication, RLS and RBAC remain outstanding; accepted percentage stays 0%.

## 2026-11-19 — Session-authentication implementation checkpoint
- User confirmed tenant chooser and tenant access test suite PASS (8 feature tests, 17 assertions; 3 unit tests, 4 assertions).
- Committed session login (rate-limited), authenticated profile, logout with session revocation; validation and default web CSRF middleware. No public registration or default accounts.
- Added 4 PostgreSQL-only rollback feature tests, pending local execution; no schema migrations or data seeds.
- Remaining blockers include full SPA auth integration, RBAC, RLS, secure user provisioning, runtime non-owner DB role, production security and CI acceptance.

## 2026-11-19 — Verified authentication tests; first React integration
- User successfully executed 15 backend auth/tenant tests with 38 assertions across 3 suites; five auth/tenant routes registered.
- Added a no-store Laravel CSRF token endpoint and typed React API client using same-origin session cookies and CSRF headers.
- Added temporary React login/logout/profile and authorized tenant selector. No user/tenant was created or seeded, and there are no financial functions.
- New browser and CSRF flow remain untested; staging/production auth and RLS/RBAC pending. Accepted progress unchanged.

## 2026-11-19 — Verified React build and explicit local test account provisioning
- Laravel API routes 6 present; AuthSessionTest passed 4 tests/17 assertions and Laravel server started at localhost:8000 (user evidence).
- React production build passed, Vite dev-server started at localhost:5174 (5173 occupied).
- Added explicit guarded `ahpos:provision-test-account` Artisan command with local PostgreSQL check, interactive hidden password, validation, transactionally created user/tenant/membership. No default test account created; not executed yet.
- Browser end-to-end authentication not verified; RLS/RBAC/security acceptance pending.

## 2026-11-19 — Local test-user password relaxation
- At explicit user request, adjusted `ahpos:provision-test-account` to accept 3+ character passwords exclusively for `local` / `pgsql` / `ahpos_test` / localhost DB provisioning, while retaining all other controls.
- Not applied as a production authentication policy; weak credentials not safe for deployment. New code not yet verified locally.

## 2026-11-19 — Tenant-specific RBAC scaffold
- Added `tenant_roles`, `tenant_role_permissions`, `tenant_membership_roles` migration with tenant-scoped composite relationship constraints.
- Added allowlisted, default-deny `TenantPermissions` and authenticated/resolved tenant permission middleware, with a read-only guarded integration route and 4 PostgreSQL rollback-only negative tests.
- ADR-0002 documents PostgreSQL RLS rollout requirements and current DB owner risk. No RLS enabled, no automatic role grants, no business data operations.
- User screenshot verifies frontend authentication and authorized tenant listing. New schema/tests not verified yet. Progress acceptance unchanged.

## 2026-11-19 — Verified RBAC migration, guarded transaction-local DB scope
- User ran PostgreSQL RBAC migration successfully; TenantRbacTest 4 PASS/7 assertions and TenantAccessTest 8 PASS/17 assertions.
- Added `TenantDbTransaction` helper + `tenant.db-scope` middleware to wrap tenant-authorized route work and permission check with transaction-local `app.tenant_id`.
- Added three scope lifecycle tests and two DB composite FK negative tests, pending local execution. RLS deliberately remains off; DB owner/runtime separation and policy tests remain release blockers.

## 2026-11-19 — RLS preflight after verified transaction-scoped isolation tests
- Local user evidence: 17 focused PostgreSQL security tests PASS (33 assertions).
- Added `ahpos:rls-preflight` read-only Artisan command examining active role flags, RBAC table ownership and catalog RLS ENABLE/FORCE/policy status. It reports NOT READY without modifying data.
- Added one read-only feature test for report behavior, pending local execution. No database migrations or privilege changes.
- Current PostgreSQL role remains table owner; true RLS enforcement under separate non-owner runtime role remains incomplete.

## 2026-11-19 — Actual operational catalog delivery and new-machine setup
- Responded to urgent 10-working-day constraint by moving from repetitive test checks to functional POS MVP priority.
- Added tenant-owned product table migration, decimal-safe selling price column, SKU/barcode uniqueness, active flag and ULID.
- Implemented scoped product list/search and create endpoints, permission allowlist, React product creation/search table after tenant selection, and explicit local-only catalog role grant command.
- Added a single critical PostgreSQL rollback feature test for product authorization, forged tenant ownership and duplicate SKU.
- Added `docs/NEW_WINDOWS_DEV_SETUP.md` with clean clone, PostgreSQL, Laravel, React, account and permission setup. No new local machine migration/build or runtime verification yet. Existing test/tenant from old PC not implicitly transferred.
- Full finance/inventory, production security/RLS and deployment acceptance still pending.

## 2026-11-19 — Fix reused application tenant context in product catalog
- User new-PC logs confirmed full PostgreSQL/Laravel setup and product migration, local test account and catalog permissions. Two focused product tests failed with HTTP 500 on a second request due to stale TenantContext.
- Added `TenantContext::clear` and unconditional middleware `finally` cleanup, restoring request-bound context even when permissions deny or downstream throws.
- No new migration, role grant, user provisioning, or broad regression test suite requested. Targeted product test and manual catalog save pending local verification.

## 2026-11-19 — Customer/supplier operational directory
- User browser screenshot proves previously added Product Catalog works with tenant `ali`, new product persisted and displayed.
- Added tenant-owned `parties` schema with ULIDs, customer/supplier discriminator, name, phone/email/address and status. Added tenant-scoped paginated list/search and create controller with server-side tenant context.
- Added explicit permission keys and guarded routes, extended local-only operator grant, typed frontend API and customer/supplier forms/list tabs.
- Pending new-PC migration, frontend compilation and one customer/one supplier manual smoke check. No accounting balance or financial posting.

## 2026-11-19 — Major UX and inventory operational batch
- User screenshot verified creation/listing of customer in browser; new party migration, local grant and Vite build PASS.
- Replaced temporary vertical engineering screen with responsive AH POS navigation shell, sidebar, original token-based visual styling, live tenant dashboard counts, quick actions, distinct product/customer/supplier/inventory pages. Styling remains provisional until user approval.
- Added warehouses and inbound stock movements (tenant composite FK integrity, positive NUMERIC quantities, unit cost, append-only API, per-tenant unique idempotency key), list/create warehouse endpoints, posted stock inward endpoint and balance/movement read API. No financial/stock-out workflow claimed.
- Extended explicit local grant with warehouse/inventory permissions and added one focused critical inventory workflow test, pending local migration and verification. No old tests rerun.

## 2026-11-19 — One-time local operator authorization and premium micro-interactions
- Verified from user console: inventory migration DONE; critical stock-in/idempotency isolation test 1 PASS (11 assertions).
- Updated `TenantPermissions` to honor an already explicitly assigned `Local Catalog Operator` role for strictly enumerated business permissions only within local PostgreSQL `ahpos_test` on localhost. This removes recurring local grant prompts after future feature updates while retaining production default-deny RBAC.
- Added `CommandPalette` search navigation (Ctrl/Cmd+K), keyboard arrows/Enter/Esc, top-bar quick search, motion curves, lightweight glass layers, responsive hover/focus/feedback and reduced-motion support. New code not yet locally compiled or visually reviewed.

## 2026-11-19 — Purchasing, local cash POS, stock-out, receipts and operations analytics
- Added purchase/sale header and detail schema with composite tenant foreign keys and ULID public identifiers; purchase/sale stock ledger links and PostgreSQL immutable posted-row triggers; signed sale stock movement shares prior stock ledger (no parallel inventory flow).
- Added PostgreSQL-NUMERIC server totals/line arithmetic, warehouse row locking, transaction-scoped idempotency locks, cash tendered/change checking, server catalog pricing, oversell denial, supplier/customer/warehouse/product tenant checks.
- Added separate purchasing, cashier POS, printable thermal-style receipt, sale history and operations reports; expanded sidebar, quick search, dashboard and CSS transaction layout.
- Added one rollback-only integrated `TradeWorkflowTest`, not executed locally yet.
- **Production checkout disabled by explicit local-only guard** until accounting journal, cost valuation, tax/fiscal, returns, RLS and release approval. No balance/accounting result fabricated. User should run new migration and focused test once.

## 2026-11-19 — Focused trade test environment gate fix
- User screenshot shows successful local cash-sale receipt (Socks qty 2, PKR 200), migration `create_purchase_and_cash_sale_documents` DONE.
- `TradeWorkflowTest` failed 503 because `phpunit.xml` forces `APP_ENV=testing`. Updated `DocumentPosting::assertLocalOnly` to allow `testing` only for Laravel's running-unit-tests process, local PostgreSQL `ahpos_test` and localhost DB host. Staging/production posting stays blocked.
- Rerun only `php artisan test --filter=TradeWorkflowTest`. No new migration.

## 2026-11-19 — Verified trade flow and added linked cash returns
- TradeWorkflowTest PASS from user on local PostgreSQL (1 test, 18 assertions).
- Added immutable cash refund documents and lines, original-sale composite ownership constraints and positive sale-return movements on same stock ledger.
- Added guarded return posting with purchase/sale locking, original sale price refund calculation, maximum refundable quantity/amount validation and idempotent local-only transactions.
- Added responsive Sales Returns page, Ctrl+K navigation, recent refund history and separate gross/refund/net cash activity cards; renamed inventory ledger column to signed qty.
- Added one focused `CashReturnWorkflowTest` and detailed `docs/LOCAL_CASH_RETURNS_WORKFLOW.md`. Not yet locally migrated/run; staging/production cash returns still disabled, no cash drawer/GL/COGS/tax reversal.

## 2026-11-19 — Cashier shift and daily cash closing operational pilot
- User screenshot confirms Sales Returns UI and two refund history entries visible in browser.
- New `cash_shifts` and `cash_shift_closures` tables, original signed stock and financial docs untouched; composite tenant FKs and immutable DB triggers.
- Linked new cashier sales and refunds to active shifts, without silently including old transactions; warehouse/row locks synchronize posting with closing.
- Added scoped open/list/close cash shift APIs, fixed known permission allowlist and local demo grants, PostgreSQL NUMERIC cash movement summaries/closing variance.
- Added polished Cash Register React page, sidebar/Ctrl+K routing, mobile CSS and close audit history, plus one focused `CashShiftWorkflowTest`. Source committed, **pending** user migration/test and browser verification; not GL/cash deposit reconciliation.

## 2026-11-19 — BluePOS-informed desktop multi-invoice operations, Hold/Get and cashier switching
- User local evidence: cash shift migration DONE and `CashShiftWorkflowTest` PASS (1 test, 21 assertions); browser screenshot confirms Main Store open shift.
- Introduced `TransactionWorkbench` (maximized modal invoice windows, persistent task dock, independent Sale and Purchase carts, maximize-like workspace, F2 and Shift+F2, minimize, restore, discard warning), `TransactionHome` and new topbar/sidebar navigation. Existing POS and Purchasing functional components reused; each preserves its own submission/idempotency state and refreshes live data on activation.
- Added database-persisted `held_sales`, cashier-scoped protected Save Hold/Get/Discard API, saved-bill selector, local pilot financial guard, per-hold uniqueness and consumption upon successful sale. Held bill never reserves stock. New test `HeldSaleWorkflowTest` added; pending migration/browser/test.
- Improved cancelable live server catalog searches in POS and Purchasing. AH-POS original UI preserved; BluePOS consulted for workflow, not cloned artwork/SQL Server database.
- Production blockers and source status documented; no old tests rerun, no fake accepted completion claims.

## 2026-11-19 — Full enterprise module shell and real product definition masters
- User verified prior persisted Held Bills workflow test: 1 pass/14 assertions and new held_sales migration DONE.
- Replaced flat website-style sidebar with AH-POS's **Home / Definitions / Daily Entries / Reports / Tools / Administration / Help** main ribbon, contextual submenus, module explorer, 60+ mapped business workflows and clearly distinguished available vs planned routes. Global Ctrl+K searches the same taxonomy; no fake working buttons or BluePOS UI asset cloning.
- Added category/subcategory/brand/unit PostgreSQL tenant-owned masters with optional composite product ownership FKs and cross-tenant controls; added RBAC-scoped APIs, real tabbed master CRUD/create/activate/deactivate screen, Product create catalog references and table columns.
- Added one `ProductDefinitionMastersTest` focused security regression (pending user execution), additive migration 000010 (pending local run) and documented exact local smoke/build steps at `docs/ENTERPRISE_MODULE_NAVIGATION.md`.
- Financial posting remains local-only. Most ERP families are mapped backlog not working modules; no false production/acceptance claim.

## 2026-11-19 — Fix definitions master permission registration
- Verified user evidence: migration 000010 completed; ProductDefinitionMastersTest returned 403 at first category create.
- Root cause: definition read/manage keys were included only in local-demo permissions, missing from canonical `TenantPermissions::known()`. Added them to known list so normal explicitly-assigned roles can pass RBAC check. Scoped access remains default-deny; focused test rerun pending.

## 2026-11-19 — Correct expected foreign tenant denial in Definitions test
- Existing ResolveTenantContext returns HTTP 404 when the caller has no active membership of the selected tenant; existing TenantAccessTest asserts this behavior. Definitions integration test had incorrectly expected 403 for this case. Updated test to expect 404, with comment documenting intentional tenant existence concealment. No data migrations or authorization relaxation.

## 2026-11-19 — Compact AH-POS desktop shell, live charts and modal master entry
- User confirmed ProductDefinitionMastersTest 1 PASS/17 assertions; screenshot confirms six-family module explorer.
- React shell: removed redundant breadcrumb/search/development top bar; put six-family ribbon on top with compact workspace and account initials; auto-enter sole authorized business after server tenant verification; hover/keyboard edge sidebar reveal, pin/unpin, active-family toggle and responsive animation.
- Rebuilt Admin dashboard with server-derived 7-day cash sales bars, counted sale/purchase/refund donut, true pilot figures, Stock Watch with explicitly provisional quantity<=5 color rule and Sale/Purchase/Held shortcuts. Each async region has themed skeleton; no GL numbers invented.
- Products, Customers/Suppliers, Category/Subcategory/Brand/Unit masters, Warehouse and Stock Inward all now use list-first tables with Add entry modals; responsive dense UI, internal panel scroll and fixed app viewport.
- Added ADR-0003 for separate Super Admin Platform vs tenant Admin/staff, role delegation, secure device approval/revoke, IP and consented coarse location audit, and device-partitioned IndexedDB after security controls. **These backend features are planned, not implemented**. No migration, permission grant or repeated backend test required.
- Frontend compilation/browser verification pending; detailed handoff under `docs/COMPACT_ADMIN_UX_AND_PLATFORM_HANDOFF.md`.
