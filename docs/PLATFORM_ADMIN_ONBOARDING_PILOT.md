# AH-POS Platform Control Plane — First Usable Onboarding Slice
**2026-11-19. Source committed, NOT yet migrated, tested or browser verified.**

## What is ACTUALLY implemented in this source batch

- Separate Platform RBAC tables: `platform_roles`, `platform_role_permissions`, `platform_user_roles`; distinct from tenant roles, memberships and business records.
- `platform_audit_events` append-only through application workflows: action, actor, time, target public ULID where applicable, observed request IP and limited metadata. DB-level immutable audit enforcement and retention are still pending.
- Canonical Platform permission names, fail-closed `platform.permission` middleware, `/api/platform/me`, `overview`, `admins` list/create, `staff` list/create and `audit`. Web session auth + built-in CSRF + throttled creation endpoints. The control-plane API does **not** route through an arbitrary tenant or use tenant financial queries.
- Creating a new Admin business transactionally creates **new tenant**, new owner user with server-side password hash, **active owner membership**, explicit `Admin Owner` role and all currently known tenant role permissions, and writes Platform onboarding audit. No platform rights are granted to this tenant owner. Only new email allowed, no account reparenting.
- A Platform Super Admin with `platform.staff.manage` can create **Support Operator** (platform read-only) or **Admin Manager** (platform admin creation/read), neither can manage Platform staff or audit by default. No Super Admin delegation via web endpoint; no wildcard or "platform Super Admin = tenant Super Admin" bypass.
- Local-only **one-time** command `php artisan ahpos:bootstrap-platform-superadmin`: explicitly select an existing local user's email and confirm privilege creation. Restricted to `APP_ENV=local`, `pgsql`, `ahpos_test`, loopback DB host. No seeders, default accounts or auto grants. This is not a production bootstrap procedure.
- Frontend `PlatformPanel` appears only when authenticated `/api/platform/me` returns separate Platform authorization. A platform-only user with no business membership lands in Platform. User with one business continues direct Admin dashboard and sees a Platform top-tab **only if additionally authorized**. Current existing `ali` account is **not** granted Platform automatically.
- All historical tenant data, owner identities, posted documents and shared-schema business records unchanged. The pilot does **not** enable production sales or resolve RLS.

## Not implemented and hard security limitations

- Tenant staff creation/delegated roles, per-user device approval/revoke middleware, location permission & consent flow, tenant device/IP tracking; the Platform staff created here are **vendor operators**, not tenant employees.
- Platform staff disable/role edit, admin suspend/plan billing/AI/WhatsApp entitlements, MFA/reauth sensitive actions, invitation email, password reset/force change, production Super Admin bootstrap ceremony.
- Full Admin reporting, financial ledgers and tenant-wide inspection from Platform. **Never provide blanket Platform access to tenant business records.**
- The pilot onboarding form accepts an initial strong password to create an Admin owner account. Before production, replace with expiring invitation / set-password flow with MFA and verification. Do not email passwords or place credentials in public GitHub.
- No persistent IndexedDB or true low-stock notification system. Dashboard threshold <=5 is visual only.
- Existing local `ali` tenant was created by `ahpos:provision-test-account`; it does not automatically become a Platform-created "Admin Owner" record, and remains usable.

## Exact local validation

On existing `C:\laragon\www\AH-POS`, backend already configured to `ahpos_test` PostgreSQL:

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=PlatformOnboardingTest
cd ..\frontend
npm run build
```

This source batch contains **one additive migration 000011**. No `migrate:fresh`, reset, legacy data movement, automatic user grants, or repeated old passing tests. If `db:show` isn't **ahpos_test**, STOP before migration.

If focused test passes, to open Platform on the existing *local* account, opt in **once**:

```powershell
cd C:\laragon\www\AH-POS\backend
php artisan ahpos:bootstrap-platform-superadmin
```

Enter existing **local** account email, carefully confirm. This is high privilege; do not share login password or run on production. Refresh/login again at Vite `http://localhost:5173`, use the **Platform** tab in top ribbon, visit Admin businesses, create a new test Admin with unique email and complex password. Existing Admin `ali` should still work; Platform staff Support Operator has no tenant membership. Check browser Network for 401/403 issues and share exact error; source has NOT been run here.

## Acceptance and next implementation

Targeted `PlatformOnboardingTest` asserts guest denied, normal business user denied, only explicit Platform role creates Admin, new owner has exactly matching membership/role but **no** Platform rights, Platform Super Admin cannot see a tenant's Product route without membership, Support Operator reads Platform admin list but cannot create Admin or view audit. DB transaction rolls all test rows back.

Next separate release-critical slice: **Tenant Admin staff onboarding, scoped role delegation, employee device request/approval/revoke, server middleware denial on all tenant business APIs, no implicit legacy session bypass**, with focused negative tests. Platform role privileges and approved-device security must never be conflated. Rest of production gates persist.
