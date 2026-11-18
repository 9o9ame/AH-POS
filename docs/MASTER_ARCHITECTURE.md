# AH-POS MASTER ARCHITECTURE, MIGRATION AND AI HANDOFF
**Version:** 1.0 | **Date:** 2026-11-18 | **Status:** Planning baseline, not a completed application.  
**Reference:** https://github.com/9o9ame/bluepos (functional lessons only; do not reproduce UI assets or distinctive design).

## 1. Vision and acceptance
AH-POS is a commercial **online-first, multi-tenant retail/wholesale POS/ERP** covering branch/warehouse management, products, units, barcodes, pricing, suppliers, customers, purchasing/returns, sales/returns/receipts, inventory, accounting, cash/bank, reports and secure administration. Web is first. After independently accepted web completion reaches **70–80%** and shared API/sync contracts stabilize, start Android/iOS companion apps. A separately tested, permission-aware AI agent understands text/voice/image orders, assists with navigation and prepares validated business drafts.

Success is not measured by pages, generated code, or promises. Track **evidence-backed accepted functionality** across P0–P8, weights sum to 100%; mobile has its own score.

## 2. Confirmed source facts vs assumptions
- Provided legacy file: `POS Backup [09092026170831].bak`, about 250 MB, native SQL Server `TAPE` backup, with metadata strings naming `DBSmilePOS` and MDF/LDF. **Restore, schemas, row counts, constraints and financial integrity have NOT been verified.** Do not invent entity/table mappings.
- BluePOS reference currently contains Laravel 13/PHP 8.3+, React/TypeScript/Vite, PostgreSQL-oriented code, multi-tenant commerce, inventory/accounting and reports. BluePOS is not itself the proposed new application's source code.
- Our target technology choices are recommendations to approve through ADRs after P0, not claims of existing AH-POS implementation.
- No original backup, sensitive rows or secrets belong in this public repo.

## 3. Proposed stack, to confirm
| Layer | Candidate |
|---|---|
| Backend | Laravel 13 / PHP 8.3+, REST API, Sanctum session auth, modular monolith |
| Relational system of record | PostgreSQL 16+, migration-managed |
| Frontend | React + TypeScript + Vite, PWA, shared components, query client |
| Web offline | IndexedDB + transactional outbox (Dexie candidate), service worker |
| Mobile | React Native / Expo candidate, SQLite cache + outbox, secure device keys |
| Jobs/cache | Redis and queues where host allows |
| AI | Backend-owned OpenAI API Responses/tool calling, image/voice services |
| Numeric | money NUMERIC(20,4), qty NUMERIC(20,6), rates NUMERIC(12,8) pending legacy confirmation |
| Identity | Internal BIGINT possible; external ULID only |

API authentication, RBAC, device registration, session revocation, audit events, PostgreSQL transactions and robust backup/restore are first-class requirements.

## 4. Tenant isolation: critical safety contract
A **shared-schema multi-tenant design** is the starting proposal, with an explicit option for per-tenant databases if risk assessment requires it. A promise of absolute zero possibility of leakage would be false: implement defense in depth and prove against a rigorous negative-test suite.

- Every tenant-owned business table has non-null `tenant_id` and tenant-scoped unique indexes/foreign keys; scoped branch and warehouse ownership enforced server-side.
- Authenticate session and membership; derive tenant, branch, warehouse and permissions on backend. Never trust client-supplied `tenant_id`, prices, balances, permissions, user role, or total amounts. Every repository/service/controller/job must scope read/write.
- PostgreSQL Row Level Security using `FORCE ROW LEVEL SECURITY` on owned tables, runtime DB role without bypass, transaction-scoped tenant context (and connection pooling safety), deny access when scope is absent. RLS is **additional**, not a substitute for scoped application queries.
- Tenant-separated caches, search keys/indexes, storage prefixes plus object authorization, PDF exports, logs, WebSocket topics, background jobs, notifications, analytics, AI tool invocations, import maps, offline device scopes and billing.
- Cross-tenant ULID enumeration, IDOR, file download, forged warehouse/branch IDs, AI prompt injection, sync replay, tenant deletion, queue context contamination and cache crossover must be tested.
- Super-admin access/impersonation requires explicit, temporary, audited authorization; platform tables are clearly marked and separated.
- Backup retention, tenant export/deletion, encryption and monitoring policies must be designed before launch.

