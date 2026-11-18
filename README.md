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
