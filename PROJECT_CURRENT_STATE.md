# AH-POS — Current State

**Updated:** 2026-11-18  
**Current phase:** P1 — Application foundation, **implemented_unverified** (explicit user-approved reprioritization)  
**Web accepted completion:** 0%  
**Mobile accepted completion:** 0% (not started)

## Confirmed
- Repository: `https://github.com/9o9ame/AH-POS`.
- User chose a new original UI/brand with BluePOS workflows as functional reference.
- Uploaded source: `POS Backup [09092026170831].bak`, approx. 250 MB, Microsoft SQL Server binary backup with `TAPE` signature; source name `DBSmilePOS` identified from embedded metadata strings.
- **No confirmed restore, introspection, FK inventory, table count, row count, reconciliation, or legacy-to-new mapping.**
- New POS planned architecture: multi-tenant Laravel/React/PostgreSQL candidate, online-first with allowlisted browser offline sales + mobile future; AI copilot in phases.
- Planning documents were produced and development rules/tracker have been initialized in AH-POS.

## Not done / not claimed
- No new backend/frontend application implementation accepted.
- No source database migrated; destination tenant not created.
- No offline or AI features implemented.
- No tests or live penetration tests performed on AH-POS.
- No verified deployment, release or production launch.
- An earlier Word handoff document and Markdown/CSV source files exist separately as chat deliverables; Markdown contents are the basis of repository architecture, not proof that the DOCX binary exists in GitHub.

## First next actions (P0)
1. Securely preserve original `.bak` OUTSIDE public GitHub and record SHA-256.
2. Prepare isolated SQL Server environment with matching/compatible version and no production overwrite.
3. Execute `RESTORE HEADERONLY`, `RESTORE FILELISTONLY`, `RESTORE VERIFYONLY`; log exact results, check TDE and backup chain.
4. Restore to NEW isolated DB; extract real schema/tables/FKs/indexes/row counts with redacted examples.
5. Publish sanitized `LEGACY_SCHEMA_INVENTORY.md` and `LEGACY_TO_AHPOS_MAPPING.csv` in repo, with verified/unverified markers.
6. Only after source inspection: decide target table design, posting semantics and import dry-run/reconciliation criteria.

## Session handoff template
- Branch / commit SHA:
- Milestone and approved task:
- Changed files:
- Implemented:
- Tests/evidence (pass/fail/not run):
- Data/safety impact:
- Pending risks/blockers:
- Next exact action:
- Progress change and reason:

**Rule:** Update this file every working session, including incomplete or blocked sessions.


## 2026-11-18 — P0 preparation checkpoint
- Branch: `main`.
- Repository access and all nine mandatory baseline files independently verified.
- Created `LEGACY_SCHEMA_INVENTORY.md` (explicitly unverified inspection checklist) and `LEGACY_TO_AHPOS_MAPPING.csv` (empty/unverified mapping scaffold).
- Backup file is **not accessible in this chat/session**; no SQL Server restore, SQL execution, schema introspection, tests, or reconciliation performed.
- Safety: no production backup, secrets or real source records uploaded to public repo.
- Milestone P0: blocked until original backup is obtained through private secure custody; accepted web/mobile completion unchanged (0%).
- Next exact action: privately obtain the original .bak, compute SHA-256, prepare isolated SQL Server, execute HEADERONLY/FILELISTONLY/VERIFYONLY with redacted evidence, then safe unique-name restore.
- This checkpoint's resulting commit must be verified against remote HEAD; GitHub contents API updates create consecutive commits.


## 2026-11-18 — SQL Server discovery (user-provided results)
- User ran read-only SQLCMD checks on local SQL Server 2025 Express SQLEXPRESS and reported two ONLINE accessible databases: DBSmilePOS (31 tables) and DBSmilePOS_LAB (41 tables). Their 31-table intersection is complete; LAB adds 10 App* tables.
- Both show 264.75 MiB ROWS and 1.00 MiB LOG allocated; equality does not verify equal data.
- Original .bak reported size 261116416 bytes, user-calculated SHA-256 `2E2C063B56B308FB2C63333BFB13CC592FA425F7EABB053FA5519D822DCD3575`.
- HEADERONLY failed with OS error 5 (access denied) from OneDrive path. Neither backup identity nor restored provenance is confirmed. This ChatGPT environment has not directly connected to local SQL Server.
- Next exact action: collect read-only table row metadata and key/column metadata, and privately stage a permissions-restricted backup copy for SQL Server metadata checks.
- No application implementation, migration, financial reconciliation or acceptance evidence. Web/mobile remain 0%.


