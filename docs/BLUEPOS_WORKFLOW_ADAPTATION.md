# BluePOS business workflow reference → AH-POS implementation mapping

Updated 2026-11-19. Reference read directly from `9o9ame/bluepos/BLUEPOS_MASTER_CONTEXT.md`. **BluePOS is a business-flow reference, not AH-POS source database, UI skin or client data.**

The reference Sales Invoice flow includes document header (customer/date/terms), line-entry grid, amount/payment side panel, `On Hold / Get`, keyboard Save/Refresh/Preview/Print and tabs for posted/pending invoices, expenses and product summary. The BluePOS document states its Purchase Invoice and Sales Invoice layout geometry is approved/frozen **in BluePOS**; this does not authorize copying BluePOS branding or UI.

## Mapped now

| Reference concept | AH-POS currently implemented | Not yet implemented |
|---|---|---|
| Multiple customer invoices at counter | Independent in-app Sale modal windows, task dock, rapid switching | Cross-device shared editing and conflict UI |
| On Hold / Get | Authenticated cashier/tenant-held sale in PostgreSQL, resume into invoice, mark consumed atomically with posted sale | Stock reservation, centralized supervisor hold ownership |
| Multiple supplier documents | Independent Purchase windows, multi-line receiving and history | Durable held purchases, full credit terms |
| Product search / barcode | React live search, server tenant search, exact barcode/SKU lookup | Multi-unit barcode mappings and conversion factors |
| Invoice pricing / quantity | Server-only catalog selling price, PostgreSQL NUMERIC totals, real stock-out | Discount, tax, wholesale pricing, schemes and free packaging |
| Cash received / change | Cash tender and change validation on backend, cash-register linked sale if active | Credit card/payables/receivables and GL journal |
| Receipt / posted history | Posted sales history, printable pilot receipt | Fiscal invoice, integrated thermal printer driver |
| Returns | Original-line-linked partial cash refund and positive reversal movement | Tax/COGS reversal, damaged disposition |
| Financial integrity | Posted immutable docs, append-only signed stock ledger, ULID external identity, tenant-scoped RBAC | Production non-owner RLS, full accounting and reconciliation |

AH-POS **does not use the BluePOS database**. Its only development database is local PostgreSQL `ahpos_test`; the old SQL Server backup is a historical reference and will only be reconciled with a fresh authoritative backup at go-live, not copied blindly into new tables. UI stays original AH-POS navy/teal design with desktop-like interaction. Neither reference screenshots nor assumed legacy schema should be treated as tested AH-POS implementation.

## Required continuation

Complete keyboard-heavy POS product grid, separate invoice drafts and supplier purchase holds, payment and customer behaviors, system-wide multi-window manager for approved daily-entry modules, admin RBAC and tenant/RLS gates, offline strategy and final accounting production readiness. Never claim a reference feature exists in AH-POS until implemented and verified locally.
