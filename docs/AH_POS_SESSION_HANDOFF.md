# AH-POS — Tenant UI Session Handoff

_Last updated: 2026-11-24. Keep this file current after every mockup implementation batch._

## Mission / user's acceptance criteria
- Transform AH-POS tenant-side screens so they are not visually recognizable as the inherited BluePOS UI.
- Existing business logic, APIs, tenant isolation, permission checks, financial/posting behavior, scanner/keyboard handling and registered routes **must not be removed, hidden, bypassed or fabricated**.
- Small batches (2–4 screens), direct GitHub commits by assistant, owner merges into local `redesign/ahpos-complete-ui` branch and runs browser acceptance.
- Never suggest `npm run dev`: user already runs Vite in another terminal. Only suggest `npm run build` on significant changes. Routine checks: `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check`.
- User has unrelated local `backend/composer.lock` and TypeScript build cache. Do not overwrite/stage either.

## Approved direction
- Clean dark, opaque, legible tenant shell; sidebar expands/collapses on hover with smooth timing, dropdown groups expand on hover and preserve keyboard/touch.
- Definition masters: **one list card per page**, no inline add/edit form, Add/Edit modal, floating actions at bottom-right, record grid scrolls inside card only, no duplicate page heading or records counter.
- Read-only modules retain their actual read-only purpose; no invented Add/Edit or unsupported APIs.
- Strong contrast and compact information density; no pale washed-out text or unnecessary empty blocks.
- Modal Save/Cancel, validation, existing permissions and shortcuts must continue to work. Reuse shared UI elements and existing hooks.

## GitHub branch history / merging
- User's working local branch: `redesign/ahpos-complete-ui`. It contains commits not yet available on GitHub's corresponding remote branch; do not reset hard or overwrite local history.
- Implemented and sent for merge: `design/mockup-implementation-batch-01` (Categories, Brands, Units); `design/mockup-clarity-batch-01-fix`; `design/master-modal-fab-batch-02` (plus Subcategories); `design/master-list-scroll-cleanup-03` (no duplicate titles and card-only scrolling).
- Sidebar hover branch: `design/sidebar-hover-navigation-04`. TypeScript `inert` issue and faster-than-desired animation corrected in `fix/sidebar-slow-transition-ts-05`; latest branch includes hover behaviour, 720ms sidebar, 650ms groups, 520ms nested dropdowns, 350ms pointer-leave delay.
- **Current branch:** `design/tenant-schemes-pricelists-06`, based on `design/master-list-scroll-cleanup-03` so it includes prior master-page visual changes. It does not include sidebar hover source (owner merged that separately locally). Merge current branch into owner's local branch; solve any conflicts without destructive reset.

## Current batch 06: implemented in source, NOT YET BROWSER-APPROVED
1. Sale Schemes — real create/edit form moved into `UiModal`, list-only workspace, floating Add/Edit/Deactivate/Refresh/Close. Original `createSaleScheme`, `updateSaleScheme`, `deactivateSaleScheme`, RBAC checks, `fetchProducts`, mode, reward, minimum amount, quantity, date range, stacking options, save flow preserved.
2. Price Lists — read-only table, categories/brands/status filters, server-side paging, CSV export (AH-POS filename), refresh/close floating actions. No mock edit function.
3. Scoped CSS: `frontend/src/pages/TenantDirectoryPages.css`. Form remains scrollable inside modal and records inside PosDataGrid, with no outer page scrolling.
4. Docs updated: `PROJECT_UI_DESIGN_SYSTEM.md`, `docs/AH_POS_DESIGN_MIGRATION.md`, `docs/AH_POS_MOCKUP_IMPLEMENTATION_BATCHES.md` and this handoff.

## Verification owed by owner
Run only:
```powershell
cd C:\laragon\www\AH-POS
git fetch origin design/tenant-schemes-pricelists-06
git merge --no-edit origin/design/tenant-schemes-pricelists-06
cd frontend
npm run typecheck
npm run ui:check
npm run ui:navigation-check
```
Manual routes:
- `http://localhost:5173/definition/sale-schemes` (confirm actual app route before using; navigation registry is authoritative).
- `http://localhost:5173/definition/price-lists` (confirm actual app route before using).

Test create, edit, save, cancel, reward-product dropdown above modal, date range, stackable, deactivate and permissions; Price Lists filtered CSV and paging; cards scroll internally, modal accessible, sidebar hover unaffected. Avoid destructive database actions; use test tenant records only.

