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
