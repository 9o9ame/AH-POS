# AH-POS — Global modal fix + Platform Admin management batch

**Date:** 2026-11-19  
**Status:** Code committed to GitHub; local TypeScript/Vite build, focused Laravel tests and browser UAT **NOT YET VERIFIED**.

## Root cause of "no modal opens"

- `frontend/src/styles.css` previously applied `animation:page-enter` to `.workspace-main > *`, `.catalog`, etc. The animation `transform:translateY(...)` creates a containing/stacking context. The same workspace is constrained by `overflow:auto` and the Platform workspace also scrolls within a constrained shell.
- `EntityModal` was rendered **inside the animated/scrollable parent**, using `position:fixed;z-index:102`. In CSS a transformed ancestor changes the containing block for fixed descendants. When the modal appeared in React, it could be clipped/positioned relative to that ancestor and invisible to the user, despite correct `setEditorOpen(true)` click handlers.
- Changed **one shared modal** (`frontend/src/EntityModal.tsx`) to `createPortal(..., document.body)` with a global fixed top overlay, constrained modal scroll, first-control autofocus, focus trap, Escape close, disabled close while saving, backdrop click, and focus restoration. This applies to:
  - Products / Customers / Suppliers
  - Category / Sub Category / Brands / Units
  - Warehouse / Stock Inward
  - Tenant Admin → Users & Staff and Device approvals
  - Platform → Create Admin, Add Platform Operator, Assign Owner and new status changes
- Error messages from creation APIs now appear **inside the modal** rather than behind its blocking overlay. Disabled Add buttons on products/parties when read permission is absent (previously clickable but dialog couldn't mount due to `canRead`/ `allowed` branch).
- All existing tenant/POS API ownership, financial calculation and inventory posting semantics unchanged. No migration or DB reset.

## Next working Platform/Admin management

- New permission-gated `PATCH /api/platform/admins/{tenant}/status` uses named `$request->route('tenant')` parameter (avoids earlier positional-ULID 404).
- **Suspend / Reactivate** business by public tenant ULID with mandatory reason (3–300 characters), PostgreSQL row lock, reversible `tenants.status` change and Platform audit event `platform.admin.status_changed`. Only `platform.admins.create` holders (current Admin Manager/Super Admin pilot authority) can manage status. Privilege scope can be split into a dedicated `platform.admins.manage` migration in the following RBAC version.
- **Safe tenant stop:** current `ResolveTenantContext` rejects suspended tenant with 404, and `AuthSessionController` requires an active membership in an active business on fresh login. Stock, products, business users and posted records are never deleted; reactivation reinstates active members (individual device approval rules remain).
- Platform Admin businesses list gains local **search** by business/owner/email and **active/suspended filter**; compact status action uses a **modal confirmation with required audit reason**, not a native browser confirm.
- Staff suspension and approve/reject/revoke device actions now also use the shared accessible confirmation modal instead of browser `window.confirm`. Server permission checks unchanged.

## Local-only password consistency

- Earlier user requirement: only **3-character minimum** for development, not 12-character complex passwords. The CLI already follows that; previous Platform Create Admin/Add Operator and tenant Add Staff modal APIs did not.
- New `DevelopmentPasswordRules::creation()` provides `required|string|min:3` **only** if environment is local/testing, active connection is `pgsql`, DB is exactly `ahpos_test`, host is `127.0.0.1` or `localhost`. Everywhere else password creation remains **min 12, mixed-case, digits, symbols**.
- `PlatformController`, `TenantStaffController`, and Platform separate-identity endpoint use helper. Development frontend modal forms set `minLength=3` under Vite DEV only (with `vite-env.d.ts` for typing); production bundle retains 12. No credential contents logged.
- This is explicitly a **local demo/test exception**, not a production policy.

## Focused tests added

- `PlatformAdminStatusTest` (rollback-only): Super Admin can suspend tenant, owner data/membership intact, tenant API denied, reactivation restores, audit created, Support Operator denied, repeated status refused.
- `LocalPilotModalCreationTest` (rollback-only): creates tenant Admin and Platform Support Operator through **real Platform APIs** using local 3-character passwords, checks hashes, verifies tenant/Platform membership boundaries, and confirms nonlocal password policy rejects weak input.

## Exact user validation; only this batch

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan test --filter='PlatformAdminStatusTest|LocalPilotModalCreationTest'
cd ..\frontend
npm run build
```

**No migration** (only PHP/TS/CSS), **do not rerun** earlier 8 PASS/99 assertions, old platform bootstrap, tenant auth tests, `migrate:fresh` or DB reset. In browser, hard reload with Ctrl+Shift+R after updating Vite dev server if necessary:
1. `http://localhost:5173/platform/login`: sign into dedicated Anwaar Platform account. Platform → Admin businesses → **Create Admin** should open an actual centered overlay above sidebar and scroll. Test Cancel/Escape and keyboard Tab, then create **one intentionally named local test business** with unique test email and 3+ password if desired. Do not create or duplicate real customers just to test.
2. Platform → Admin businesses → search/filter; **Suspend/Reactivate** an **explicit throwaway test tenant only**, not Ali or an active live tenant. Reason required; check audit events and reversible status. Never block the primary Ali tenant for testing.
3. Platform → Platform operators → Add Operator; verify modal layering and role selection; only create sample user if wanted.
4. `http://localhost:5173/` Ali tenant → Definitions → Products, Categories, Customers/Suppliers → Add buttons show modal, do not scroll whole page. Administration → Staff and Device Management modal confirmations. Warehouse/Stock Inward forms show modal.
5. Escape/backdrop close (when not saving), Tab stays inside, focus returns to Add. If API denies saving, error should appear **inside** form overlay. Note normal role permissions still apply.

## Honest scope

This batch resolves modal **source-level root cause** but cannot claim browser visual acceptance or local tests until user runs them. It does not complete all 72 ERP modules, GL/COGS/tax/RLS, platform Plans, full role editor, MFA or production device assurance. These remain separate gates.