## Status / next action
- No GitHub connector ability to execute local frontend checks or authenticated browser tests. Commit confirmed but local typecheck, UI guards and browser acceptance are pending.
- Review owner's logs/screenshots; fix bugs on own GitHub branch and give merge instructions.
- Next: pick 2–4 **actual** remaining tenant screens by inspecting current route registry/components, prioritize Definition masters. Do not call read-only price lists editable, and do not assume old BluePOS docs are current AH-POS truth.


## 2026-11-24 — Permanent header/navigation correction (pending owner browser acceptance)
Owner reported regression in screenshots: Sale Schemes/Price Lists again gained decorative in-card titles, and contextual module commands sometimes appeared on right instead of left. Owner confirmed permanent rule for **every tenant module**:
1. Module command buttons/navigation always LEFT in contextual bar (scroll only within left commands region if needed).
2. Current active workspace/tab title and its module/breadcrumb context always RIGHT, using existing workspace state/registry.
3. No redundant module/page titles, description, decorative counts or duplicated headers inside list/content cards. Keep meaningful form labels, date/document identifiers, filters, toolbars and status/action controls.
4. All future screen batches must follow the one-title contract and must update this handoff file alongside design docs.
5. Do not hide functional elements to achieve layout; CSS should only suppress known decorative duplicate headings and pages should be updated structurally when migrated.
Implementation: `fix/tenant-context-bar-left-nav-07` branches from the current structural shell `redesign/ahpos-complete-ui`, updates `ModuleCommandBar.tsx` to render commands first, context last and adds `ahpos-context-bar.css` with constrained flex ordering and known master directory deduplication. That code branch contains no Sale Schemes/Price Lists implementation; user already merged `design/tenant-schemes-pricelists-06` locally.
Handoff documentation fix is on this separate branch `docs/tenant-header-handoff-07`, based on `design/tenant-schemes-pricelists-06`. User must merge both non-destructively into local `redesign/ahpos-complete-ui`. Do not reset, cherry-pick or overwrite local unpublished code.
Local verification pending: `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check` and browser tabs Categories, Sale Schemes, Price Lists, Stock Taking; confirm left module commands, right context title, no duplicates in card, no lost actions. No authenticated browser verified through GitHub connector.


## 2026-11-24 — Duplicate headings removed in JSX (fix/tenant-header-one-title-unified-08)
- Visual rejection: context navigation was unchanged because local `docs/AH_POS_DESIGN_MIGRATION.md` had an unresolved merge conflict. Git refused subsequent merges; passing `typecheck` and navigation guards tested OLD code only.
- Corrected Categories/Brands/Units shared `CatalogMasterWorkspace.tsx` and `SubcategoriesPage.tsx` to remove repeated directory headings and descriptions in JSX, retaining counts, search, filters, grid and FAB.
- Corrected `SaleSchemesPage.tsx` and `PriceListsPage.tsx` to remove in-card page title/description and decorative counters in JSX; business fields and list data untouched.
- The shell layout fix is independently committed on `fix/tenant-context-bar-left-nav-07`; it must be merged AFTER resolving the user's existing pending merge. Browser status remains unverified.
- Permanent policy: LEFT contextual commands, RIGHT active tab identity, no duplicated module titles within card. For future pages change markup, not just cosmetic CSS. Do not remove business document identifiers or form section headings.
- Safe local conflict strategy: preserve user's in-progress design migration content (`git checkout --ours docs/AH_POS_DESIGN_MIGRATION.md`) then `git add docs/AH_POS_DESIGN_MIGRATION.md` and `git commit --no-edit`. The incoming batch's design log details are also available in this file and `docs/AH_POS_MOCKUP_IMPLEMENTATION_BATCHES.md`. Never reset hard/abort other code blindly.

