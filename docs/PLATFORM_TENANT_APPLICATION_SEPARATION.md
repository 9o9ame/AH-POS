# AH-POS — Platform vs Tenant POS: Separate Applications and Identities

**Date:** 2026-11-19  
**State:** Source implemented in GitHub; local focused tests, Vite build and browser acceptance PENDING. No database migration in this separation patch. Historical data unchanged.

## Verified BluePOS functional reference (read from actual repository code)

The developer reviewed **`9o9ame/bluepos` actual files**:
- `frontend/src/App.tsx`: `/platform/*` is a separate route tree wrapped in `PlatformAuthProvider` with `PlatformRoutes`. All other routes use `AuthProvider` and `AppRoutes`.
- `frontend/src/routes/platform.tsx`: protected `/platform/login`, `/platform` Dashboard, Tenants, Plans, Platform Users/Roles/Permissions, Audit, Device Activity, Account Security and Settings under `PlatformShell`.
- `frontend/src/features/platform/PlatformAuthProvider.tsx`: dedicated platform auth lifecycle and step-up MFA foundation.
- `backend/routes/platform.php`: distinct Platform authentication API and middleware; Platform tenant management and permission-checked actions.

This is the function/authority model to follow, **not permission to copy BluePOS UI assets or claim its unimplemented AH-POS modules are operational**.

## Core AH-POS decision

The previous AH-POS mistake was rendering a Platform button/Panel within the tenant `App` and using tenant web login to discover Platform privilege. That mixed identities and made one login look like owner of both systems. **Superseded and removed**.

**Independent entry points now:**
- **Business POS**: `http://localhost:5173/`; component `App`, tenant auth `/api/login`, business ribbon and context, active server membership required. No Platform tab or calls to `/api/platform/me`.
- **Super Admin Platform**: `http://platform.localhost:5173/platform/login` (or route fallback `http://localhost:5173/platform/login`); component `PlatformApp`, distinct visual shell, dedicated Platform login `/api/platform/auth/login` and `platform_user_id` session realm. Routes `/platform`, `/platform/businesses`, `/platform/staff`, `/platform/audit`, `/platform/security`; planned-but-labeled navigation slots for Plans, Platform Roles, Device Activity, Settings. Unsupported modules do NOT pretend to be implemented.
- React entry `frontend/src/main.tsx` dispatches at the URL/hostname boundary; the two apps still share the Laravel codebase and PostgreSQL `ahpos_test` development DB, as BluePOS does at architectural level. Production domains (e.g. `app.ahpos.pk` and `platform.ahpos.pk`) are future deployment configuration and **have not been provisioned or tested**. Development `platform.localhost` host is explicitly allowed in Vite; Windows DNS may vary, so path fallback is available.
- `RequirePlatformSession` checks separately logged-in Platform identity and active Platform RBAC on **every Platform request**, sets request-scoped Platform user resolver. All Platform management APIs use `platform.auth` middleware, not `auth` for tenant web users. Platform permission checks still run after Platform auth. Tenant business login `AuthSessionController` demands active tenant membership, clears any prior Platform session, and platform login logs out tenant web session and regenerates session. Platform-only user can never enter POS with Platform permission alone.

## What is Ali? How to eliminate the old mixed login

Old test provisioning `ahpos:provision-test-account` created the local user **Ali** and business workspace **ali** (tenant). The user was initially a **tenant member**, not the vendor Super Admin, and may not have the `Admin Owner` role from modern Platform onboarding. Later `ahpos:bootstrap-platform-superadmin` explicitly gave the same existing user an *additional Platform Super Admin role*. It is **one database user with two separate role assignments**, not two accounts. No stored tenant data is reassigned or deleted in this patch.

**One-time browser-only handover, no ULID or CLI:**
1. Sign into `/platform/login` with the currently bootstrapped, mixed local Ali credentials. This is transitional use only.
2. In Platform → **Admin businesses**, find the existing `ali` row and **Assign Owner**; choose the active Ali member by name/email, confirm. Backend grants Admin Owner role in **that tenant only** and audits it. Skip if an owner already exists.
3. Platform → **Super Admin identity**: enter a new **distinct** email/name, a strong new Platform password, and confirm with current Platform password. Confirm one-time handover. Server transaction creates **a new Platform-only user** (zero tenant memberships), transfers the old user's Platform roles, removes old Ali Platform roles and audits the transfer. It immediately invalidates the old Platform session. No tenant data or membership changed.
4. Sign into Platform using the NEW Platform-only account. Sign into business POS separately as Ali using his old business password. Platform-only login is denied by business POS (403 no active tenant membership); Ali Platform login is now denied (401 no Platform role).
5. Login through `localhost` and `platform.localhost` should use separate host cookies. Within a shared hostname, switching auth realms invalidates the other login to prevent blended sessions. Separate browser profiles may be helpful for simultaneous inspection.

**Never auto-grant a tenant Admin Owner role to every Platform operator** or copy users' passwords/DB data between the two. **No CLI tenant ULID** required. Do not create an additional Super Admin until the one-time handover explicitly succeeds.

## Focused regression tests

- New `PlatformRealmSeparationTest`: tenant session denied at Platform endpoints, Platform login terminates business session, platform identity handover keeps original tenant member/data and removes old platform access, new Platform-only identity denied tenant POS login.
- Updated affected `PlatformOnboardingTest` and `PlatformAssignExistingOwnerTest` to use the separate `platform_user_id` session and enforce missing-Platform-session 401 rather than old mixed Laravel web identity behavior.
- These changes are **source committed but NOT yet run locally**. User can run one focused group after `git pull`, then `npm run build`. No new migration and do not repeat old unrelated tests.

## Production gaps / safety

Separate URLs and session realms are now implemented as code, but this is still an early control-plane pilot. BluePOS has stronger MFA/OTP, session revocation, subscriptions and platform controls; AH-POS does not yet. Proper production separation also needs dedicated subdomains, separate cookie domain/SameSite/HTTPS policies, CSRF, trusted proxy deployment, step-up MFA for platform high privilege, migration/backups, RLS and accounting gates. **Do not assume production-ready just because the UI looks independent.**

## Important deliberate gap versus BluePOS actual model

Inspection of `bluepos/backend/app/Models/Platform/PlatformUser.php` confirms BluePOS maintains a **separate `platform_users` table**, with a `platform` auth guard, PlatformSession model, MFA and security-version/session invalidation. **AH-POS does NOT yet have that physical identity separation.** This batch separates the URLs, React application trees, session keys, route guards, and creates a dedicated Platform-only *user row* in the existing AH-POS `users` table with no tenant membership. That is a real authorization and UX separation, but is **not equivalent** to BluePOS's stronger platform identity/schema isolation. A future additive `platform_users` cutover, dedicated guard/provider, audit/FK transition and session revocation must be designed and migrated with rollback-safe evidence; never conflate this current pilot with BluePOS's mature control plane. Do not claim full production hardening.
