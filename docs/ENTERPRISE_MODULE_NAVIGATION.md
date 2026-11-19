# AH-POS Enterprise Navigation & Product Master Definitions

Updated 2026-11-19. **Source committed; NOT YET locally migrated, type-checked or browser-reviewed.**

## Objective and basis

User requested AH-POS to match the **breadth and workflow structure** of their BluePOS reference, rather than resemble a small static website. BluePOS provides functional requirements: Definitions, Daily Entries, Reports, Tools, Administration and Help; actual modules within include Products/Tabular View/Categories/Subcategories/Brands/Units/Vendors/Customers/Accounts, Sales Invoice, Quotations, Returns, Purchasing/Orders, Vouchers/Ledgers, Reports, Security and Devices. Source reviewed: `9o9ame/bluepos/BLUEPOS_MASTER_CONTEXT.md` and current state. This is a **workflow mapping**, not a clone of BluePOS UI assets, database or frozen invoice geometry.

## Shell now implemented in source

- `frontend/src/ModuleCatalog.ts`: canonical catalog of six application menu families plus Home, grouped by functional subareas. Includes current verified business module routes and a broad, explicitly planned backlog. Each item has an `Open` route only if there is a real implemented AH-POS screen. Unbuilt features carry `Planned` and are not actionable.
- `frontend/src/ModuleDirectory.tsx`: enterprise module-family main ribbon and searchable grouped landing pages with available/planned counters; family navigation and descriptive task cards.
- `frontend/src/App.tsx`: shared top module ribbon, contextual sidebar submenus, direct existing feature navigation, module explorer. Existing Sale/Purchase multi-window dock persists on returning to other modules. Uses same tenant/session context.
- `frontend/src/CommandPalette.tsx`: Ctrl+K searches the complete canonical module catalog, opening only actual implemented destinations; future modules are visible as disabled `Planned` matches, never fake buttons.
- `frontend/src/styles.css`: original AH-POS navy/teal style, responsive ribbon, subgroup sidebar, detailed module grids. No BluePOS proprietary UI was copied.

## Real Definitions now implemented in source

New additive migration `2026_11_19_000010_create_product_definition_masters.php` creates tenant-owned `product_categories`, `product_subcategories`, `product_brands` and `product_units`, with ULIDs, tenant/code/name uniqueness, active status, and category-owned subcategories. Existing `products` gains **nullable** category/subcategory/brand/unit IDs with composite tenant-safe foreign keys. Existing products, sales and stock ledgers are not reset, changed or re-posted. A database check makes category mandatory if a subcategory is assigned.

`DefinitionMasterController` exposes list/create/status for these four specific master kinds with strict tenant membership/RBAC, ULID-only public interfaces, duplicate checks and parent-category ownership verification. In local test `ahpos_test`, existing `Local Catalog Operator` grants include only enumerated `definitions.read/manage`; real staging/production roles remain default-deny.

`ProductMastersPanel.tsx` includes working tabs, form, parent category picker, active/inactive master records and search. `ProductsPanel` now lets new product records link to optional category/subcategory/brand/unit and shows references in the catalog. Old products remain uncategorized until edited/assigned in a future safe update workflow. **A Unit master is currently a named base unit identity only; secondary-unit conversion factors, price tiers, barcode-to-unit mapping and package stock semantics are NOT implemented.**

## Local verification instructions

Use already configured Windows repository:

```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd backend
php artisan db:show
php artisan migrate
php artisan test --filter=ProductDefinitionMastersTest
```

Before migrating verify PostgreSQL `pgsql`, `ahpos_test` and local host. Migration is additive. **Never** use `migrate:fresh`, reset database, create another test database, re-provision test user or repeatedly run old passing tests.

Because this is a large frontend navigation change, one targeted compile check is useful:

```powershell
cd C:\laragon\www\AH-POS\frontend
npm run build
```

This is **one explicit frontend validation for a major refactor**, not an instruction to build after every small update. Vite HMR normally refreshes browser automatically.

### Browser smoke

1. Open `ali` tenant and observe the new top-level **Definitions / Daily Entries / Reports / Tools / Administration / Help** navigation. Each click shows subgroups and detailed module tiles. Available modules open actual pages. Planned modules are clearly non-interactive.
2. Definitions → **Categories**: create `GRO` / `Groceries`; **Sub Categories**: select Groceries, create `DRY` / `Dry goods`; **Brands**: create a real test brand; **Units**: create `PCS` / `Pieces`.
3. Definitions → **Products**: create a **new** test product and select category/subcategory/brand/unit; verify its catalog row. Existing Socks product must still be present and unchanged.
4. Daily Entries → **Sales Invoice** opens actual multi-window cashier, **Purchase Invoice** opens existing purchase workflow, **Sales Returns**, **Held Bills**, **Cash Register** all remain connected.
5. Reports → **Operations Dashboard** opens actual pilot data; financial reports like Trial Balance and P&L show `Planned`.
6. Tools and Administration show the intended hierarchy but **do not claim** user/role/device/AI/bank/backup functions exist. Ctrl+K search should find both working and planned entries.
7. Verify mobile/narrow viewport and active tenant remains unchanged while switching modules.

One focused `ProductDefinitionMastersTest` checks real tenant-owned category/subcategory/brand/unit, linked product creation, duplicate case-insensitive master, wrong-parent subcategory denial and cross-tenant brand denial. This new test and frontend build **NOT yet executed locally**.

## Production and deadline caveat

The enterprise navigation represents **scope and information architecture, not implemented ERP business capability**. Most master/accounting/admin modules are intentionally `Planned`. Before live launch: chart of accounts, voucher/journal posting, financial balance and stock valuation, tax/fiscal, branch/cash roles, secure device sessions, non-owner production RLS, import reconciliation, backup/restore and real UAT are still separate acceptance gates. Production financial posting is explicitly blocked by existing backend guard. Do not imply that a broad visual menu makes AH-POS production-ready.

Next actual functional batches should deliver accounting master + journal ledger, purchase returns/payables, pricing/taxes/discounts and admin users/roles/devices in milestone priority, with precise scoped implementation rather than speculative placeholder screens.