## 2026-11-24 — Tenant Product Grids batch 10 (source committed, browser pending)
- Git synchronization confirmed: local `redesign/ahpos-complete-ui` merge `fd9c5df` pushed successfully, working tree clean, `npm run typecheck`, `npm run ui:check`, and `npm run ui:navigation-check` passed **before this batch**. Main's local tenant import fix already included in the UI branch; do not touch platform import APIs or queue behavior.
- Implementation branch `design/tenant-product-grids-10` based directly on `redesign/ahpos-complete-ui` at `fd9c5df`.
- Two Definition screens: `ProductViewPage.tsx` and `ProductTabularViewPage.tsx`, plus `ProductGridWorkspaces.css`. Modern opaque top filter surfaces, distinct scroll-contained data tables, strong ink/contrast, product detail cards, modern status/totals footer, floating actions.
- **Product View:** Refresh and Preview moved to floating toolbar, retains existing filters (Having Balance, Active Only, Less than Reorder, single-barcode row), search, per-column filters and sort, virtualized table, stock/price side information, current print handler; print-only header remains permitted, no in-card duplicate heading shown on screen.
- **Product Tabular View:** Save, Export CSV and Close moved to floating toolbar. Bulk field selector, Set Text formula, Set, Refresh, full filter/selection/update/cached product behavior unchanged. No new invented edit APIs, no backend or data changes.
- Permanent approved shell rule applies: left contextual navigation, right active tab title, no second duplicate title inside card. Do not add page-level scroll; table/grid itself handles overflow. All commands must remain keyboard/reachability accessible.
- **Validation owed:** GitHub source committed, local TypeScript/navigation guards and authenticated browser behavior not executed by connector. Owner to merge branch and run `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check`; no need `npm run dev` (already running) or routine `npm run build`. Test filters, column sort, selection, prices, stock permission, export file, bulk Set/Save, Refresh, Close, print preview, mobile/desktop, horizontal table scrolling.
- Next select two related Definition screens based on live repo after owner approval; print safety and no lost functionality remain hard acceptance gates.

## 2026-11-24 — Product UI visual rejection + structural correction (Batch 11)

**User screenshots rejected the previous Batch 10 design.** Two actual routes reported:
- `/definition/products`: Products editor compressed into a narrow region, giant blank central panel, catalog on far right. The standalone screen should be a full-width catalog with an Add/Edit **real modal** and floating actions.
- `/definition/product-view`: renders `ProductTabularViewPage` (despite route title `Product View`); tiny blue-legacy grid, squashed dropdowns and weak spacing. Do NOT confuse with the separate `ProductViewPage.tsx` component. Prior batch reviewed the wrong route mapping; new changes target the actual loaded component.

**Branch:** `fix/products-tabular-structural-11` based on `design/tenant-product-grids-10`. The owner has already fast-forward merged Batch 10 locally and reports `typecheck`, `ui:check`, `ui:navigation-check` PASS on that older (visually rejected) code.

**Implementation:**
- `ProductsPage.tsx`: reuse one shared JSX editor, actions and product list; on standalone route show full-width catalog only with category/search, selected-row edit, floating Add/Edit/Refresh/Close and real portal-backed `UiModal` for all existing product sections. Preserve embedded mode for workflows that embed the product editor. Save success closes standalone modal; existing product APIs, barcode scanner and domain inventory flows unmodified. Original product status retained in dialog title. Nested dropdowns use `UI_LAYER.nestedDropdown` to remain visible above the modal. Product list row double-click opens Edit; single click selects.
- `ProductsDirectoryModal.css`: independent list card, internal grid scroll, modal with responsive full-width two-column field sections and sticky modal action area; no duplicated page header.
- `ProductTabularViewPage.tsx` + `ProductTabularClarity.css`: improve actual route grid readability, search, bulk Set, filters, drop arrows, row height, header, footer and floating Save/Export/Close. Keep virtualized rows, selection/dirty staging, RBAC, formulas and existing export.
- `ProductViewPage.tsx` from previous Batch 10 intentionally not changed by this correction; verify its route separately when requested.
- No API/backend/migration/queue/financial changes.

**Local tests still owed:** GitHub code editing cannot execute user's Windows npm/authorized browser. After merging run `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check`; owner will check Create/Edit modal, image selector, nested category/supplier/unit dropdowns, barcode rows, stock opening tab, Save/Cancel, permissions, keyboard shortcuts, product list rows, Tabular Set/Save/Export, large virtualized scrolling. If type errors or display regressions, fix in a focused follow-up commit before starting next modules. No `npm run dev` (already running); no routine `npm run build`.

