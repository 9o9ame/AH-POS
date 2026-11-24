# AH-POS tenant mockup implementation — Batch 01

## Scope
- Categories: /definition/categories
- Brands: /definition/brands
- Units: /definition/units

## Visual target
Based on the supplied AH-POS mockup ZIP: dark tenant shell (handled separately), warm ivory work surfaces, amber action emphasis, spacious header, KPI count tiles, responsive list/editor split, independent search and status filters, modern forms.

## Functional parity
- Uses existing `useCatalogMasterEditor` for data fetch, save, create, deactivate, activate and permission checks.
- Uses existing `PosDataGrid` for selection and keyboard navigation.
- Preserves `useWorkspaceHandlers` Save (F9) and Refresh (F8), Close, New, Save, and lifecycle controls.
- No backend, database, routes, APIs, accounting, tenancy, financial logic, or platform files changed.
- Record code is read-only when selected; for these three masters the existing API assigns codes on create.
- Search and status filters are client-side view filters; they do not affect saved form values.
- Mockup-only invented features (e.g. bulk actions, import/export, parent category for categories) were deliberately not fabricated.

## Risk and validation
- This branch was built against GitHub main commit `6314d2a`, while the user's newer structural redesign commits are local and not pushed.
- Integrate the branch into the current local redesign branch with a non-destructive merge; inspect any conflicts before continuing.
- Automated build and authenticated browser tests cannot be executed by the remote GitHub contents connector.
- Run the commands below locally, then manually test each screen with records: New → Save → select/edit → Save → deactivate → activate → Refresh → Close and verify F9/F8 and permissions.
- Test desktop 1920/1440 widths, tablet 1024, mobile 390. Check table scrolling, duplicate navigation, focus, labels, clipping and theme handling.
- Existing unrelated `backend/composer.lock` and TypeScript cache must not be staged.

## Local verification
```powershell
cd C:\laragon\www\AH-POS\frontend
npm run typecheck
npm run build
npm run ui:check
npm run ui:navigation-check
cd ..
git diff --check
```

## Next batch
Subcategories, Sale Schemes and Price Lists; inspect the actual handler/field contracts before grouping them into reusable layouts.


## Batch 02 — Master CRUD dialogs and floating actions (2026-11-24)
- Converts Categories, Brands, Units and Subcategories to list-first pages. Add/Edit forms moved into the existing `UiModal`, with prominent fixed floating action toolbar.
- Subcategories retain parent category selection and existing query/mutations. Categories/Brands/Units retain the shared `useCatalogMasterEditor` API and RBAC.
- Adds targeted high-contrast titlebar/BranchSwitcher dropdown styling, correcting visible chevrons without altering switch behavior. Uses `UI_LAYER.modalDropdown` for category dropdown inside the modal.
- No backend, database, finance, routes or API changes.
- Not verified in authenticated browser by the GitHub connector. Local validation: `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check`. Validate modal Add/Edit/Cancel, row select/double-click, filters, activate/deactivate, shortcuts F9/F8 and responsive position.

## Batch 06 — Sale Schemes and Price Lists (2026-11-24)

### Sale Schemes
- Converted into a tenant-only list-first directory with a single scrollable records grid; moved all existing Add/Edit fields to `UiModal`.
- Preserved existing mutation payload, activation state, deactivation confirmation, RBAC checks, reward-product lookup, apply mode, min sale amount, max free qty, optional date range and stackability.
- Reused `UI_LAYER.modalDropdown` for portalled reward/mode dropdowns and F9/F8 handlers.
- Floating actions: Add, Edit selected, Deactivate selected, Refresh, Close. No fake Activate action was added.

### Price Lists
- This is an existing read-only directory, NOT a price editor. It remains list-only with the original server-backed search, brand/category/active-only filters, pagination, CSV export, refresh and close behavior.
- CSV filename now uses AH-POS branding. Floating actions: Refresh, Export CSV, Close.
- No Add/Edit modal or permission bypass invented.

### Scope / files
- `frontend/src/pages/SaleSchemesPage.tsx`
- `frontend/src/pages/PriceListsPage.tsx`
- `frontend/src/pages/TenantDirectoryPages.css`
- Documentation: UI design contract, migration record, handoff.
- No backend, DB migrations, tenant isolation, accounting, financial posting, API or route registry changes.

### Validation gate
GitHub connector can write/check source but cannot run user's authenticated frontend or Windows build. Pending locally: `npm run typecheck`, `npm run ui:check`, `npm run ui:navigation-check`, manual test on both routes. Test:
1. Sale Scheme Add → choose free product + apply mode → enter amounts → dates + stackable → Save → list appears.
2. Select row → Edit modal prefilled → Save → refreshed list. Cancel should not mutate server data; refresh should restore latest persisted values.
3. Deactivate selected with confirmation and permissions; no editable controls for read-only users.
4. Price Lists category/brand/active-only filters, search, Previous/Next, Export CSV (check file and row contents).
5. Scroll only within table; fixed FAB accessible; no duplicate page title. Desktop and mobile.
6. Hover sidebar behavior is a separate branch merged locally by owner; do not overwrite.