## 2026-11-18 — uploaded original backup verified by hash
- User uploaded original SQL Server .bak in this chat. Directly computed SHA-256 `2e2c063b56b308fb2c63333bfb13cc592fa425f7eabb053fa5519d822dcd3575` and byte size 261116416; match user's local fingerprint.
- Binary signature `TAPE` and embedded Microsoft SQL Server / DBSmilePOS metadata identified. Backup remains PRIVATE to chat, not committed.
- Current execution environment has no SQL Server engine/sqlcmd/Docker. Actual restore, HEADERONLY, FILELISTONLY, VERIFYONLY and data introspection have NOT been carried out by assistant.
- User-provided local SQLCMD read-only evidence still represents the only SQL-level table/row metadata. No verified correspondence yet between .bak and either local DB.
- Immediate next action: use user's existing SQL Server with a private restricted-permission inspection copy, read HEADERONLY/FILELISTONLY/VERIFYONLY, and extract sanitized schema metadata as one batch to minimize repeated commands. No speculative target schema.
- Accepted completion 0%.


## 2026-11-18 — Platform-managed AI and WhatsApp product decision
- User confirmed AI agent features and WhatsApp communications **must be controlled by Super Admin platform**, including which tenant may use which feature. Tenant admins manage only permitted configuration.
- Added architecture requirements for global and per-tenant switches, plan entitlements, quotas, budgets, provider connections, approvals, audit and tenant isolation. WhatsApp Status auto-post is not assumed supported; manual share approach retained pending official capability review.
- **Planning decision only:** no AI, WhatsApp integration, related database tables, runtime enforcement, tests or billing implemented. Progress still 0% and P0 remains current priority.
- Next: finish P0 first; design actual entitlement schema and detailed AI/WhatsApp milestone when source DB and architecture decisions permit.

## 2026-11-18 — User-approved development kickoff
- Historical .bak is example/testing material, not a current operational cutover snapshot; fresh backup at go-live after old POS is stopped. P0 migration risk and reconciliation gate retained for go-live but does not block generic app development.
- For now exactly one AH-POS PostgreSQL TEST database, local and on any temporary test server. SQL Server databases remain reference material, not AH-POS app DB. Test logical tenant isolation in the one database. Future staging and production will have separate domains and isolated databases/secrets/storage.
- First source: `frontend/` React TypeScript Vite temporary engineering shell, `scripts/bootstrap-backend.ps1` Laravel 13 generator. Neither has been installed/executed/compiled here; no Laravel project was generated remotely.
- No production deployment, domain changes, data imports, business modules, auth, RBAC or tenancy implementation. UI not approved; current page is a disposable engineering shell.
- Next exact action on user's local Windows machine: `git pull origin main`; `cd frontend; npm install; npm run build; npm run dev`. Then generate backend with `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-backend.ps1` from root, only after verifying PHP/Composer. Provide output to establish runtime evidence; never run against legacy SQL Server DB.
- Source code commits made on `main`; verify latest commit before handoff. Accepted web/mobile 0% until tests and acceptance evidence.

## 2026-11-19 — Local bootstrap evidence provided by user
- Branch expected: `main`, after user-confirmed fast-forward to `da5ed2c`.
- Frontend: `npm install` succeeded with 0 reported vulnerabilities; `npm run build` passed TypeScript/Vite (29 modules); `npm run dev` reported ready at `http://127.0.0.1:5173/`. Browser manual smoke test not supplied. npm printed an esbuild allowScripts warning; not a reported build failure.
- Backend: Laravel skeleton `v13.0.0` and framework `v13.43.0` installed locally, Composer deps installed and app key generated. **Unexpected:** Laravel's own Composer post-create scripts created `backend/database/database.sqlite` and applied 3 default SQLite migrations (users, cache, jobs), despite our bootstrap not explicitly calling migrate. This is default local scaffold behavior, NOT the agreed AH-POS PostgreSQL test database.
- Fix committed: `scripts/bootstrap-backend.ps1` now uses `composer create-project --no-scripts` and manual key generation so implicit migrations should be suppressed on future fresh runs. This updated script is NOT executed/validated locally and MUST NOT be rerun against already-existing backend.
- `backend/` was generated **only on the user's local Windows machine**; backend source files are not automatically available in GitHub until safely reviewed/committed by the user. No Laravel tenancy/auth/business code implemented; no PostgreSQL database connection verified.
- Next: inspect `git status --short` in local AH-POS; ensure backend/.env and SQLite/credentials remain ignored; stage/commit generated Laravel skeleton and frontend lockfile after reviewing `git diff --cached --name-only`; confirm PostgreSQL installed, then configure ONE dedicated empty test DB (do not migrate until reviewed).
- Tests: frontend build PASS (user output), frontend dev server start PASS (user output), Composer install PASS (user output), Laravel app tests NOT RUN, PostgreSQL connectivity NOT TESTED. Accepted web progress 0%.