## 2026-11-24 — Batch 12 compact modal & Product View single-row controls
Owner's browser screenshots after Batch 11 show correct full-width Products directory and true modal, and a usable Product Tabular grid; **visual acceptance is partial**. Remaining issues owner specifically requested:
- Product Add/Edit modal still wastes space, has tiny/awkward action buttons, extra native image input showing and inner scrollbar. Need fit all functional fields (including barcode section) in desktop modal where screen dimensions permit, with all actions usable. Maintain short-screen scrolling rather than clipping fields.
- Actual `/definition/product-view` (ProductTabularViewPage) filters occupy two rows; make all search/field/Set/Refresh/checkbox filters a single tight desktop row, enlarge table viewport. The 'All products loaded' status line was a separate card; it must be **inside** the same main product list card, with list extending nearly to bottom status bar.

Implementation branch: `fix/product-modal-tabular-density-12`, based on previous `fix/products-tabular-structural-11`.
- `ProductsDirectoryModal.css`: modal grows to width min(1460px,98vw) and 96dvh, reduces header/tabs/section spacing and individual input height to 28px, retains two-column Classification/Units and Pricing layout with Product settings alongside Barcode management (both visible on desktop). Keeps complete settings, barcode controls, scanner, image picker and modal actions; visually hides only native file input, whose accessible image picker trigger remains. Short/lower-resolution devices still scroll content rather than clipping it; no absolute promise of scrollbar-free on every viewport.
- `ProductTabularViewPage.tsx`: physically moved `product-tabular-footer` inside `product-tabular-grid`; not simply a background-color trick.
- `ProductTabularClarity.css`: search, field, Set Text, Refresh/Set, four filters aligned on one compact desktop row at widths above 1370px; responsive wrapping at <=1370px, not hidden. Main grid flexes to available height; footer visually one continuous card and FAB remains reachable. Stats remain displayed on smaller screens.
- **No backend, DB, API, authorization, bulk edit formula, row selection, import or accounting changes.**

Status: source committed on GitHub, user local `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check` and authenticated browser verification still pending for this batch. User's Vite already runs; do not ask to rerun `npm run dev` or routine `npm run build`. Regression tests: 1) Add/Edit modal shows identity, classification, prices, settings, barcodes with no clipping; image picker works, Save/Close/F9, dropdown layers, Stock opening tab; 2) at desktop ~1600px all filters in one row, list nearly to status bar and bottom status within table card; 3) 4,435-row virtual scrolling and Save/Export/Set permissions unchanged; 4) narrow browser retains controls with localized scroll.

## Batch 13 — Product Add/Edit actual visual cleanup and Supplier overlay (2026-11-24)
- Owner rejected Batch 12 modal screenshot: five visually separate boxed cards and excessive blank space below form inside oversized 96dvh dialog; tiny crowded action buttons; 'Supplier +' opens vendor modal **behind** Product modal.
- Branch `fix/product-editor-compact-overlay-13`, based on Batch 12 `fix/product-modal-tabular-density-12`.
- `ProductsDirectoryModal.css`: modal now **content-sized** `height:auto` with viewport max-height, no forced 96dvh. Product identity / classification / pricing / settings / barcodes appear on one clean white surface with subtle section divider lines and two-column layout. Reduced unnecessary card shadows/borders/gaps, readable 30px fields. Footer actions are real horizontal icon+label buttons at 34px with strong Create/Save contrast. Maintains fallback inner scroll when viewport is short or barcode list becomes long, and does not hide any business field or action. Opening Balance retains original content layout.
- `PartyModal.tsx`: existing vendor/customer dialog now portals to `document.body` and accepts optional `zIndex` defaulting to original `UI_LAYER.modal`; this fixes nested component clipping and gives product caller a valid higher layer. `ProductsPage.tsx`: passes `UI_LAYER.nestedModal` while product editor is open, and disables parent Escape handling while nested Supplier/Catalog dialog is active. No vendor APIs or save semantics changed.
- `CatalogQuickEditorModal.tsx`: optional explicit `zIndex` default existing layer, product form passes `UI_LAYER.nestedModal` for nested category, subcategory, brand and unit editors; portalled dropdowns continue to use established nested dropdown layer.
- All backend/DB/import/business logic untouched. Scope: existing product form layout + reusable overlay layering, no destructive operation.
- **Verification:** GitHub source committed, local typecheck/UI checks and actual browser acceptance NOT yet run through assistant. Owner should test Add and Edit product, Supplier '+' appears above product editor, vendor create saves and selects new Supplier, Catalog '+' topmost, Escape closes only topmost dialog, image, barcodes, Save/F9/Close and Opening Balance tab; short viewport retains scroll rather than clipping.
- Owner already runs Vite: do not give `npm run dev` or routine `npm run build` commands. Continue only after batch accepted visually.
