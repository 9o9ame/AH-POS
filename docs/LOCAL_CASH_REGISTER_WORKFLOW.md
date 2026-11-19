# AH-POS cash register and shift closing — local pilot

**2026-11-19 | Source committed, NOT YET locally migrated, tested, or user-verified.**

## Scope

Cashier-specific, warehouse-specific **cash shift** with opening float, attached newly posted cash sales and cash refunds, live expected cash, physical counted cash, and immutable closing snapshot. Closing snapshot computes:

```
expected_cash = opening_cash + linked_cash_sales - linked_cash_refunds
difference = counted_cash - expected_cash
```

All authoritative arithmetic is done by PostgreSQL `NUMERIC(20,4)` via `DocumentMath`; React estimates are display-only.

To avoid rewriting existing immutable `sales`/`sale_returns`, the new migration adds nullable `cash_shift_id` references; every **new** cash sale or return gets attached to the currently open shift for its own cashier and warehouse (if present). Historical/unassigned sales **do not** silently count toward a new shift. Sales and refunds remain permitted in the local pilot without an open shift and will then be unassigned; strict shift enforcement is future production configuration and a release gate.

Opening and closing are separate **append-only** documents. A closed shift cannot be reopened or edited; after closing, a new shift can be opened. Concurrent requests use warehouse and row locks, serialized with transactions, to avoid posted shift documents changing after close. Concurrent opens of the same cashier/warehouse are guarded via warehouse row lock and open-shift check.

**Not a production GL/cash drawer reconciliation.** No physical disbursement, cash transfer/deposit, paid-out, petty cash, tender mix, drawer device integration, shift supervisor approval, branch policy or accounting journals yet.

## Existing Windows local development setup

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=CashShiftWorkflowTest
```

Before migrating confirm `pgsql` / `ahpos_test` at localhost; migration `2026_11_19_000008_create_cash_shift_register` is additive. Do not run `migrate:fresh`, no account recreation, no repeated permission command. The existing explicitly assigned Local Catalog Operator role has the new closed-list cash shift permissions. No repeated `npm run build` while Vite dev HMR is running.

## Browser flow

1. Login and choose `ali` tenant. Create a warehouse if needed (Inventory).
2. Sidebar or Ctrl+K → **Cash Register** → select Main Store, enter opening cash (e.g., PKR 500), open shift.
3. Navigate to **Point of Sale** and make a new cash sale (e.g., Socks qty 1 at its current server selling price).
4. If needed, process a **Sales Return** within the same cashier warehouse shift.
5. Back to Cash Register → Refresh: see linked gross sales and linked cash refunds separately, with expected cash.
6. Count physical cash, enter **Counted physical cash** and optional discrepancy note, then **Confirm and close shift**.
7. Verify new immutable closure appears in **Previous reconciliations** with counted vs expected and variance; reopening the same closed shift is not allowed. A new shift can start afterward.

Prior cash sales and cash refunds in your `ali` tenant remain intact but **will not count toward this new shift**. Do not use a previously posted sale as evidence of session-linked cash unless it was posted after opening.

## Only critical test

`CashShiftWorkflowTest` tests opening, duplicate active shift denial, one sale and partial cash return attached to that shift, expected cash, a shortage at close, duplicate close rejection and immutable read of closed snapshot, using transactions rolled back on `ahpos_test`. It is new and has **not yet been run** by the user. Do not rerun older passing tests without relevant modifications.

## Production release blockers

Finance posting remains restricted by `DocumentPosting::assertLocalOnly` to the local PostgreSQL test database / real test runner. Enabling production needs complete GL/cash accounts, real cash-in/out and settlement, approved stock valuation/COGS, tax and fiscal rules, shift enforcement with branch policies, production RLS non-owner role, audit and backup recovery, printer/UAT and final go/no-go approval.