## 2026-11-19 — PostgreSQL-only application default
- User confirmed direct PostgreSQL test database; SQLite is not an intended AH-POS runtime database.
- Verified locally generated backend source was pushed to main in user commit `6356a22`.
- Changed `backend/.env.example` to PostgreSQL `ahpos_test`, with placeholder role `ahpos_app` and blank password (not an actual user or credential); `config/database.php` fallback to pgsql; removed automatic SQLite creation and migrate from Laravel Composer post-create script; ignored frontend TS build info.
- User local `.env` is ignored and remains unchanged by pull; user must set it to pgsql using private credentials. No PostgreSQL service/database/role/connectivity verified and no PostgreSQL migrations run.
- Never assume bootstrap's generated SQLite file is in use; don't delete it until PostgreSQL is confirmed. Accepted completion unchanged pending tests.

## 2026-11-19 — PostgreSQL connected; P1 tenant foundation drafted
- User independently verified PostgreSQL 18.6 with `ahpos_app` connecting to `ahpos_test`; Laravel `php artisan db:show` reported `pgsql`, database `ahpos_test`, 0 tables.
- Committed initial migration creating `tenants` and `tenant_memberships`, Eloquent models, guarded `TenantContext`, `ResolveTenantContext` middleware and database-free unit tests.
- Security status: middleware is **not yet registered or exposed on tenant routes**; no tenant-scoped API endpoints, authentication workflow, RLS, RBAC or business writes. Treat as partial foundation, not secure production tenancy.
- No migration/test run by assistant; no schema change to user's local database until user explicitly runs it. Legacy SQL Server databases untouched.
- Next action on user's local machine: `git pull origin main`; `cd backend`; `php artisan migrate:status`; confirm `ahpos_test` is still disposable and empty, then `php artisan migrate`; `php artisan test --filter=TenantContextTest`; `php artisan db:show`. Report output. No automatic data seeding.
- After verification: separate non-owner runtime PostgreSQL role, secure auth and tenant resolution, negative tests and tenant RLS. Accepted progress remains 0% until evidence.

## 2026-11-19 — P1 tenant access wiring checkpoint
- User-provided verified result: `php artisan migrate` completed 4 migrations on `pgsql/ahpos_test`; `db:show` lists 11 tables. `TenantContextTest`: 3 tests passed / 4 assertions. Initial `migrate:status` reported no migrations table (expected on empty database).
- Added scoped `TenantContext` binding, `tenant.context` middleware alias, and one read-only `GET /api/tenants/{tenant}/context` probe guarded by Laravel session `auth` and active tenant membership checks. Response exposes ULID and name only, not internal ID.
- Added 5 feature tests for guests, non-members, cross-tenant denial, inactive membership and inactive tenant. They require `pgsql/ahpos_test`; test records are wrapped in roll-back transactions. Removed SQLite overrides from phpunit.xml.
- New source and tests **not executed by assistant**, no new migrations added. Auth login UX/Sanctum, RLS, full RBAC, business modules and tenant-scoped queries remain missing. Test endpoint is for development only.
- Next exact command: `git pull origin main`; in `backend`, `php artisan route:list --path=api`, `php artisan test --filter=TenantAccessTest`, `php artisan test --filter=TenantContextTest`; report output. NEVER run `migrate:fresh`, `RefreshDatabase` or production tests on persistent data.
- Tests/acceptance for this change remain pending, web/mobile accepted percentage 0%.

