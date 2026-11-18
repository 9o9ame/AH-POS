# AH-POS — Current State

**Updated:** 2026-11-18  
**Current phase:** P0 — Legacy SQL Server inspection, **not started**  
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