### Next
Owner browser acceptance first, then remaining Definition masters and follow-up UI consistency. Do not treat untouched pages as complete.

## Batch 08 — Permanent duplicate-heading removal (2026-11-24)
- JSX structural cleanup (not CSS-only): `CatalogMasterWorkspace.tsx` for Categories/Brands/Units, `SubcategoriesPage.tsx`, `SaleSchemesPage.tsx`, `PriceListsPage.tsx`. All in-card directory titles and decorative subtitles removed. Existing search/filter/status chips/PosDataGrid/FAB/modal/API logic remain.
- Separate shell fix `fix/tenant-context-bar-left-nav-07` renders module command strip LEFT and active tab title RIGHT and scopes persistent layout via `ahpos-context-bar.css`. Merge both branches only after existing local `docs/AH_POS_DESIGN_MIGRATION.md` merge conflict is resolved.
- Typecheck and authenticated browser approval UNVERIFIED by GitHub connector. Previous user typecheck success was against stale local code while merge was unresolved; repeat after applying both changes.

## Batch 10 — Product View + Product Tabular View (2026-11-24)
- Branch: `design/tenant-product-grids-10`, created from synchronized UI redesign commit `fd9c5df`.
- Product View: operational UI moved to compact filter card and detailed list + sidebar, floating Refresh and Print Preview. Existing print view, column sorting/filtering, barcode single-row toggle, stock details, warehouse cache, report totals and permissions preserved.
- Product Tabular View: full-height virtualized product grid with consistent filter/bulk-update surface; original Save/Export/Close handlers relocated to floating actions. Existing draft changes, pricing permissions, formula Set, bulk API mutation, local cache refresh and export retained.
- New `frontend/src/pages/ProductGridWorkspaces.css` uses tenant-only selectors and print overrides to avoid showing floating actions on hardcopy. No functional service/API/schema change.
- Follow-up acceptance: typecheck, UI guard, navigation guard, product data visual review, Set (without Save) staged count, Save permissions, Export correctness, Preview print appearance, scroll with many rows and no duplicate heading. Pending manual browser review.

## Batch 11 — Product visual rejection correction (2026-11-24)
- Actual screenshots showed a broken Products three-column composition and cramped Product Tabular listing despite passing guards. Batch 10 was **NOT visually approved**.
- This batch corrects **Products** `/definition/products` structurally: list-only catalog + floating Add/Edit/Refresh/Close; product identity, classification, pricing, stock, barcode and image controls moved together into a real UiModal, keeping same mutation handlers and optional embedded product editor flow. Preserve duplicate prevention and permissions.
- Corrects **Product Tabular** `/definition/product-view` with readable filter and formula controls, high-contrast virtualized table, scroll within grid, preserved Save/Export/Close and stock visibility. `ProductViewPage.tsx` is NOT this route.
- Files: `ProductsPage.tsx`, `ProductsDirectoryModal.css`, `ProductTabularViewPage.tsx`, `ProductTabularClarity.css` and handoff/design docs. No backend or DB source touched.
- Visual approval + local TypeScript/guard tests pending. Both screens must be browser-reviewed before more Definition/Inventory screens are advanced.

## Batch 12 — Product modal density + Tabular viewport (2026-11-24)
Branch `fix/product-modal-tabular-density-12` based on `fix/products-tabular-structural-11`. This is a screenshot-guided correction, not new business features.
- Product Add/Edit `ProductsDirectoryModal.css`: compact 28px fields, reduced gaps/cards, genuine full-canvas modal, 2-column operational sections, image picker control visually cleansed, actions stabilized at bottom. Keep barcode management and settings fully accessible; small screens use scroll fallback.
- Product View `ProductTabularViewPage.tsx` moves the existing progress/total footer into the *same* `product-tabular-grid` card. `ProductTabularClarity.css` aligns all existing filters/actions into a single row on roomy desktop, conserves vertical pixels, and lets list extend to near status bar. Responsive wrap and horizontal table scroll remain.
- No duplicate content headings; navigation-left/title-right invariant intact. No functional handlers/permissions/data APIs changed.
- Local typecheck, UI/navigation guards and desktop/mobile browser acceptance **pending**.

## Batch 13 — Product editor single canvas and true nested popups
- Branch `fix/product-editor-compact-overlay-13`. Screenshot feedback: previous edit/create modal wasted vertical space and buttons were unreadable. Replaced forced-height multi-card appearance with content-sized light surface and section separators, slightly taller 30px fields, more usable full-width form and proper 34px icon-label action buttons. Screen-height-dependent internal scroll remains as an accessibility fallback.
- Supplier and catalog quick-create popups now use actual nested overlay stacking. `PartyModal` is portal-backed with configurable default-preserving z-index, and product caller opts into nested layer. Product modal's Escape close is suspended while a nested popup is active.
- No product/inventory/vendor/stock transaction handlers, tenant permissions, APIs or DB schema modified. Typecheck/visual testing pending.
