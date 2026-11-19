# AH-POS

AH-POS is a planned independent, commercial, multi-tenant online-first retail/wholesale POS + ERP system. BluePOS is a **functional and architectural reference**, not a source of reused branding or UI. The new product must have original visual identity and a shared global design system.

## Product direction
- Web application first, with Android/iOS companion apps starting once **70–80% of weighted web acceptance** has been reached and API/sync contracts are stable.
- Fully functional authorized online workflows; specifically allowlisted **offline sales** in browser IndexedDB; native mobile uses its own durable local store such as SQLite. Both use the same secure idempotent server sync contract.
- A legacy Microsoft SQL Server `.bak` backup (source database name detected as `DBSmilePOS`) must be restored in a controlled isolated environment, inspected, mapped and migrated to **exactly one destination tenant**.
- Tenant isolation at API, DB, storage, cache, worker, search, export, AI and offline synchronization levels.
- Embedded AI copilot for text/voice commands, navigation, price/ledger lookup, and quotation/sale/purchase draft generation from messages, audio or handwriting. Sensitive postings require user review and server authorization.

## Start here (mandatory)
1. [AGENTS.md](AGENTS.md) — assistant and engineering operating rules.
2. [docs/MASTER_ARCHITECTURE.md](docs/MASTER_ARCHITECTURE.md) — architecture and migration baseline.
3. [PROJECT_CURRENT_STATE.md](PROJECT_CURRENT_STATE.md) — what has **actually** happened and what happens next.
4. [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) and [PROJECT_MILESTONES.csv](PROJECT_MILESTONES.csv) — measured completion.
5. [docs/CHAT_HANDOFF_PROTOCOL.md](docs/CHAT_HANDOFF_PROTOCOL.md) — cross-chat continuity.
6. [PROJECT_UI_DESIGN_SYSTEM.md](PROJECT_UI_DESIGN_SYSTEM.md) — initial UI principles, to refine before UI implementation.

## Status
**Planning only; new application accepted implementation: 0%.** No legacy database restoration or source schema verification has yet been demonstrated. Do not confuse planning documentation with delivered software. P0 (restore/reverse engineer backup) is the first implementation milestone.

## Security
This repository is public. **Never commit** original SQL Server backups, restored databases, customer/party/order data, credentials, API keys, production dumps, or unredacted source row samples. Use private secure custody for source backup.

## Reference
BluePOS: https://github.com/9o9ame/bluepos

Updated: 2026-11-18.

## Development bootstrap (2026-11-18)
The original SQL Server backup is **sample/test reference data only**. Go-live migration will use a fresh legacy backup after the old system is stopped, with audited tenant-scoped reconciliation. No production migration has happened.

Development currently targets **one disposable PostgreSQL test database** for AH-POS (not a single-tenant data model); separate local SQL Server databases are legacy reference only. Do not put secrets or legacy customer data into public git. After launch, maintain **separate staging and production deployments, domains, databases and credentials**; promote approved, tested releases from staging to production.

First source files have been added: `frontend/` (temporary React/TypeScript engineering shell) and `scripts/bootstrap-backend.ps1` (Laravel 13 bootstrap, no migrations). These have **not been built or executed** in this session. Run on Windows from repo root:
```powershell
git pull origin main
cd frontend
npm install
npm run build
npm run dev
```
Open Vite's printed local URL. Backend initialization, after checking Composer and PHP >=8.3:
```powershell
cd ..
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-backend.ps1
```
The script refuses to overwrite an existing `backend/`. Configure a NEW empty PostgreSQL test database in backend/.env; never connect Laravel to `DBSmilePOS` or `DBSmilePOS_LAB`, and do not run migrations against those SQL Server DBs. No backend routes, auth, tenancy, DB migrations or business functions are implemented by this bootstrap yet.

The initial shell is NOT the approved AH-POS visual design. It is a temporary developer-only status page.

## Local bootstrap observation (2026-11-19)
Initial Laravel 13 installation succeeded on the developer PC. Laravel skeleton's own Composer post-create scripts auto-created a local SQLite DB and migrated three default tables. This does NOT represent the one planned PostgreSQL AH-POS test DB. No legacy SQL Server DBs were affected as far as user-supplied logs show.

