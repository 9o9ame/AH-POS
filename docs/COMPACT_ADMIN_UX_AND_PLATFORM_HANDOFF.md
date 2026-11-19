# AH-POS — Compact Admin Desktop UX & Platform plan (2026-11-19)

**Status:** Frontend source implemented, **build/browser validation pending**. Platform/device RBAC is **architectural proposal only**. No backend migration in this batch.

## User verified baseline

- Previous `ProductDefinitionMastersTest` now user-verified **PASS: 1 test / 17 assertions** on the existing `ahpos_test` PostgreSQL 18.6. Additive masters migration 000010 DONE.
- User browser screenshot confirmed six-family AH-POS ERP ribbon and Definitions module explorer with working/planned items.
- Latest requirements: Super Admin Platform with platform staff/roles; user business tenants called Admin workspaces, each with isolated staff (purchaser/cashier), RBAC and Admin-approved devices/IP/location audit; direct Admin login; charts, Sale/Purchase shortcuts on dashboard; remove old breadcrumb/search/dev top bar; list-first compact pages with modal forms; hover/pin sidebar; card-only scroll; IndexedDB and theme skeleton loading.

## New frontend source

- `frontend/src/App.tsx`: single-authorized-tenant user automatically opens verified Admin business Dashboard after successful login and on authenticated refresh. **Multiple authorized memberships keep chooser**. Platform-only users still require future separated Platform login. Old redundant top-bar removed.
- `frontend/src/ModuleDirectory.tsx`: top ribbon now includes compact workspace and profile initials, submenu pin toggle. Active main module toggles directory visibility; changing module closes previous pinned submenu.
- Hover/focus on left edge reveals submenu using CSS translate/opacity, pin/unpin controls support pointer + keyboard; sidebar not shown initially. Tablet/touch needs browser review.
- `frontend/src/DashboardPanel.tsx`: 7-day bar chart for **gross cash sales**, donut chart of **counts of sales/purchase/refund documents**, real tenant data KPIs, linked Sale/Purchase/Held actions; provisional (display-only) quantity <= 5 stock watch with color severity. **No fake profits, bank balances or full GL totals**.
- New reusable `EntityModal.tsx` shared by Products, Parties, ProductMasters and Inventory to put entry forms behind Add buttons, leaving the list/search/table onscreen. TableSkeleton renders shimmering theme-only placeholders in pending regions. Modal accessibility/focus behavior needs real keyboard review.
- `frontend/src/styles.css`: compact admin screen, max-height scrollable/sticky tables, no document/body-wide vertical scroll in app frame, animation/reduced-motion, theme-toned skeletons, responsive dashboard, colored stock display.
- No IndexedDB persistence was added because this is currently an **unapproved shared-device threat boundary**. Architecture in `docs/decisions/ADR-0003-platform-admin-devices-and-desktop-ux.md`: allowlisted tenant/user/device cache only after enrollment, session revoke/logout cleanup and server authority. Current skeleton/API loading is not offline sync.
- Not all transaction-related pages converted to plain tables; Sale/Purchase remain dedicated full-screen business invoice modal workflows, Cash Register dedicated operational panel, Reports dedicated charts. Master data create flows are modal-first.

## Platform/Admin architecture decisions (not source implementation)

Refer to ADR-0003:
1. Platform Super Admin separately authorizes Platform employees, roles, subscription/entitlements and tenant (Admin) creation.
2. Tenant Admin gets one protected business tenant with **tenant-only roles** and server-created owner membership, can invite staff and delegate only permissible capabilities. Platform employees have no implicit access to business records.
3. Tenant cashier/purchaser device request/approve/revoke before business API access (future mandatory server middleware). IP/device/location metadata follows trusted proxy, consent, least privilege, retention rules; IP is not GPS proof.
4. One `ahpos_test` database with multiple *logical* tenant accounts. Separate staging and production DBs/domains/secrets later. Never turn local 3-character test passwords into production policy.
5. Server ownership/RBAC/RLS continues to be the security source of truth; frontend navigation, device UUIDs and IndexedDB are never permission enforcement.

## Local handoff

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd frontend
npm run build
```

**No `php artisan migrate`** (no schema changes), **no permission grant**, **no repeated passing backend tests**. If build fails share exact TypeScript/Vite lines; fix only affected code. Vite dev server may hot reload after pull. Browser smoke:
- Sign in as the single-tenant `ali` user; dashboard should open directly (no tenant chooser).
- Main ribbon at top; breadcrumb/search/Local Development top row gone. Dashboard Sale/Purchase/Held shortcuts and live bar/donut charts.
- Hover left edge => contextual sidebar slides in; move off => hides; pin button => stays; choose next family => previous sidebar closes; click same active family again => directory closes.
- Products / Customers / Suppliers / Categories / Sub Categories / Brands / Units: compact searchable table; Add opens modal; cancel/submit behavior. Inventory Warehouse / Receive Stock via modal, list remains.
- Check stock watch. Quantity <=5 is a provisional **UI-only** threshold and not a genuine reorder notification. No persistent push notification or device audit claims.
- Check at 1366px desktop and narrow screen, keyboard tab/Escape, modal scroll and reduced motion. Report screenshot and specific failure if any.

## Next implementation milestone

**Platform + tenant staff/device backend enforcement**, not fake menu completion: secure bootstrap, platform RBAC and tenant creation API, Admin owner membership, invitation and role delegation, device approval + revoke and audit. Must build focused negative tests (platform staff denied tenant books, foreign tenant forbidden/404, revoked device denied) and preserve existing `ali` demo account through additive migrations and documented grandfathering plan. Then approved device-scoped IndexedDB reference caching, server-defined low-stock thresholds/notification center, final financial GL/costing and production RLS. **Cannot promise ten-day full ERP production readiness** without gate evidence.
