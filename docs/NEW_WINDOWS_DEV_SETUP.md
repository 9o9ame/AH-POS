# AH-POS — New Windows machine developer setup

Updated: 2026-11-19. For a newly cloned checkout. Development only.

## Important
- The previous computer's `ahpos_test` database and accounts are NOT contained in Git; a new clone does not transfer them.
- Use exactly ONE PostgreSQL **test** database on this computer, even when testing several logical tenants. Never point this setup at a production/legacy SQL Server database.
- This is not a production deployment guide. Never expose the local weak-password demo account to the Internet.
- Do **not** run `scripts/bootstrap-backend.ps1`: `backend/` is already committed in the repository.
- Never run `migrate:fresh`, `db:wipe`, `RefreshDatabase` on persistent data.

## 1. Tools and checkout (Windows PowerShell)
Check `php -v` (PHP 8.3+), `composer -V`, `node -v`, `npm -v`, `git --version`, `php -m | Select-String 'pdo_pgsql|pgsql'` and `Get-Service | Where-Object { $_.Name -like 'postgresql*' }`.
Install/fix missing tools before continuing (Laragon is suitable for PHP; PostgreSQL must run separately). For an existing checkout, run:

```powershell
cd C:\laragon\www\AH-POS
git status --short
git pull origin main
cd backend
composer install --no-interaction
if (!(Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
```

If `.env` already exists, **do not overwrite it**, and do not regenerate a used app key. Run `key:generate` only on a newly generated `.env` without a key.

## 2. Create new local PostgreSQL test database
Find `psql.exe` (often `C:\Program Files\PostgreSQL\18\bin\psql.exe`; version/path may differ). The SQL below is for a **fresh machine only**; before creating anything confirm the database/role does not already exist.

```powershell
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
& $psql -h 127.0.0.1 -U postgres -d postgres
```

At `postgres=#` in psql (not PowerShell), check for existing objects first:

```sql
SELECT rolname FROM pg_roles WHERE rolname = 'ahpos_app';
SELECT datname FROM pg_database WHERE datname = 'ahpos_test';
```

**Only if neither exists**, execute:

```sql
CREATE ROLE ahpos_app WITH LOGIN;
CREATE DATABASE ahpos_test OWNER ahpos_app ENCODING 'UTF8';
```

Then in psql: `\password ahpos_app` (prompted twice, no password in chat/history). Exit `\q`.

If objects exist, don't delete or overwrite them; verify what they are and use appropriate credentials. The `ahpos_app` owner is temporary dev-only; production must use a separate non-owner runtime role for RLS.

## 3. Configure local Laravel and migrate
Edit `backend/.env` privately (NEVER commit it):

```dotenv
APP_NAME=AH-POS
APP_ENV=local
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=ahpos_test
DB_USERNAME=ahpos_app
DB_PASSWORD="YOUR_PRIVATE_PASSWORD"
```

```powershell
cd C:\laragon\www\AH-POS\backend
php artisan config:clear
php artisan db:show
php artisan migrate:status
php artisan migrate
```

`migrate:status` may say "Migration table not found" for an entirely empty new DB; `migrate` creates it. Before `migrate`, explicitly verify `db:show` says `pgsql` and `ahpos_test` and contains no unexpected real data. `migrate` adds needed Laravel, tenancy, RBAC and product tables, but does not seed real customers/products/accounts.

## 4. Create an authorized local user and catalog permission
```powershell
php artisan ahpos:provision-test-account
php artisan ahpos:grant-local-catalog
```

First command prompts for a test user's name/email, tenant name, private password. Save its generated tenant ULID. The second asks for the **same email** and ULID and explicitly grants the demo user `products.read` and `products.create` on that tenant only. No automated super-admin elevation is performed. Weak three-character passwords are supported **only** in the local development provisioner; use stronger secrets for anything else.

## 5. Run the application
Use two terminals:

```powershell
# Terminal A
cd C:\laragon\www\AH-POS\backend
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
# Terminal B
cd C:\laragon\www\AH-POS\frontend
npm ci
npm run build
npm run dev
```

Open the exact local URL printed by Vite (usually `http://127.0.0.1:5173/`, or 5174 if occupied). Log in with your private test credentials; select your authorized tenant; product catalog should appear. A 403 on catalog means the local permission grant was not executed for this membership.

If moving existing data from an old PC is actually required, that is a **separate** controlled PostgreSQL dump/restore with provenance and privacy checks, not a git clone; never combine an unverified dump with a newly migrated database.

## 6. Focused verification
Only for the new product module: `php artisan test --filter=ProductCatalogTest` (requires already migrated `ahpos_test`, uses rollback transactions). Run old security suites only when their relevant code changes. Record any migration/build/test errors; do not claim deployment ready from local tests.

## 10-working-day priority (proposed, not a promised launch)
1. Day 1: local development setup, tested tenant login, product catalog create/search.
2. Day 2: customers and suppliers, units/barcodes/pricing, import templates.
3. Day 3: branches/warehouses and controlled opening stock, append-only stock ledger.
4. Day 4: purchase receipt workflow and inventory valuation.
5. Day 5: basic cash POS checkout, discounts/tax/repricing and receipt.
6. Day 6: returns/voids and protected corrections, AR/AP only if capacity.
7. Day 7: cash closing, sales/stock reporting and daily reconciliation.
8. Day 8: targeted end-to-end, tenant/security, printing and backup-restore tests.
9. Day 9: staging deployment, domain/HTTPS/queues, performance and client UAT.
10. Day 10: go/no-go gate, cutover and rollback drill, production ONLY if accepted.

This is a prioritized *minimum operational retail POS*, not a full ERP/AI/WhatsApp/offline/mobile deliverable. Depending on accepted requirements, data migration complexity, tax/fiscal law, payment provider, printer hardware and hosting readiness, production in 10 days may be impossible. No untested financial features should be publicly enabled simply to meet a date.