## 5. Mandatory P0 — restore and reverse-engineer legacy SQL Server database
A native `.bak` **cannot be directly imported into PostgreSQL or directly inserted into a tenant**. Use isolated, compatible SQL Server restore -> schema inventory -> transform -> stage -> import -> reconcile.

1. Store source privately and immutably, compute SHA-256, record chain of custody, avoid public git and copy proliferation.
2. Run `RESTORE HEADERONLY`, `RESTORE FILELISTONLY` and `RESTORE VERIFYONLY` on isolated SQL Server. Determine full/differential/log chain, product compatibility, TDE requirements, logical file paths and restore feasibility.
3. Restore under a **new database name** and safe target file paths; **never** use destructive `WITH REPLACE` against an existing database. Don't modify source data.
4. Extract real inventory: schemas, tables, columns/types/nullability, PK/FK/unique indexes, triggers, views, computed columns, candidate business keys, row counts, and only de-identified samples. Record finance, tax, units, prices, batches and stock semantics.
5. Produce `LEGACY_SCHEMA_INVENTORY.md` and `LEGACY_TO_AHPOS_MAPPING.csv` with source/destination fields, transforms, ownership, certainty and test criteria. Avoid inventing unavailable mapping until verified.
6. Create per-batch, per-tenant `migration_id_map` with source system/source PK -> target ULID, checksum, idempotency state, provenance. Only the server-selected destination tenant is allowed.
7. Agree snapshot cutoff. Choose reconcileable opening-balances strategy versus full historic transaction replay; never accidentally double post inventory or journals.
8. Dry-run a tenant-scoped import transactionally in staging; preserve source identifiers separately but do not expose internal BIGINT IDs publicly; protect confidentiality.
9. Reconcile document counts/totals, product quantities/valuation, cash/bank, AR/AP, trial balance, tax, debits/credits and balances; report source anomalies instead of inventing corrections.
10. Run migration twice in safe test environment to prove idempotency. Negative-test an import that attempts a different tenant ID and assert zero leakage.
11. Require explicit approval of reconciled mapping and backup recovery before live migration.

**P0 acceptance:** verified restore or verified database/schema export with constraints/row inventory, approved mapping, reconciliation signoff and isolation plan. If restore access is absent, record a blocker rather than filling gaps with guesses.

## 6. Financial and inventory invariants
- All posted records immutable, correction by authorized reversal/adjustment actions, with actor/device, source and audit trace.
- Double-entry journals debit = credit, posted once; fail clearly if accounts configured incorrectly, never invent balancing accounts.
- Stock ledger is append-only with transactional server stock validation and inventory cost strategy. No parallel movement path.
- Server recomputes gross/net/tax/discount/FX/COGS from authorized catalog/price rules; decimal-safe arithmetic, not floats.
- Multi-unit and barcode-to-unit conversion rules, allowances for fractional quantities, expiry/batch allocation only if an actual lot model supports them.
- All generated reports reconcile to posted snapshots and provide meaningful stale/unavailable data warnings.

## 7. Online and offline sales contract
Online: all authorized business functions on live server. Offline web v1 **allowlist**: device-approved and bounded local product/barcode search, selected customer references, last-synced prices with timestamp, local cash-only sale drafts, save/hold/receipt printing as explicitly approved, and durable queued sync. Stock counts are not authoritative offline.

Offline never grants unrestricted financial posting, credit recovery, customer balances, arbitrary purchasing/accounting changes, tenant switching, broad exports or administration. No hidden permissions escalation.

