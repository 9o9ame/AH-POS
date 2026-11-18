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