## 2026-11-19 — Verified tenant access tests and authenticated tenant chooser
- User confirmed `php artisan route:list --path=api` exposed the guarded context route and `TenantAccessTest` **5 PASS / 8 assertions** plus `TenantContextTest` **3 PASS / 4 assertions** on local PostgreSQL `ahpos_test`. These results are user-reported test evidence; no assistant-side PHP execution.
- Added `GET /api/my/tenants` using existing session auth and server-side active tenant membership filters; returns public tenant ULIDs/names, not internal IDs. Added 3 rollback-only feature tests (guest, cross-tenant/inactive tenant and inactive membership); new changes NOT YET TESTED.
- Next: `git pull origin main`; `cd backend`; `php artisan route:list --path=api`; `php artisan test --filter=TenantAccessTest`; `php artisan test --filter=TenantContextTest`. Confirm tests before advancing.
- No database migration needed for this commit. Session login workflow, Sanctum, per-tenant roles, rate limits, branch scoping, PostgreSQL RLS and non-owner runtime role still pending. Accepted milestone remains 0%; do not infer production-grade isolation from these tests alone.

## 2026-11-19 — Verified tenant chooser; session authentication slice committed
- User-provided local verification: `route:list --path=api` registered 2 routes, `TenantAccessTest` PASS 8 tests / 17 assertions, `TenantContextTest` PASS 3 tests / 4 assertions, on `ahpos_test`.
- Added session-only `POST /api/login` (rate-limited; validation; Laravel web CSRF middleware), `GET /api/me`, `POST /api/logout` (authenticated, session invalidation). API returns only name/email, never internal user IDs or password. No public signup, tenant auto-provisioning, or test account seeding.
- Added `AuthSessionTest` with 4 PostgreSQL-only transaction-rollback tests covering invalid login, valid session/profile/logout, validation and guest denial. New code **NOT YET EXECUTED** on user's local machine. No new migrations.
- Existing auth routing uses Laravel web/session middleware; the future SPA must use cookies/CSRF correctly and same-origin dev proxy. Sanctum, SPA UX, account provisioning, audit, multi-factor auth, fine-grained RBAC and PostgreSQL RLS pending. Session endpoint is development-only until these hardening gates.
- Next validation: `git pull origin main`, `cd backend`, `php artisan route:list --path=api`, `php artisan test --filter=AuthSessionTest`, `php artisan test --filter=TenantAccessTest`, `php artisan test --filter=TenantContextTest`. Do not run destructive test database refresh. Accepted web remains 0% pending larger acceptance requirements.

## 2026-11-19 — Browser session authentication integration source
- User's local output verified: five auth/tenant routes present; `AuthSessionTest` PASS 4 tests/17 assertions; `TenantAccessTest` PASS 8 tests/17 assertions; `TenantContextTest` PASS 3 tests/4 assertions. Total 15 tests / 38 assertions PASS.
- Added `GET /api/csrf` no-store session token endpoint on Laravel web middleware; existing Laravel CSRF protection remains enabled for POST routes.
- Added typed frontend API client that fetches same-origin CSRF token before POST login/logout, keeps cookies same-origin and handles API errors.
- Replaced temporary frontend status shell with temporary accessible sign-in, session profile, authorized tenant chooser and guarded tenant context read-only screen. No test user or tenant seeded. Original UI identity/design not approved; this is a development screen only.
- This frontend/API code is committed but **not yet compiled or browser-tested**; production cross-domain cookie/CSRF/Sanctum integration, provisioning, RBAC, RLS and security acceptance remain pending.
- Next: `git pull origin main`; start `php artisan serve --host=127.0.0.1 --port=8000` in backend, `npm run build` and `npm run dev` in frontend, `php artisan route:list --path=api`, `php artisan test --filter=AuthSessionTest`; open `http://127.0.0.1:5173/`. With no seeded test user the login form should display, login is not expected to succeed.
- Security: never commit backend/.env, no fake success/credentials, no production deployment. Accepted progress remains 0% until broader acceptance.

## 2026-11-19 — Frontend build verified, local test-account provisioning added
- User-provided results: `php artisan route:list --path=api` showed all 6 auth/tenant/CSRF routes; `AuthSessionTest` 4 PASS/17 assertions; Laravel dev server started on 127.0.0.1:8000.
- React `npm run build` PASS: Vite 7.3.8, 30 transformed modules, completed in 1.39 s. Vite selected 127.0.0.1:5174 because 5173 already occupied; this is not a failure. Browser display and end-to-end login remain UNVERIFIED.
- Added `php artisan ahpos:provision-test-account` local-only interactive command to explicitly create one test user, one tenant and an active membership in a single transaction. Validates APP_ENV=local, pgsql ahpos_test and local DB host. Asks for name/email/tenant, prompts password secretly with complexity validation, refuses duplicate email. Does not seed automatically or store plaintext credentials in Git.
- New provisioning command NOT EXECUTED/TESTED locally; only run it after `git pull`, command discovery check, and local DB confirmation. Does not affect migrations, SQL Server, production or existing tenant data.
- Next steps: `git pull origin main`, `cd backend`, `php artisan list --raw | findstr ahpos`, `php artisan ahpos:provision-test-account`; open Vite on **5174**, enter privately chosen test credentials; verify tenant chooser. Never share password.
- All production acceptance gates (RBAC, RLS, least-privilege DB runtime, CI, verified browser flow, platform super admin) remain outstanding. Accepted web/mobile 0% per existing locked milestone baseline.

