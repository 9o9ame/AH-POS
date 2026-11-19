# AH-POS Desktop Invoice Workspace — Multi-customer workflow

Updated 2026-11-19. **Source implemented, pending local migration, focused hold test, browser review and TypeScript compile check.**

## Verified baseline

User previously confirmed cash-shift migration complete and `CashShiftWorkflowTest` **PASS: 1 test / 21 assertions** on local PostgreSQL `ahpos_test`. The browser screenshot showed an **open** Main Store shift with PKR 10,000 opening float and the closing form. This does NOT verify a completed manual close or production accounting.

## What changed

AH-POS used full-page React Sales and Purchasing components; this felt like an ordinary website and forced a cashier to leave one cart before serving another customer. The new `TransactionWorkbench.tsx` provides a modal invoice workspace, multiple independently mounted sale and purchase windows, title-bar new/minimize/close actions, and a persistent bottom task dock. The top bar and keyboard open new invoice windows:

- **F2** — open a new Sale window
- **Shift+F2** — open a new Purchase window
- **Ctrl+K** — find a module including Held Bills
- **Bottom dock** — instantly activate/minimize an existing open invoice

Windows are intentionally local to the logged-in tenant/cashier in one browser tab. Every window owns separate product selection, quantities, warehouse, customer/supplier, tender, pending posting key and error/receipt state. Hidden windows remain mounted so drafts do not vanish when switching. Closing an unposted window or switching tenant prompts before discarding unsaved work. Browser reload warns if any unposted window remains; **purchase drafts not saved on server will be lost on reload**.

### Server-persisted Sales: On Hold / Get

Added additive `2026_11_19_000009_create_held_sales` migration with `held_sales`, tenant/cashier scoping, public ULIDs, unique client UUID, JSONB lines and status `held/consumed/discarded`. API checks active membership and explicit permissions; `save` validates product, customer and warehouse ownership; it never reserves stock or posts money/stock.

In a Sale window:
1. Select item(s), customer/warehouse and optionally enter tender.
2. Choose **Hold bill & switch**; save goes to the Laravel database, then the window minimizes.
3. Open **Held Bills** in sidebar or Ctrl+K; choose **Get** to restore. Restored product prices reflect the current authorized catalog, not a client price claim.
4. Edit quantities or tender and complete **cash sale**. Existing `SaleController` validates current stock and server price, posts one immutable sale plus stock movements, and atomically marks its linked hold `consumed`.
5. Same hold cannot create a second sale even with another checkout idempotency key; duplicate HTTP submission with the same key replays the original result.
6. Saved hold may be discarded with user confirmation; the record is marked `discarded` for audit, not deleted.

Holds are **cashier-owned**, not automatically shared across different logins. Different real cashiers should sign in on separate authorized sessions/devices. Unposted holds do not change balances or reserve warehouse stock. Cash shift assignment occurs only when a sale is posted, not when held.

### Desktop invoice vs website

The entire interaction appears in a maximized desktop-style modal with a task dock. Side navigation returns to other business modules without clearing minimized invoices. The design keeps AH-POS branding and styling, not BluePOS proprietary/frozen visual geometry. The `PosPanel` retains a working cashier cart, keyboard barcode entry, stock indicators, cash payment and receipt; `PurchasingPanel` retains supplier, multi-line receiving, quantity/cost inputs and purchase history. Product lookups now use debounced, cancellable server queries to prevent stale results while scanning.

## Local verification (existing database, safe)

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=HeldSaleWorkflowTest
```

Verify `db:show` reports `pgsql`, `ahpos_test`, `127.0.0.1`. Only the new additive migration runs. **Never use `migrate:fresh`, db:wipe, reseeding or test-account recreation.** Previous passing tests need not repeat. Existing Vite `npm run dev` provides HMR, so a production build is generally unnecessary; for a blank screen or TypeScript overlay on this significant refactor, run **one** `cd ..\frontend; npm run build` and provide its actual error.

## Browser smoke, no repeated test suites

1. On selected `ali` tenant press F2 → Sale #1. Add Socks x1, choose warehouse.
2. Press F2 again → Sale #2. Add separate items/quantities. Use bottom dock to return to Sale #1. The first cart must remain unchanged.
3. Press Shift+F2 → Purchase #1, select supplier and add products; switch back and forth using dock. This purchase draft is independent from both sale carts.
4. On Sale #1 choose **Hold bill & switch**. Verify it appears in **Held Bills**. Restore it using **Get** (same logged-in cashier), change item quantity or tender, and post when you intend. The hold should disappear from active list after successful checkout.
5. Check posted sale in history and stock balance in Inventory. Stock availability and price must be rechecked by backend. If insufficient, posting must fail without deducting.
6. Open a new unposted window and attempt closing/switching workspace; verify discard warning. The bottom dock should remain available for minimized windows.
7. Check mobile viewport and keyboard focus. Report any compile/runtime issue without resetting data.

## Boundaries and release blockers

- Sales Hold/Get is persistent **only after an explicit successful server save**. Minimize by itself is not durable. Reopening a new browser tab will not restore unsaved/modally minimized invoices.
- Purchase **modal** drafts remain browser-memory-only; persistent purchase holds/pending invoice workflow is not implemented yet.
- There is currently no stock reservation, real credit invoice, quotation, due payment, discount/tax/wholesale schemes, cash register policy enforcement or multi-device draft live synchronization.
- Browser-side estimates are not authoritative. Backend PostgreSQL NUMERIC money/qty, tenant ownership, inventory availability, idempotency and immutable posted records remain the source of truth.
- POS and purchase financial posting stays **disabled outside local `ahpos_test`** until double-entry journals, cost/COGS layers, tax/fiscal return compliance, non-owner DB RLS, device policies, reconciliation and UAT are accepted.
- No accepted milestone percentage is increased based on committed code alone.
