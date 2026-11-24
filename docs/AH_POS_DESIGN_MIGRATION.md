# AH-POS Design Migration — Batch 01 (2026-11-22)

## Basis and boundary
The owner replaced AH-POS repository contents with the BluePOS working application on 2026-11-22. The commit was inspected in `9o9ame/AH-POS`: the original tenant `routes/index.tsx`, independent `routes/platform.tsx`, `features/workspace/modules.ts`, persistent document tabs, and RBAC handlers remain intact. **Never replace these with the incomplete former AH-POS demo.**

## Visual direction
- AH-POS now uses deep navy/ink chrome, airy business workspaces, fresh teal focus accents, professional typography and structurally distinct tenant/Platform shells.
- Existing theme/primary choices still drive shared `--ui-*` styling and semantic colors; default new preference is Advanced / Inter / Teal, stored independently as `ahpos.appearance`.
- Tenant ribbon, every command group/menu, persistent Sales/Purchase document tab, status bar and notification/device/account entry all remain rendered in the original component tree.
- Platform has its own deep-navy sidebar; the existing permission-filtered Dashboard/Businesses/Plans/Users/Roles/Permissions/Audit/Device Activity/Settings and account menus are retained. No new fake actions.
- Both authentication pages retain MFA/login/reset inputs and logic, but use AH-POS identity and a rectangular split-screen login instead of the inherited round embossed layout.
- Frontend PWA/update banner, `index.html` title and browser metadata, and shared `APP_NAME` now say AH-POS.
- Styling belongs to `frontend/src/ahpos-design.css` imported after canonical appearance, motion and density styles. Do **not** replace canonical components or introduce hidden functionality.

## Actual files edited
- `frontend/src/config/app.ts`
- `frontend/index.html`
- `frontend/src/layouts/AuthLayout.tsx`
- `frontend/src/pages/platform/PlatformLoginPage.tsx`
- `frontend/src/layouts/PlatformShell.tsx`
- `frontend/src/components/desktop/PwaUpdateBanner.tsx`
- `frontend/src/routes/index.tsx` (loading text only)
- `frontend/src/features/appearance/AppearanceProvider.tsx` (defaults and storage prefix only)
- `frontend/src/main.tsx` (one import)
- `frontend/src/ahpos-design.css` (new)
- `PROJECT_UI_DESIGN_SYSTEM.md` (transition rules)
No backend or migration files changed.

## Functional-preservation checks
- `frontend/src/features/workspace/modules.ts` and both route files **not edited** (except splash text in tenant route file).
- `frontend/src/components/desktop/Ribbon.tsx`, `WorkspaceTabBar.tsx`, `ApplicationTitleBar.tsx` and `layouts/AppShell.tsx` **not edited**.
- Real Platform link labels changed only from Tenants to Businesses while route `/platform/tenants` and permission string remain unchanged.
- Application branding name changed in one shared constant; this is not a rename of backend application keys/database.

## User verification
```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd frontend
npm install
npm run typecheck
npm run build
npm run ui:check
npm run ui:navigation-check
```
Use `npm install` if dependencies were not installed after replacing the source code (React, Vite versions differ from old AH-POS). **Do not run `php artisan migrate` against old `ahpos_test`**; BluePOS has a different schema and DB setup.

Then open tenant login and `/platform/login` with a hard refresh; compare all tab labels, ribbon navigation, controls, modal/dialog overlays and role-filtered links to their pre-redesign functionality. Report output of the build/check commands before marking verified. Build and browser tests were **not executed by the GitHub connector**, so no PASS claim.

## Next batches
1. Login / shell browser acceptance, responsive navigation and overlay layering corrections.
2. Definition masters / global tables / dropdowns / modals — preserve all fields and routes.
3. Sales / purchases / returns / document tab and cashier flows — preserve frozen financial geometry until explicitly approved.
4. Reports/accounting/stock/PWA and all Platform admin details — no loss of export/filters/permissions.
5. Additional AH-POS requirements: tenant-defined Users + Custom Roles + Permissions; tenant-limited legacy migration; platform-controlled AI/WhatsApp and audited device controls. These are separate development tasks, not falsely marked completed.

## Remaining limitations
The full visual conversion of every deep workflow is **not complete**. Initial CSS makes the outer shell and auth materially different, but some inherited internal BluePOS screens/assets still retain their original geometry. Follow-up design batches are necessary; never call this final acceptance.

## 2026-11-24 — Tenant mockup implementation: Sale Schemes / Price Lists
- New list-first Sale Schemes workspace with modal-only Add/Edit. Existing rewards logic, validations, mutation functions, permissions, F9/F8 and deactivation kept.
- Price Lists remains intentionally read-only: full-height data grid, filter bar, pagination and floating CSV export. All existing query/export semantics kept; output filename uses AH-POS.
- Scoped shared CSS added in `frontend/src/pages/TenantDirectoryPages.css`. Scroll is owned by each grid, not outer page; modal dropdown overlays use canonical UI layer.
- Implementation branch `design/tenant-schemes-pricelists-06` starts from `design/master-list-scroll-cleanup-03`. The owner has also merged `fix/sidebar-slow-transition-ts-05` locally; these branches are expected to merge non-destructively.
- GitHub source changes committed; local TypeScript, guards and authenticated browser visual/functional acceptance remain **UNVERIFIED** until owner reports results.
- Session handoff: `docs/AH_POS_SESSION_HANDOFF.md`.