## 2026-11-19 — Local provisioning password policy revised on user request
- Initial `ahpos:provision-test-account` attempt rejected input without writing any rows (user-provided command output); cause was not individually identified among validation / duplicate email / confirmation mismatch.
- Changed **only the local-only provisioning command** to accept password strings of length 3–255, including numeric-only values, at user's explicit request for temporary development testing. Existing local/pgsql/ahpos_test/localhost gating remains. Weak password warning displayed; do NOT use this relaxed policy for production, public deployments or live users.
- New change not locally executed or tested; no DB changes from GitHub edit. Next: git pull, rerun local provisioning and verify frontend login / tenant chooser. Prod credential policy remains to be designed/implemented.

## 2026-11-19 — P1 tenant RBAC foundation committed; RLS gated
- User screenshot independently shows authenticated React workspace with test user and active tenant available for selection. Tenant Select action was not yet evidenced as clicked. Existing auth/tenant backend suites previously PASS (15 tests / 38 assertions); React build PASS.
- Added migration `2026_11_19_000002_create_tenant_rbac_tables`: `tenant_roles`, `tenant_role_permissions`, `tenant_membership_roles`, plus composite unique keys. Membership-role and role-permission rows use tenant-composite FKs to reject cross-tenant linking.
- Added default-deny `TenantPermissions`, `RequireTenantPermission` middleware alias, and protected read-only `GET /api/tenants/{tenant}/rbac-check` integration route. 4 PostgreSQL transaction-rollback tests in `TenantRbacTest` cover guest, unassigned role, correct tenant/permission and inactive/wrong permission.
- **None of the new migration, RBAC tests or new route was locally executed yet.** No roles are assigned automatically to the existing Ali test account. Existing tenant selection route remains accessible to an active member; RBAC check should return 403 absent an explicit role.
- PostgreSQL RLS **NOT ACTIVE**. Current `ahpos_app` is DB owner; ADR-0002 requires separate non-owner runtime role, safe membership admission and SET LOCAL scoped transactions before FORCE RLS, negative DB tests, and release acceptance. No secrets/grants/owners changed.
- Next exact user commands: `git pull origin main`; `cd backend`; `php artisan migrate:status`; `php artisan migrate` (only on confirmed `pgsql/ahpos_test`); `php artisan test --filter=TenantRbacTest`; `php artisan test --filter=TenantAccessTest`; `php artisan route:list --path=api`. No `migrate:fresh`/destructive resets.
- Security milestone P1 ongoing, accepted total 0% until broader security/CI acceptance. Historical SQL Server untouched.

## 2026-11-19 — RBAC tests verified, transaction-local tenant DB context prepared
- User-provided PostgreSQL results: `2026_11_19_000002_create_tenant_rbac_tables` migration **DONE**; `TenantRbacTest` 4 PASS / 7 assertions; `TenantAccessTest` 8 PASS / 17 assertions; `route:list --path=api` 7 routes. Existing Ali test user/tenant unaffected.
- Added `TenantDbTransaction` to set PostgreSQL `app.tenant_id` via parameterized `set_config(..., true)` **within** a Laravel DB transaction, deriving the ID from the already-authenticated `TenantContext`. Missing context fails closed. Registered `tenant.db-scope` middleware and attached it to the RBAC read-only probe *after* auth+membership and *before* permission check.
- Added `TenantDbTransactionTest` (3 tests: missing context, scope present inside and absent afterward, rollback after exception) and `TenantRbacIntegrityTest` (2 tests: cross-tenant role assignment and permission FK rejection via PostgreSQL 23503). **NEW CODE/TESTS NOT YET EXECUTED.**
- **PostgreSQL RLS NOT enabled**. Current `ahpos_app` is a DB owner; transaction GUC is preparation, not RLS or full authorization. Admission/bootstrap, non-owner runtime credentials, FORCE RLS policies, DB role grants and cross-tenant SELECT/WRITE tests remain explicit next gates. Existing permission check still uses server-scoped membership query.
- Next exact local commands from repo root: `git pull origin main`; `cd backend`; `php artisan test --filter=TenantDbTransactionTest`; `php artisan test --filter=TenantRbacIntegrityTest`; `php artisan test --filter=TenantRbacTest`; `php artisan test --filter=TenantAccessTest`. No new migration required for this commit.
- Keep `ahpos_test` as only development DB, no destructive resets, no SQL Server changes, accepted web/mobile 0% until broader acceptance.

