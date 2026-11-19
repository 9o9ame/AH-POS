# ADR-0003 — Platform, Admin workspaces, device approval and desktop UX

**Date:** 2026-11-19  
**Status:** **Proposed architecture and prioritized implementation contract; NOT implemented platform/device enforcement**  
**Decision drivers:** User reviewed AH-POS screenshot and requested BluePOS-like platform hierarchy, Admin/staff isolation, device approval, direct Admin login, desktop UI/navigation, fast scoped caching, and colored inventory warnings. References: BluePOS business-flow context (not UI/code copy), AH-POS current Laravel session membership/RBAC and one PostgreSQL test DB.

## Terms and identity

- **Platform** = AH-POS vendor-owned Super Admin control plane, separate from tenant business records.
- **Admin** = customer business owner / tenant administrator. **Admin workspace** maps to one existing `tenants` row (public ULID). Do **not** rename the physical `tenants` table or merge platform roles into tenant roles.
- **Tenant staff** = a cashier, purchaser, manager, inventory controller or other user who belongs to exactly the authorized Admin workspace(s), with tenant-scoped roles.
- **Platform staff** = vendor support, platform operator, onboarding/billing/security personnel; roles and privileges are exclusively in the **platform authority scope**, not in tenant membership. Staff may not read arbitrary tenant financial records just because they manage Platform.
- Admin and staff can share the existing identity/users table, but platform roles are *not* tenant roles. No default Super Admin assignment to a normal test user. Super Admin bootstrap needs an explicit local secure one-time CLI with unique operator identity, audited confirmation, and privilege revocation/rotation. **No production default passwords**, and existing local 3-character test exception is not a security policy.

## Security/data model proposal

1. `platform_roles`, `platform_permissions`, `platform_role_permissions`, `platform_user_roles`, `platform_audit_events` — platform-only records with no client-controlled tenant selection. Explicit actions: `platform.admins.create/read/suspend`, `platform.staff.manage`, `platform.entitlements.manage`, `platform.devices.review`, `platform.audit.read`, etc. Platform RBAC deny-by-default. Sensitive actions require reauthentication or MFA and immutable audit.
2. `tenant_administrators` (or an existing tenant role + membership proven suitable after review): a server-created, active owner membership, with approved roles within only that tenant. Tenant Admin can invite employees, assign **only delegable tenant permissions**, never platform powers, and review device requests from that tenant. Staff cannot escalate own role, create owner of another tenant or toggle platform entitlements.
3. `authorized_devices` and `device_access_requests` scoped to the tenant, employee and device installation credential. Workflow: employee signs in -> server recognizes unknown device -> **pending approval**; no tenant business route access while pending -> Admin verifies device label/claims -> approves/rejects/revokes -> server checks approved device on every authenticated business API request and after token/session rotation. Store only hashed device credentials/identifiers; support lost-device revoke and expiring sessions. Platform may audit/suspend devices under separately scoped support workflows. Do not rely solely on IP address, browser fingerprint or a random client UUID for device identity.
4. Security telemetry: login/device approval time, coarse location (if permission/consent granted), request IP as resolved only from *trusted proxy* configuration, user agent/device label, session/device ID, approval actor/time, revocation reason and audit trace. Log retention/consent/access policies required. **IP geolocation is approximate and not proof of physical GPS location.** Avoid covert continuous tracking or storing precise location without explicit permission; protect employee and customer privacy.
5. Shared-schema tenant-owned tables continue with composite tenant FKs, fail-closed middleware, explicit RBAC and eventually PostgreSQL FORCE RLS using a non-owner runtime DB role. Platform support impersonation must be time-limited, consent/approval gated and audited, never implicit root bypass.

## Routing and login lifecycle

- `/platform/*` must be **platform-only**, protected by platform authorization and its own layout.
- `/app/*` is **Admin workspace**; user with **exactly one active tenant membership** is server-verified then enters that dashboard directly. Multiple memberships show authorized workspace chooser; nobody may choose another user's tenant ULID by changing the client route. If a platform-only user has no tenant, route them to Platform, not to an empty tenant chooser (future implementation).
- For a **tenant staff** account, successful login without approved device goes to device request/pending page; the back end denies business APIs until approval (future rollout, migration and compatibility needed). Owner/Admin onboarding exceptions must be narrowly approved, not a blanket bypass. Existing local demo flows continue until explicitly migrated and tested.
- Admin chooses own branch/warehouse context from server-approved assignments; tenant-controlled price/stock/money changes still recomputed at Laravel/PostgreSQL.