Use a transactional IndexedDB outbox: device scope, tenant/branch/warehouse context anchored to authenticated device, operation ID, idempotency key, local sequence, snapshots, created UTC time, server revision, signature where appropriate. Retry safely with backoff, acknowledge once, detect duplicates, reject stale/forbidden data. On reconnect, server revalidates current authorization, catalog/price rules and stock, and returns accepted/rejected/needs-attention for user resolution; never silently overwrite financial history.

Local data access must be scoped to account/device and wiped/locked on logout/revocation as feasible; local device compromise and XSS remain residual risks. Bound offline retention and data volume; do not claim exact historical stock when disconnected.

## 8. Mobile roadmap
Native mobile begins after **70–80% accepted web** completion and stable core APIs. Reuse API contracts, permissions, server financial calculation and sync protocol; use SQLite or similar native persistent store, not browser IndexedDB as a mobile-native guarantee. Assess barcode camera, Bluetooth/USB printer, background sync limitations, phone storage security, revocation, poor network and iOS/Android capability separately. Track mobile 0–100% independently.

## 9. AI copilot architecture and delivery stages
**Yes, voice/chat agent control is possible** if AH-POS itself implements a secure route/action registry and typed backend tools. Language models interpret user intent; they must not have raw SQL, unbounded route execution or database bypass.

1. **AI-0 Groundwork:** tenant-aware provider abstraction, request budgets, usage metering, PII controls, streaming, tool schema, RBAC rules, logging with redaction, quality harness.
2. **AI-1 Read/navigation:** commands such as “Usman ka ledger open karo”, “new sale open karo”, “is item ka rate batao”; tool calls `find_party`, `navigate_to_route`, `get_party_ledger`, `search_products`, `get_price`. Backend returns only authorized data. Ambiguity -> disambiguation.
3. **AI-2 Document to quotation:** user pastes WhatsApp order, uploads permitted screenshot/photo or handwritten sheet, voice note or text. Extract/OCR/transcribe, identify product name/unit/qty, match **actual tenant catalog**, show low-confidence and unmatched items, fetch server prices, **create quotation draft** for user review. No fabricated products/rates.
4. **AI-3 Assisted drafts:** create sale and purchase drafts, add/remove lines, address missing items, prepare but do not directly post. Sensitive write operations require explicit human confirmation, server re-pricing and RBAC.
5. **AI-4 Advanced workflows:** user-approved multi-step task orchestration, role-aware summaries/report filters, audit trails. Background approval/pending states never auto-post finance merely on a model suggestion.

**Examples:** “Usman ka ledger open karo”; “new sale kholo aur 2 cartons sugar add karo”; “new purchase invoice start karo”; “rate of item X batao”; “iss voice note ki quotation bana do.” Actual feasibility and accuracy depend on catalog matching, integration, microphone permissions, audio quality, handwriting and user approval.

**Security tests:** tenant A's content asks to read tenant B; unauthorized ledger; malicious message says ignore tool rules; identical product names; quantity 1 vs 7; noisy Roman Urdu; expired price; user/device revoked; no matching SKU. All must fail safe, track correction rates and audit actions.

**WhatsApp scope:** v1 manual paste/forward/export/upload by authorized user; direct WhatsApp sync later only through official supported business integration with consent and applicable platform requirements. An app cannot simply read arbitrary private WhatsApp messages.

**Offline AI:** cloud-based language understanding requires connectivity; offline fallback offers deterministic shortcuts and cached catalog lookup, not equivalent cloud agent capabilities. On-device AI needs a separate feasibility/privacy study.

**Billing:** embedded OpenAI API use is separate from ChatGPT Plus/Pro or “Expanded access”; run backend-owned API project, measure text/audio/image use and configure tenant quotas, budgets and abuse protection. Do not promise free unlimited AI to subscribers.

