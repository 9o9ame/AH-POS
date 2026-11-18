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
