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