## 10. Original global design system
Create an unmistakably new brand, sidebar/shell and visual hierarchy distinct from BluePOS, even while preserving useful generic POS workflows. Define typography sizes, spacing rhythm, color semantics, dark/light, density, responsive breakpoints, overlays, validation, state feedback, loading, keyboard navigation and WCAG-oriented accessibility.

Shared canonical UI: AppShell, Sidebar, Topbar, UiButton, UiInput, UiSelect, UiDatePicker, UiModal, DataTable/EntryGrid, MoneyInput, QuantityInput, ProductPicker, PartyPicker, Toast, ConfirmDialog, SearchPalette, AiAssistantDock, VoiceRecorder, SyncStatusBadge and ReceiptPreview. Pages own domain logic and geometry, **not duplicate controls or global styles**. Record reviewed exceptions centrally.

## 11. Delivery milestones and weights
| ID | Phase | Weight | Acceptance criterion |
|---|---|---:|---|
| P0 | Legacy restore/schema mapping | 12 | verified source & reconciliation mapping |
| P1 | Architecture, tenancy/security, CI | 13 | negative isolation tests, decisions approved |
| P2 | Brand, global UI and shell | 8 | shared component and responsive acceptance |
| P3 | Master data and tenant import engine | 14 | reconciled tenant-scoped import dry runs |
| P4 | Purchasing, inventory, accounting | 14 | invariant and posting test acceptance |
| P5 | Online POS sales/returns/receipts | 15 | real full sale scenarios accepted |
| P6 | Offline web sales and sync | 10 | duplicate/retry/conflict/device tests pass |
| P7 | Reporting, administration, operations | 8 | report reconciliation and monitoring/ops |
| P8 | AI copilot MVP | 6 | authorized navigation and draft accuracy |
| **Total** | **Web** | **100** | **accepted work only** |

States: `not_started`, `in_progress`, `blocked`, `implemented_unverified`, `verified`, `accepted`. Use `PROJECT_MILESTONES.csv` + `PROJECT_PROGRESS.md`, linked evidence and last validation date. Starting web is **0%**. If tasks are split, write their weights and acceptance criteria before counting partial percentages.

## 12. Required repo artifacts
`AGENTS.md`; `README.md`; `docs/MASTER_ARCHITECTURE.md`; `PROJECT_CURRENT_STATE.md`; `PROJECT_PROGRESS.md`; `PROJECT_MILESTONES.csv`; `PROJECT_CHANGELOG.md`; `PROJECT_UI_DESIGN_SYSTEM.md`; `docs/CHAT_HANDOFF_PROTOCOL.md`; later `LEGACY_SCHEMA_INVENTORY.md`; `LEGACY_TO_AHPOS_MAPPING.csv`; `docs/decisions/ADR-*.md`.

Every significant coding session updates the current-state, progress and changelog with current SHA/branch, validations, exact next action, and blockers. New chats always re-read these; no dependency on ChatGPT remembering past chat.

## 13. Open questions and release gates
Validate: actual source schema/data, tax jurisdiction and FBR integration need, expiry/batches, accounting period/cutoff, inventory costing, number of offline devices, device revocation, printers/scanners, supported hosting, AI quotas, WhatsApp official API feasibility, customer consent and retention.

**Release prohibited** until tenant penetration/negative tests, financial reconciliation, offline retry/conflict tests, secure migration dry run, backup recovery rehearsal and user acceptance all pass. Protect source backup as private and untrusted until verified.

## 14. Handoff order
P0 FIRST. Do not write speculative target migrations or claim imported data. Record backup hash and isolated SQL Server verification, produce actual schema inventory and mapping, reconcile, then obtain approval for P1. Prefer minimal files and small tested vertical slices. Never silently expand scope or assume BluePOS already implements AH-POS features.

## 15. Super Admin controlled AI and WhatsApp communications (approved direction 2026-11-18)
**Platform authority:** AI and WhatsApp are platform-managed entitlements; only Super Admin can enable/disable them globally, define plan features and quotas, choose allowable provider integrations, set pricing/budgets, and suspend specific tenant access. Tenant administrators may configure only tenant-scoped allowed settings; no tenant can bypass subscription, budgets, disabled status, or cross-tenant boundaries.

