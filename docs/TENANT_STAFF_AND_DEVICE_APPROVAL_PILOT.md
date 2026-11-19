# AH-POS — Tenant Admin Staff & Device Approval Pilot

**2026-11-19. GitHub source implemented; local migration, targeted test, TypeScript build and browser checks NOT YET RUN.**

## Existing verified baseline

User on local Windows Laravel/PostgreSQL `pgsql/ahpos_test` confirms:
- Migration `2026_11_19_000011_create_platform_control_plane` DONE, PlatformOnboardingTest **1 PASS / 20 assertions**, frontend Vite/TypeScript build PASS (47 modules). 
- Explicit `php artisan ahpos:bootstrap-platform-superadmin` succeeded for the existing **local** account, without creating a default user. One initially entered alternate email was absent; no permissions changed then. Do NOT copy or record private passwords/credentials.
- Existing sample `ali` tenant and its products/transactions must remain intact. Platform Super Admin role alone does NOT imply Admin Owner over arbitrary tenant businesses.

## New functional batch

One additive migration `2026_11_19_000012_create_tenant_staff_device_approval.php`:
- Adds `tenant_memberships.requires_device_approval` default **false** to preserve existing member sessions. New staff created via Admin UI set it to **true**. Existing accounts are *not* silently upgraded, so full device enforcement for legacy users remains a separate rollout gate.
- Adds tenant+membership-owned `tenant_staff_devices` with public ULID, hashed random browser secret, pending/approved/rejected/revoked states, requested client IP and browser user agent, approval user/time and revocation time. Adds `tenant_staff_audit_events` for registration, staff account creation/status and device decisions. Browser secret returned **only in HttpOnly SameSite cookie**, never JSON or localStorage; database stores hash only. Cookie can still be copied and is not hardware attestation.
- New `tenant.devices.read/manage` explicit permission registry; grants these additions only to previously created `Admin Owner` roles, **not** Local Catalog Operator, Manager or platform staff.
- New `TenantStaffController`: tenant-RBAC scoped staff list, server-controlled role templates (Cashier, Purchaser, Inventory Clerk, Manager), creation with new strongly hashed credentials, suspended/reactivated status and device revocation on suspension. New user gets no platform roles or cross-tenant membership. Existing users/email cannot be silently attached, to avoid identity hijack.
- New `TenantDeviceController`: staff device request/status, Admin list, approve/reject/revoke (guarded by `tenant.devices.manage`) with row locking, explicit status transitions and audit. Suspended member is 404, foreign tenant is 404; not merely hidden UI.
- `ResolveTenantContext` enforces approval for ALL tenant business routes when membership's `requires_device_approval` is true, returning HTTP **423** with code `DEVICE_APPROVAL_REQUIRED`. Only authenticated tenant member **status** and **request** routes remain accessible to staff with pending devices. Tenant owner/legacy exempt memberships remain usable. Backend must enforce RBAC independently of this check.
- `frontend/src/StaffSecurityPanel.tsx` Administration tabs: real Users/Staff list & Create modal, fixed Role templates and Device Management list with approve/reject/revoke. `DevicePendingPanel.tsx` for newly created employee on login/refresh: request browser label, wait for Admin approval, manually refresh approval status; no sensitive business panels shown until approved. These screens are source-committed, not yet browser accepted.
- Central API client uses same-origin session, CSRF. No IndexedDB persistence, GPS collection, AI, WhatsApp or uncontrolled web privilege route added.

## Explicit local Admin Owner authorization for the historical ali tenant

Because the old local `ali` tenant predates Platform and was not created by `/api/platform/admins`, its existing local Catalog Operator lacks `tenant.members.manage` and `tenant.devices.manage`. **This is intentional fail-closed behavior.** To test staff creation on this existing local tenant, use this separate opt-in command, restricted to `APP_ENV=local` + loopback PostgreSQL `ahpos_test`:

```powershell
cd C:\laragon\www\AH-POS\backend
php artisan ahpos:authorize-local-admin-owner
```

Supply existing local tenant user email and the **actual** tenant ULID from current account; confirm on screen. This explicitly grants the Admin Owner role only in that selected tenant. It is NOT an automatic grant for the entire platform. No password input for this command. Alternatively, create an entirely new Admin through the verified Platform console; the new owner will already have the owner role.

## Exact next local commands

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=TenantStaffDeviceWorkflowTest
cd ..\frontend
npm run build
```

Only migration `000012`; `db:show` must confirm `ahpos_test` before migration. **Never migrate:fresh, reset, refresh DB, import stale SQL Server dump, re-run old passed tests, or re-bootstrap Platform**. Targeted test is ONE new rolled-back integration scenario; it must not change persistent business data.

## Browser pilot

1. Log in as the authorized Admin Owner of business `ali` or a new Platform-created Admin. Choose **Administration** on top menu; hover previews its sidebar, click pins, click same tab closes. Admin security menus now working.
2. **Users & Staff → Add Staff**: create a unique fake-local test email, strong password (12+, upper/lower, digit, symbol), choose **Cashier**. Do not reuse real credentials or share password in chat.
3. Sign out Admin, sign in as this Cashier **in a separate browser profile** (or incognito) so the Admin's session remains in original browser. Cashier should reach **Device approval required** rather than see business data.
4. Enter device label e.g. `Counter 01`, request approval. Admin → **Administration → Device Management** sees pending device and observed diagnostic IP. Admin approves.
5. Cashier clicks **Check approval status** and should enter dashboard. If browser reused, device approval may not be preserved because credentials are stored only in that browser's HttpOnly cookie.
6. Admin **revokes** the device; Cashier's next tenant API request must return 423 (current UI may show API error without an automatic redirect; mid-session redirect is not completed). Suspended member loses access (404) and approved devices are revoked. Test role separation: Cashier must NOT open staff manager, Platform console or tenant Admin-only endpoints.
7. Record screenshots/browser console/network errors; focused test + build first, no repeat of existing passed tests.

## Production gaps / status

Pilot is **not production device authentication**. Browser token is transferable; users may still have pending enrollment from a lost browser; no MFA, trusted hardware attestation, device session rotation, detailed session revocation, branch scope, server-side proxy trusted-IP validation, geolocation consent, audit retention, typed invitation/email verification, or arbitrary custom roles/edits yet. Existing memberships have approval flag false by design to prevent lockout. Changing that requires a dedicated migration/enrollment/UAT plan. No claim of full RLS/accounting/production readiness. Live go-live remains blocked by GL/COGS/tax, backup restore, device security strengthening and tenant RLS.

## Focused test boundary

`TenantStaffDeviceWorkflowTest` transactionally checks owner creates Cashier restricted to tenant, foreign tenant deny 404, business API 423 pending, explicit device request, Admin approval and revoke status, hashed token match, suspension and no platform role. Test **NOT yet run**. If it fails, inspect exact failing line and fix only evidenced issue; do not rerun old tests.