## UX changes and accessibility

- Main menu ribbon at top: Home, Definitions, Daily Entries, Reports, Tools, Administration, Help. Remove redundant breadcrumb/local-development/search chrome; keep keyboard Ctrl+K via shortcuts. Business dashboard prominently contains New Sale, New Purchase and Held Bills actions.
- Sidebar **not pinned initially**. Left-edge hover/focus reveals a smoothly animated overlay. Edge/menu click pins; click again unpins; changing main module closes previous pane, and hovering the edge reveals new module. Keyboard focus/toggle and `prefers-reduced-motion` remain supported. Never block the workspace when sidebar is pinned; on touch/cell screens an explicit toggle replaces hover.
- Master data pages should show compact search/list/action toolbar. Add/Edit through one accessible modal, never permanent data entry forms above tables. Stock/cash terminal workflow may retain its functional full-screen window and transaction-specific panels, i.e., distinguish daily-entry documents from master lists.
- Fix full-screen body scroll; only workspace subcontainer, table or card scroll when contents exceed viewport. Use responsive dense grids, sticky table headers and virtualized rows when datasets justify it.
- Admin dashboard: live tenant-scoped bar and donut charts built from actual operations API aggregates, product/party totals and provisional low-stock watch. **Do not fabricate "profit", financial liabilities, bank balance or production tax charts.** Real low-stock notification center requires server-defined product/warehouse reorder points, branch-aware push triggers, deduplication and scoped unread state. UI-only threshold is labeled *display rule*, not configured inventory policy.

## IndexedDB phased decision

- Browser first visit cannot be instant if it has no data: show **skeletons only in pending content panels**, not full-page spinners, while critical navigation renders immediately.
- Initial optimization: scoped in-memory query cache and cancelable/debounced API requests for product/party search; paginate/incrementally render long tables. Do not dump entire sensitive dataset into persistent browser storage.
- **Later approved devices only:** tenant + user + device + schema-version partitioned IndexedDB for allowlisted catalog/reference records, short TTL, explicit stale/last-synced badges, robust logout/tenant-switch/revoke purge, migration+quota handling, optional encryption backed by server-approved device cryptography. Never cache platform secrets, passwords, payment details or broad PII. Server is authoritative for stock/price/role, so stale cache cannot authorize posting. Transactional outbox for approved offline sales is a *separate milestone* with idempotency and reconciliation.
- CSP, XSS defenses, service-worker asset versioning, revocation, cache corruption and shared-device threat model must be accepted before marking IndexedDB persistence done.

## Release priorities

1. **P2 visible shell MVP:** compact ribbon/dashboard, modal CRUD, hover/pin sidebar, true loading skeleton, one focused Vite compilation and manual browser review.
2. **P1/P7 Platform:** platform bootstrap with no default credentials, scoped platform RBAC, Admin onboarding and platform staff, explicit tests of zero tenant access, migration/cutover plan.
3. **P1/P7 Devices:** request/approve/revoke, location/IP telemetry with consent/trust proxy, session enforcement, Admin staff roles, user lifecycle; focused cross-tenant and denied-device negative tests.
4. **P3/P7 Notifications/Cache:** real server reorder thresholds, alert aggregation, approved device IndexedDB reference cache; measure interaction latency and verify revocation behavior.
5. **Production gate:** accounting, tax/COGS/GL integrity, non-owner RLS, proper device enforcement, backup restore, data reconciliation, release UAT and final authorization. No claim that the UI alone makes the app production-ready.

## Constraints

Development retains **one PostgreSQL `ahpos_test`** database with multiple logical tenant rows. Platform control plane uses distinct schema/tables/authority context in that DB; no separate test DB. Staging and production each use separate independent DBs/secrets. No destructive migration, tenant reset, fake user, hidden credential or production bypass. Status remains architecture/proposal until real API/migrations/security evidence.

## 2026-11-19 UX amendment: ribbon hover replaces edge hover

User explicitly rejected the earlier left-edge hover target in annotated screenshot. **This amendment supersedes the UX sidebar bullet above:** every top application ribbon tab previews its own contextual left submenu on hover/focus. Clicking a tab pins that family's submenu; clicking the pinned tab again closes it; selecting a different tab replaces it. Submenu slide-in begins below ribbon so module bar remains fully visible. Pointer can move to submenu without premature closing; unpinned preview collapses on exit; Escape closes. No detached edge trigger or redundant hamburger. This is an interaction-only amendment; Platform/device/IndexedDB policy and status unchanged.
