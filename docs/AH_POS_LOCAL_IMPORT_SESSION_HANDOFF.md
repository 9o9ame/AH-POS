# AH-POS — Local Platform Import Session Handoff

Last updated: 2026-11-24
Implementation branch: `fix/local-platform-import-chunks-09`
Status: Source committed; remote GitHub connector cannot execute user's Windows PHP/frontend tests. Owner merge and acceptance pending.

## User goal
Platform Super Admin bulk tenant import (products from XLSX; accounts from CSV/XLSX/PDF) should work in local Windows development without a running Laravel queue worker. Current production design must continue using durable queue jobs. No duplicate product/account records, stock movements or financial postings when retrying.

## Actual implementation
- `backend/app/Platform/Imports/AsyncTenantImportService.php`: start(..., localChunks) stages the normal private parsed source and retains tenant+content fingerprint lock/checkpoints. In local env skips queue dispatch; authenticated advancement uses cache lock and existing TenantImportService in bounded chunks. Completion deletes staged source.
- `backend/app/Platform/Imports/TenantImportService.php`: optional `$localChunk` flag on existing background method adjusts limit to 20 rows / 8 seconds. Original production background chunks remain 120 rows / 40 seconds.
- `backend/app/Http/Controllers/Platform/TenantImportController.php`: only `app()->environment('local')` opts into local mode; per-import advancement checks authorized platform actor and tenant ownership.
- `backend/routes/platform.php`: additional POST `/api/platform/tenants/{tenantUlid}/imports/{importUlid}/advance-local`, behind platform auth/permission/recent MFA; returns 404 outside local.
- `frontend/src/api/platform.ts`: optional `processing_mode` and local advance API.
- `frontend/src/components/platform/TenantImportModal.tsx`: when `processing_mode=local_chunked` runs one request at a time until completed; closes/reopens safely. Production keeps worker status polling.
- `backend/tests/Feature/PlatformTenantImportTest.php`: new local mock tests cover no queue, identical replay, tenant scope, exactly-once stock.
- Docs updated: `docs/PLATFORM_TENANT_IMPORT_DESIGN.md`, `BLUEPOS_ASYNC_BULK_IMPORT.md`, and this handoff.

## Invariants
- Original tenant import parser, product/account match and duplicate-source conflict index, per-row checkpoint transaction, warehouse validation and stock/financial domain actions untouched.
- Local mode only when explicit `APP_ENV=local` (not `testing`, `staging` or `production`). Queue fallback never used for production.
- Upload, active status, and progress endpoints unchanged; added route is additive. No DB migration or schema change.
- Uploaded source stays in private storage, not frontend or public webroot.
- Existing file/row parser limitations still apply.

## Owner quick local steps
1. Verify current Git merge is not conflicted. The user's UI branch previously had an unresolved conflict in `docs/AH_POS_DESIGN_MIGRATION.md`; resolve safely before merging this branch.
2. `cd C:\laragon\www\AH-POS`; `git fetch origin fix/local-platform-import-chunks-09`; `git merge --no-edit origin/fix/local-platform-import-chunks-09`.
3. `cd backend`; `php artisan config:clear`; `php artisan route:list --path=platform/tenants` optional. No queue worker.
4. `cd ..\frontend`; `npm run typecheck`; optionally `npm run ui:check`. The frontend is already served in a separate terminal; do **not** instruct user to run `npm run dev`, nor run `npm run build` for routine changes.
5. Log in to Platform Super Admin, open a tenant's Import Data modal, upload small CSV/XLSX test file, keep open for local progress and completion. Check counts after replaying EXACT SAME file: created rows unchanged; stock movement count unchanged.
6. For source file with lots of rows, modal can be closed and reopened; local processing pauses/resumes on saved row checkpoint. Do not import same data under intentionally changed codes to evade identity checks; mixed new/duplicate names should be skipped per existing rules.

## Verification pending / risks
- GitHub writes complete, but PHP tests and authenticated browser not run remotely; report any syntax/typecheck/route error. Use a dedicated disposable test database that satisfies the project's test guard, **never run tests/migrations against `ahpos_test` containing owner data**.
- Local rate limiter is 60 platform-auth requests/min: advancement interval 1800ms, and normal 2s polling disabled for local mode. Test against actual browser/API for 429/errors.
- Import may be paused if modal closes, browser loses session/MFA expires, lock is busy, or local PHP server stops; reopening resumes without duplicate writes.
- Production queue worker deployment and behavior are unchanged and must continue to be tested separately.
- Do not overwrite unrelated local UI design work or `backend/composer.lock`.

## Next step
Owner merges, runs `php artisan config:clear` and `npm run typecheck`, confirms authenticated local import of 1 small product XLSX and 1 account CSV/XLSX, retries identical files and checks stock, screenshots/logs for any failures. Fix directly in this import branch or a follow-up branch, keep handoff updated.
