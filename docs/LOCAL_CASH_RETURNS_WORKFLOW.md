# AH-POS local cashier returns — pilot walkthrough

2026-11-19. **Committed / not yet locally migrated, tested or browser-verified.**

## Purpose

Reverse all or part of a posted cash sale **without editing or deleting the original**. Each cash refund has its own public ULID, reason, original sale, immutable lines and an append-only positive `sale_return` stock movement in the **original sale warehouse**. Original sale price is server-owned; refund and quantities are recalculated using PostgreSQL NUMERIC. Idempotency prevents duplicate posting.

This is a restricted **local** pilot. No public/staging/production cash refunds are allowed before final accounting, tax, cash drawer and security approval. A refund record alone does not disburse physical cash.

## New Windows PC actions

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=CashReturnWorkflowTest
```

Verify `db:show` still points to local PostgreSQL `ahpos_test` before migration. Migration `2026_11_19_000007_create_cash_sale_returns` is additive. It adds returns/return-lines, foreign keys and a new `sale_return` movement type without resetting old stock or sales. **Never use `migrate:fresh` or re-run the old test account/grant commands.** No repeated production build needed while Vite dev server HMR runs.

## Browser workflow

1. Open AH POS, select `ali` tenant, navigate to **Sales Returns** (also available via Ctrl+K).
2. Choose an existing posted cash sale. Each original invoice line shows product/qty/price.
3. Enter **return qty** for one or multiple items, provide reason, and select **Record refund & restore stock**.
4. Verify success with refund amount and return ULID; inspect the **Recent cash returns** register.
5. Go to **Inventory & Warehouses**. The signed stock ledger shows a new `sale_return` movement and increased available balance in the original warehouse.
6. Go to **Reports**: gross cash sales, cash refunds and net cash sale activity are displayed separately.
7. Repeat the return for the same product only up to its remaining sold quantity. Further quantity is rejected. Replaying an identical request key never adds stock again.

## Safety scope

- HTTP auth → active tenant membership → tenant transaction scope → explicit `returns.read/create` permission.
- Local demo operator role only grants enumerated tenant-level business permissions; normal RBAC remains default-deny outside local environment.
- Each return acquires transaction-scoped idempotency lock, warehouse lock and original-sale row lock, then checks sum of previously returned quantities and refunds. It rejects cross-sale lines, oversize refunds and unknown tenant records.
- Database composite foreign keys tie return, sale and original sale lines within the same tenant/invoice; movement also links to posted refund. Database triggers reject UPDATE/DELETE of posted returns and stock movements.
- Current sale refund is **cash only** with positive stock restoration. Do not record damaged/unrestockable goods through this workflow; non-restock returns require a separate disposition model.
- No GL/cash drawer ledger, tax reversal, fiscal credit note, discount allocation, original COGS reversal, damaged goods workflow or refund-payment gateway exists yet. These are release blockers; neither gross/net pilot reporting nor physical cash handover is a reconciled accounting workflow.
- If testing errors occur, report the **new focused test** output. Do not repeatedly run already passing test suites.