**AI controls:** global on/off and tenant on/off; feature-level entitlements (text commands, voice transcription, OCR/image, quotation drafts, agent actions), model routing/provider credentials stored server-side, monthly spend/command/token ceilings, monitoring, audit logs and per-tenant rate limits. A server-side entitlement + RBAC + tenant context check is required for EACH invocation and tool call. Disabling mid-task must stop additional tool invocations and revoke further billable work where technically feasible. Sensitive actions always require explicit user confirmation; Super Admin enablement never grants permission to see another tenant's business data.

**WhatsApp controls:** global on/off, plan entitlement, tenant approval/onboarding, per-tenant official WhatsApp Business sender connection and encrypted credentials, allowed utility/marketing categories, approved template catalog, messaging quotas/daily caps/budgets, opt-in/opt-out compliance, audit and delivery/error logs, campaign approval and emergency pause. Only the verified tenant-linked sender can be used for that tenant's messages; no tenant can send from another tenant's identity. Ledger PDF/receipt sharing, payment reminders, product announcements and back-in-stock notifications should be staged; prevent duplicate sends and avoid bulk campaigns without consent. Message category and charges must be checked against current Meta policy at implementation time. WhatsApp Status autoposting is **not a promised API feature**; plan an approved manual status creative/share flow unless supported officially.

**Entitlement architecture:** platform_feature_catalog, subscription_plan_features, tenant_feature_overrides, tenant_provider_connections, tenant_usage_counters and audit records are **conceptual entities only**, not verified table names or authorization to create a schema before P0. Enforce plan + tenant + user authorization at backend boundary and in queue jobs with immutable tenant-scoped idempotency keys. Expose usage/billing overview in Super Admin and scoped usage only to tenant admins. Super Admin can set quotas and policies; tenant may opt into marketing, manage customer consent and edit allowed templates/campaign drafts within their plan. Meter provider costs accurately and prevent runaway spend.

**Release gate:** test global disable, individual tenant suspension, exhausted plan limits, revoked user/device, wrong tenant sender, queue race/retry, injection against AI actions, and cross-tenant data access; fail closed. No AI/WhatsApp platform feature is implemented yet. Track development in a later approved milestone without silently changing existing weights.

## 15. Approved delivery environment decision (2026-11-18; supersedes original P0 scheduling gate)
The legacy `DBSmilePOS` backup is **historical sample/test reference**, not the live cutover dataset. Do not block application scaffolding on fully restoring or mapping this old backup. At go-live, after verified readiness and approved downtime, stop writes to the old POS, acquire a FRESH backup, complete source mapping, dry-run, tenant-scoped import and financial/stock reconciliation, then approve cutover. The existing P0 safety criteria remain mandatory before any production migration, but P0 is no longer a prerequisite to writing generic app foundation.

**Current development:** one PostgreSQL test database for AH-POS, even if deployed temporarily to one test server. This does not weaken the intended future shared-schema tenant isolation; implement and test tenant-aware boundaries from day one using multiple *logical* test tenants in the same database. SQL Server `DBSmilePOS` and `DBSmilePOS_LAB` are local source-reference databases, not application backing databases.

**Release workflow at production launch:** two separate web domains/environments: staging and production, each with its **own database, config/secrets and storage**, with reviewed/tested promotion staging -> production. Never run staging tests on production data; sanitized dataset only. Feature branches/PR review and CI become required as delivery matures. Production writes, data import, deployments and DNS changes require explicit approval.

**Current bootstrap:** Laravel 13 + React/TypeScript/Vite candidate selected for beginning development. First checked-in frontend is a temporary engineering shell, not approved branding; backend generator must not run database migrations as a side effect. No implemented tenant/business tables may be inferred from the historical backup without verification.
