# AH-POS local operational pilot — purchasing → stock → cash POS → receipt → reports

Updated: 2026-11-19. **Status: committed source, pending local migration, focused test and browser UAT.**

This is not a production-ready accounting/ERP release. User has a local Windows PostgreSQL `ahpos_test` with an explicitly assigned `Local Catalog Operator` test role. New sale/purchase posting is guarded to `APP_ENV=local`, PostgreSQL `ahpos_test`, and local PostgreSQL host; it will **refuse staging and production**.

## Deploy latest source to existing dev environment

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=TradeWorkflowTest
```

Confirm `db:show` reports PostgreSQL `ahpos_test` before migration. The new migration is **additive** for existing accounts/products/customers and creates purchase/sale tables plus a guarded signed stock ledger. It also adds database-level UPDATE/DELETE denial triggers for posted stock movements and transaction documents. Do not run `migrate:fresh`, `db:wipe` or destructive cleanup.

Vite `npm run dev` supports HMR. **No repeated `npm run build` required for normal development**, though a targeted compile may help if the new frontend fails to load.

## First browser smoke flow

1. Log in and select the **ali** workspace.
2. Inventory & Warehouses: create warehouse MAIN if not already present. Add an opening balance for existing Socks if stock is empty; don't post opening stock twice.
3. Suppliers: create one test supplier if not already present (e.g., Demo Supplier).
4. Purchasing: select the supplier, warehouse and Socks; add quantity 5 at demo unit cost PKR 60; record purchase. Check document history and Inventory balance. Purchase posting is transactional and increases the same `stock_movements` ledger.
5. Point of Sale: choose MAIN, select Socks, add quantity 2, enter cash received, complete checkout. Product selling price is always fetched from server. It creates one cash-sale document and **negative stock movement**. Verify stock balance decreases by 2.
6. View sales history, open receipt and click Print receipt. Receipt is a development printout, not a fiscal/tax invoice.
7. Reports: confirm purchase and cash sale counts/totals update; these are operational totals only, not a trial balance or P&L.

The browser only estimates draft totals using JavaScript numbers for user feedback. It does NOT submit authoritative totals. Backend recomputes totals with PostgreSQL NUMERIC, reads product sale price from the tenant's catalog and checks cash and stock server-side. Sale, lines and stock movements commit together in one DB transaction, with tenant membership/RBAC checks and idempotency.

## Scope and known blockers

- **Available in the pilot:** products, customers/suppliers, warehouses, opening stock/inwards, supplier purchase receipt, cash-only sale, stock-out, sale history, receipt preview/print, operations report.
- **Not implemented:** production chart of accounts and double-entry posting; approved cost layers/COGS, tax configuration, GST/fiscal receipts, returns/voids/refunds, purchase payable and payment allocation, branch/cash registers and shift closing, multi-unit conversions, batches/expiry/serial, offline synchronization, production RLS runtime role, production authorization policies, printer-specific driver integration, staged reconciled legacy import and tested backup recovery.
- Stock cost on cash issue is currently a non-valuation placeholder and **must not** be interpreted as COGS or inventory valuation.
- No direct UPDATE/DELETE endpoint exists for posted financial documents. Post-record corrections will require explicit reversal/correction workflows and audited accounting integration.
- Current cashier and purchase product pickers show the first catalog page; search uses server on POS and local first page on purchasing. High-volume catalogs need proper searchable paginated pickers.
- UI is provisional and must be signed off before final release; historical source SQL Server data has not been imported.
- Avoid public deployment or remote access to local test data and demo weak password accounts.

## Critical test gate

Run only the new `TradeWorkflowTest` focused workflow on `ahpos_test` after migrating. It verifies one purchase + repeat submission, one cash sale + repeat submission, server-owned catalog price despite forged client total, stock balance from +5 to -2, oversell denial, and cross-tenant product denial. The test rolls back all temporary rows. Do not claim this test passed until the user provides the result.

For production: finish accounting/tax and approved stock valuation, negative tests under a non-owner RLS DB role, backup/restore rehearsal, client UAT, receipt printer integration, and explicit go/no-go approval. A ten-working-day target is not permission to skip integrity gates.