## 2026-11-19 — Verified transaction scoping/integrity; read-only RLS preflight committed
- User independently ran 4 focused suites on PostgreSQL `ahpos_test`: `TenantDbTransactionTest` 3 PASS / 5 assertions; `TenantRbacIntegrityTest` 2 PASS / 4 assertions; `TenantRbacTest` 4 PASS / 7 assertions; `TenantAccessTest` 8 PASS / 17 assertions. **Total: 17 tests / 33 assertions PASS**. User local Git HEAD prior to this change was `12c9fc5`.
- Added `php artisan ahpos:rls-preflight`: read-only catalog inspection of PostgreSQL effective runtime role (SUPERUSER, BYPASSRLS) and ownership/RLS ENABLE/FORCE/policies for pilot RBAC tables `tenant_roles`, `tenant_role_permissions`, `tenant_membership_roles`. Reports NOT READY (exit 1) when prerequisites absent; no migration, ownership/grant/password mutation.
- Added `RlsPreflightTest` to verify read-only inspection and expected status reporting; new code **NOT TESTED locally**.
- Important: catalog checks alone are NOT sufficient RLS security acceptance. Separate non-owner runtime role, tested grants, safe membership bootstrap, transaction-scoped policy enforcement, and cross-tenant SELECT/INSERT/UPDATE/DELETE under runtime account remain pending. Existing `ahpos_app` still owns current DB tables. RLS NOT ACTIVATED and no DB credentials changed.
- Next user commands: `git pull origin main`; `cd backend`; `php artisan ahpos:rls-preflight` (expected NOT READY, exit 1, which is diagnostic), `php artisan test --filter=RlsPreflightTest`, then report output. No new migrations.
- Accepted completion unchanged (P1 not fully accepted). Legacy SQL Server untouched.

## 2026-11-19 — Client 10-working-day constraint; operational POS priority
- User moved to a new computer and cloned AH-POS; the new machine's PHP/Composer/PostgreSQL configuration and DB are not yet verified. Git clone does NOT contain the old computer's PostgreSQL database, login account or tenant. See `docs/NEW_WINDOWS_DEV_SETUP.md`; no destructive database copy presumed.
- Explicit user direction: stop repetitive unchanged security-test cycles and implement working business modules rapidly, with targeted critical tests only. Deadline target is **10 working days**, not a guarantee that the full ERP/offline/AI/WhatsApp can safely reach production. Proposed limited operational POS day-by-day scope in setup guide. Client UAT, reconciled financial rules, staging, backups, tenant security and go/no-go remain non-negotiable.
- Committed first actual P3 business slice: `products` migration with non-null tenant FK, public ULID, per-tenant unique SKU/barcode, NUMERIC(20,4) selling price, status; `ProductController` tenant-scoped paginated product search and create; RBAC `products.read`/`products.create`; typed React API and operational product form/table after tenant selection; explicit local-only catalog role grant CLI. Added one focused critical `ProductCatalogTest` covering creation, forged tenant, isolation, permission denial and duplicate SKU.
- New module/migration/test are **implemented_unverified**; not executed on the new machine. No sales, posting, purchasing, accounting, stock or full UI design implemented. Previous user-verified tests from older computer: 17 tests/33 assertions across latest RLS prerequisite suites, and earlier auth passes. New system has no verified running environment yet.
- Immediate next: on new Windows PC follow `docs/NEW_WINDOWS_DEV_SETUP.md`: PHP/Composer/Node/PostgreSQL checks, `composer install`, private `backend/.env`, dedicated `ahpos_test`, `php artisan migrate`, explicit test account and catalog grant, `npm ci && npm run build`, start backend/front and add one product in UI. Only run `ProductCatalogTest` for this change, not all older suites.
- RLS remains unenabled; existing development database owner model is not production-safe. 10-day production release needs non-owner runtime role, verified isolation, backups and staging approval. No legacy SQL Server cutover has happened.