The `scripts/bootstrap-backend.ps1` script has been fixed for future fresh installations to suppress Composer scripts and implicit migrations. **Do not rerun it against existing backend/**. Backend code was generated locally; it has not been automatically committed to GitHub. Review `git status` before staging source. Do not add `.env`, SQLite databases or credentials. PostgreSQL setup, tenant schema, Laravel tests and API endpoints remain pending.

## 2026-11-19 — Operational MVP and new computer
Earlier sections record historical setup; actual Laravel/React source now exists and is committed. PostgreSQL, login, tenant context and RBAC have been exercised on an earlier developer PC. On a **newly cloned Windows machine**, follow [docs/NEW_WINDOWS_DEV_SETUP.md](docs/NEW_WINDOWS_DEV_SETUP.md). The old local database and accounts do not accompany a git clone.

P3 working product catalog source (migration, API, React page) is now committed but pending local verification. Target is a prioritized operational retail POS MVP within 10 working days; full ERP/offline/AI/WhatsApp cannot be promised on that timeframe. Never deploy unverified financial workflows, bypass tenant controls or migrate a historical sample SQL Server backup as current production data.

## Customer/supplier directory (2026-11-19)
Catalog create/list is user-verified in the browser. A new tenant-scoped customer/supplier directory is committed and awaiting local migration. On the existing dev database: `git pull origin main`, `cd backend; php artisan migrate`, rerun `php artisan ahpos:grant-local-catalog` using the already-created account and tenant ULID (adds party permissions idempotently), then `cd ../frontend; npm run build` and refresh the running Vite UI. The grant command changes only the explicitly selected local test membership; do not run it on production.

## Larger operational batch: workspace and inventory (2026-11-19)
New app shell (dashboard/sidebar/mobile navigation) and inbound inventory source are committed. A new migration adds tenant-scoped warehouses and append-only incoming stock entries with idempotency and a read-only per-warehouse balance view. Existing local account/tenant/product/customer persist. On the existing `ahpos_test` dev DB: `git pull origin main`, `cd backend && php artisan migrate`, rerun `php artisan ahpos:grant-local-catalog` to add inventory permissions, and verify warehouse + opening stock from the Vite browser. Keep `npm run dev` running; HMR avoids repeated production builds. This is NOT yet a full purchase, sale, journal, valuation or production-ready system.

## 2026-11-19 — Purchase / POS / operations report local pilot
New local-only purchase and cash checkout flows, receipt printing and operational reports are committed. Existing PostgreSQL `ahpos_test` needs additive migration `2026_11_19_000006_create_purchase_and_cash_sale_documents`. See [docs/LOCAL_TRADE_PILOT_WORKFLOW.md](docs/LOCAL_TRADE_PILOT_WORKFLOW.md) for the exact browser demonstration, targeted test and **production release blockers**. The local `Local Catalog Operator` role automatically covers these expressly enumerated demo business permissions; no repeated manual grant is required.

**Very important:** Sale/purchase posting is disabled on staging/production until double-entry accounting, tax compliance, inventory cost layers, RLS/runtime DB separation, returns, printer/UAT and backup/reconciliation acceptance are implemented. Do not mistake operational pilot data for financial statements.

## Sales Returns local pilot (2026-11-19)
The verified cash-sale pilot now has an **unverified new return workflow** in source: immutable refund docs linked to original sale lines, stock restoration, refund history and gross/refund/net operational reporting. Read [docs/LOCAL_CASH_RETURNS_WORKFLOW.md](docs/LOCAL_CASH_RETURNS_WORKFLOW.md). Existing local PostgreSQL `ahpos_test` needs additive migration `2026_11_19_000007_create_cash_sale_returns` and only focused `CashReturnWorkflowTest` before browser UAT. Refunding physical cash, double-entry GL, COGS/tax reversal, returns disposition, fiscal notes and production RLS remain incomplete. Staging/production posting stays disabled.

## 2026-11-19 — Local cash shift/register pilot
Sales Returns browser renders with history; linked cash shift and close workflows now committed. A new additive migration creates `cash_shifts`, `cash_shift_closures` and optional links from **new** cash sales/refunds. See [docs/LOCAL_CASH_REGISTER_WORKFLOW.md](docs/LOCAL_CASH_REGISTER_WORKFLOW.md) for exact smoke steps and production safety exclusions. On existing local `ahpos_test`: `git pull origin main`, `php artisan migrate`, only `CashShiftWorkflowTest`, and refresh Vite. No default role grant rerun or unnecessary frontend production build. Cash closing does not execute physical cash movement or full GL postings.

## 2026-11-19 — Desktop multi-invoice + Held Sales pilot
BluePOS is now an explicit **business-flow reference** for AH-POS cash Sales/Purchase invoice interactions. Original AH-POS theme and **single PostgreSQL `ahpos_test`** architecture remain independent. Added desktop-style simultaneous Sales/Purchase invoice modals with taskbar, F2 / Shift+F2 shortcuts, independent cart state and a new **server-persisted Sales On Hold/Get** flow (cashier-scoped, not stock reservation). New additive migration `2026_11_19_000009_create_held_sales`, one focused `HeldSaleWorkflowTest`; old migrations/account setup unnecessary. See [docs/MULTI_INVOICE_WORKSPACE.md](docs/MULTI_INVOICE_WORKSPACE.md) and [docs/BLUEPOS_WORKFLOW_ADAPTATION.md](docs/BLUEPOS_WORKFLOW_ADAPTATION.md) for scope, exact browser verification and production limitations. Purchase holds still browser-tab only; live production posting remains disabled until financial/RLS/UAT approval.
