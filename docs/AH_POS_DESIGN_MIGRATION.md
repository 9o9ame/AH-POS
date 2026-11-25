# Complete tenant mockup direction / 2026-11-23

## Reference use and current-code boundary
- Inspected `AH_POS_Complete_Tenant_UI_Mockups.zip`: it contains 82 static proposals (70 route mappings and 12 dialog/component previews) plus 10 concept PNGs.
- The archive README warns that sample fields, actions, numbers and route mappings may be illustrative/stale. They are visual references only; local route registries, business components, permissions and APIs remain authoritative. No demo content or disconnected controls were imported.
- Platform Super Admin is intentionally excluded from the tenant style scope.

## Implementation
- Rebuilt the tenant shell composition: branding/home control is now part of the sidebar; the topbar is reserved for authenticated business context, branch/warehouse, real command search, notification, appearance and account controls.
- The sidebar presents all existing command groups together in a scrollable searchable navigation. The existing command registry, handlers, authorization visibility and routes remain in use.
- Added `frontend/src/ahpos-mockup.css` after canonical appearance and tenant styles. It provides the mockups' warm ivory business canvas, charcoal shell, amber brand surfaces, rounded panels, shared field/table treatment and dark-theme variants via existing AppearanceProvider attributes. The saved primary theme still drives focus and selected states; shadow, radius, density and font preferences remain active.
- The topbar search button focuses the actual registry search through a DOM event; no global entity search endpoint or fake result screen was invented.
- No API, backend, database, financial calculation, permission or posting behavior changed. Workspace tabs, contextual commands and the existing module page components are retained.

## Verification
- `cd frontend && npm.cmd run typecheck` — PASS.
- `cd frontend && npm.cmd run build` — PASS; existing mixed dynamic/static import and large-chunk warnings remain.
- `cd frontend && npm.cmd run ui:check` — PASS.
- `cd frontend && npm.cmd run ui:navigation-check` — PASS (pending-data switching and bounded 10,000-row rendering).
- `git diff --check` — PASS.
- Manual visual review of the live tenant app at desktop, tablet, mobile, and dark theme remains pending.

## Files changed
- `frontend/src/ahpos-mockup.css` (new)
- `frontend/src/main.tsx`
- `frontend/src/components/desktop/ApplicationTitleBar.tsx`
- `frontend/src/components/desktop/Ribbon.tsx`
- `frontend/src/layouts/AppShell.tsx`
- `PROJECT_UI_DESIGN_SYSTEM.md`
- `docs/AH_POS_DESIGN_MIGRATION.md`
- `PROJECT_UI_DESIGN_SYSTEM.md`
- `docs/AH_POS_DESIGN_MIGRATION.md`

---

# Tenant 3D visual direction / 2026-11-23

## Reference interpretation
- The supplied videos are visual references for soft 3D/neumorphic surfaces, a raised/inset verification form and glass-like navigation. Text visible in the recordings is reference content, not project instructions.
- The treatment applies to tenant pages and tenant sign-in only. Platform Admin retains its independent appearance.

## Implementation
- Added `frontend/src/ahpos-3d.css`, loaded after the canonical theme and AH-POS styles. It composes existing AppearanceProvider `--ui-*` tokens into raised controls/panels, inset entry fields, a glass-like collapsible sidebar, floating shell bars, refined document tabs, portalled menus/dialogs and tenant sign-in/OTP surfaces.
- Existing radius, density, selected theme, light/dark and animation settings still drive the interface. Fresh appearance profiles default to the existing 3D shadow option; persisted appearance choices are not overwritten.
- Scoped the prior flat shared-face override in `ahpos-structural.css` to authenticated tenant scope, so it no longer changes Platform Admin or conflicts with tenant authentication styling.
- No React business screens, routes, API calls, permission checks, financial calculations, posting behavior, backend or database were changed.

## Verification
- `cd frontend && npm.cmd run typecheck` — PASS.
- `cd frontend && npm.cmd run build` — PASS; existing mixed dynamic/static import and large-chunk warnings remain.
- `cd frontend && npm.cmd run ui:check` — PASS.
- `cd frontend && npm.cmd run ui:navigation-check` — PASS (pending-data switching and bounded 10,000-row rendering).
- `git diff --check` — PASS (Git reports its normal LF-to-CRLF notice for `ahpos-structural.css`).
- Manual owner review of the running tenant shell, authentication, and representative pages in light/dark and responsive sizes remains pending.

## Screenshot refinement / 2026-11-23
- The owner-provided Sales Invoice screenshot showed pale low-contrast topbar metadata, elevated sidebar commands, heavily framed transaction controls and a large unexplained empty table area. The newest tenant stylesheet rules correct those surfaces while preserving the existing entry-grid column/financial geometry.
- The Sales empty-cart area now gives a concise scan/search instruction. It is informational and does not add a disconnected control.
- The notification dialog no longer opens just because the pointer passes over its trigger; click, Escape and outside-click behavior remain.
- Files additionally changed: `frontend/src/components/desktop/NotificationBell.tsx` and `frontend/src/pages/SalesInvoicePage.tsx`.

## Owner contrast and alignment correction / 2026-11-23
- The follow-up owner screenshot showed the 3D shadow mode overriding the charcoal shell with translucent light surfaces, which reduced sidebar and topbar text contrast. The tenant shell is now explicitly kept charcoal in 3D mode; the preference still controls panel/control depth.
- Increased muted text and border contrast, improved legibility of authorization-disabled navigation entries without changing their disabled state, and stabilized five-column topbar sizing at narrower desktop widths.
- No route, component workflow, permission, API, or financial behavior changed. Live visual review after browser refresh remains pending.

## Files changed
- `frontend/src/ahpos-3d.css` (new)
- `frontend/src/ahpos-structural.css`
- `frontend/src/features/appearance/AppearanceProvider.tsx`
- `frontend/src/main.tsx`
- `PROJECT_UI_DESIGN_SYSTEM.md`
- `docs/AH_POS_DESIGN_MIGRATION.md`

---

# AH-POS Design Migration — Batch 01 (2026-11-22)

## Basis and boundary
The owner replaced AH-POS repository contents with the BluePOS working application on 2026-11-22. The commit was inspected in `9o9ame/AH-POS`: the original tenant `routes/index.tsx`, independent `routes/platform.tsx`, `features/workspace/modules.ts`, persistent document tabs, and RBAC handlers remain intact. **Never replace these with the incomplete former AH-POS demo.**

## Visual direction
- AH-POS now uses deep navy/ink chrome, airy business workspaces, fresh teal focus accents, professional typography and structurally distinct tenant/Platform shells.
- Existing theme/primary choices still drive shared `--ui-*` styling and semantic colors; default new preference is Advanced / Inter / Teal, stored independently as `ahpos.appearance`.
- Tenant ribbon, every command group/menu, persistent Sales/Purchase document tab, status bar and notification/device/account entry all remain rendered in the original component tree.
- Platform has its own deep-navy sidebar; the existing permission-filtered Dashboard/Businesses/Plans/Users/Roles/Permissions/Audit/Device Activity/Settings and account menus are retained. No new fake actions.
- Both authentication pages retain MFA/login/reset inputs and logic, but use AH-POS identity and a rectangular split-screen login instead of the inherited round embossed layout.
- Frontend PWA/update banner, `index.html` title and browser metadata, and shared `APP_NAME` now say AH-POS.
- Styling belongs to `frontend/src/ahpos-design.css` imported after canonical appearance, motion and density styles. Do **not** replace canonical components or introduce hidden functionality.

## Actual files edited
- `frontend/src/config/app.ts`
- `frontend/index.html`
- `frontend/src/layouts/AuthLayout.tsx`
- `frontend/src/pages/platform/PlatformLoginPage.tsx`
- `frontend/src/layouts/PlatformShell.tsx`
- `frontend/src/components/desktop/PwaUpdateBanner.tsx`
- `frontend/src/routes/index.tsx` (loading text only)
- `frontend/src/features/appearance/AppearanceProvider.tsx` (defaults and storage prefix only)
- `frontend/src/main.tsx` (one import)
- `frontend/src/ahpos-design.css` (new)
- `PROJECT_UI_DESIGN_SYSTEM.md` (transition rules)
No backend or migration files changed.

## Functional-preservation checks
- `frontend/src/features/workspace/modules.ts` and both route files **not edited** (except splash text in tenant route file).
- `frontend/src/components/desktop/Ribbon.tsx`, `WorkspaceTabBar.tsx`, `ApplicationTitleBar.tsx` and `layouts/AppShell.tsx` **not edited**.
- Real Platform link labels changed only from Tenants to Businesses while route `/platform/tenants` and permission string remain unchanged.
- Application branding name changed in one shared constant; this is not a rename of backend application keys/database.

## User verification
```powershell
cd C:\laragon\www\AH-POS
git pull origin main
cd frontend
npm install
npm run typecheck
npm run build
npm run ui:check
npm run ui:navigation-check
```
Use `npm install` if dependencies were not installed after replacing the source code (React, Vite versions differ from old AH-POS). **Do not run `php artisan migrate` against old `ahpos_test`**; BluePOS has a different schema and DB setup.

Then open tenant login and `/platform/login` with a hard refresh; compare all tab labels, ribbon navigation, controls, modal/dialog overlays and role-filtered links to their pre-redesign functionality. Report output of the build/check commands before marking verified. Build and browser tests were **not executed by the GitHub connector**, so no PASS claim.

## Next batches
1. Login / shell browser acceptance, responsive navigation and overlay layering corrections.
2. Definition masters / global tables / dropdowns / modals — preserve all fields and routes.
3. Sales / purchases / returns / document tab and cashier flows — preserve frozen financial geometry until explicitly approved.
4. Reports/accounting/stock/PWA and all Platform admin details — no loss of export/filters/permissions.
5. Additional AH-POS requirements: tenant-defined Users + Custom Roles + Permissions; tenant-limited legacy migration; platform-controlled AI/WhatsApp and audited device controls. These are separate development tasks, not falsely marked completed.

## Remaining limitations
The full visual conversion of every deep workflow is **not complete**. Initial CSS makes the outer shell and auth materially different, but some inherited internal BluePOS screens/assets still retain their original geometry. Follow-up design batches are necessary; never call this final acceptance.

## Batch 02 / 2026-11-22 — shared shell and controls

### Scope
- Recompose the tenant shell as a branded utility header, a concise accessible ribbon navigation strip, a clearly bounded command workspace, document workspace tabs and a persistent information status bar. Preserve the existing workspace content box geometry for transaction screens.
- Apply a shared token-driven treatment to buttons, text fields, selects, canonical dropdowns, standard tables, modal overlays/headers/footers, and focus/disabled states.
- Refine Platform sidebar width, collapse transition, content padding and card-like navigation surface independently from tenant navigation.
- Keep responsive ribbon scrolling, modal viewport sizing and narrow Platform navigation reachable.

### Preservation
- CSS-only visual changes in `frontend/src/ahpos-design.css`; route registry, ribbon command definitions, permission checks, component tree, API calls, schemas, business calculations and workflow event handlers are unchanged.
- No controls or navigation items were hidden or removed. Existing inactive persistent document tab behavior and permission-filtered Platform links remain owned by their original components.
- AppearanceProvider `--ui-*`, density, radius, shadow, and font tokens remain the styling source for shared components.

### Verification
- `npm.cmd run ui:check` — PASS.
- `npm.cmd run typecheck` — PASS.
- `npm.cmd run build` — PASS; Vite reported existing dynamic-import/chunk-size warnings.
- `npm.cmd run ui:navigation-check` — PASS (pending-data switching and bounded 10,000-row render cases).
- `git diff --check` — PASS.
- Manual visual review of tenant and Platform screens remains for owner acceptance.

### Actual files edited
- `frontend/src/ahpos-design.css`
- `docs/AH_POS_DESIGN_MIGRATION.md`

## Critical design correction / 2026-11-22

### Browser review finding
Owner screenshot review rejected Batches 01–03: they primarily layered CSS over the inherited ribbon and desktop-form composition, so the result remained too familiar to BluePOS. Those batches were implementation attempts, not accepted visual sign-off. The corrected shell and workflow structure below supersedes that presentation direction.

### Structural changes
- Replaced the tenant shell's ribbon tab strip with a collapsible left navigation built from the existing `RIBBON_TABS` and `RIBBON_GROUPS` registries. The sidebar searches module, group, shortcut, and nested-menu labels; it renders through the existing `RibbonCommand`, preserving permission/entitlement checks, menu behavior, action callbacks and multi-instance opening rules.
- Added a context command bar from the active module's existing registry group; composed the current tenant, the existing authenticated branch switcher, current warehouse context, notification/account controls and document tabs into the new shell.
- Reorganized the shell into top application bar, sidebar, contextual command bar, persistent workspace tab strip, content area and status bar. Responsive layout changes the sidebar into an in-flow compact navigation region.
- Rebuilt the Sales Invoice parent layout with a document/status header and a distinct transaction region separating the existing sales entry/grid area from its existing payment summary. The business grid implementation, columns, calculations, Amounts controls, keyboard/scanner logic and action handlers are unchanged.
- Rebuilt Quotation / Estimate composition with a document header/action bar, Create/Search navigation, separate document and customer/pricing cards, a product-lines workspace, and independent notes and quote-summary panels. Existing save/search/print/convert/refresh/close callbacks and entry grid are retained.
- Added `frontend/src/ahpos-structural.css` after the earlier transition stylesheet; structural UI is now expressed in JSX wrappers and new shell components/classes, not only in `ahpos-design.css`.

### Context selector boundary
The existing code provides an authenticated branch switch API/UI. Tenant is fixed by the authenticated membership and no tenant-switch endpoint exists; the session warehouse is displayed as authorized context and there is no global warehouse-switch endpoint/component. These are intentionally contextual readouts; no disconnected tenant or warehouse selector was fabricated. Existing purchase/return document warehouse controls remain unchanged.

### Preservation audit
- `frontend/src/features/workspace/modules.ts`, route registrations, API modules and backend files are unchanged.
- Navigation continues to use the full existing command registry and the original permission/entitlement-aware `RibbonCommand`; route and business handlers remain connected.
- Existing `WorkspaceProvider` and `WorkspaceTabBar` tab identity, dirty state, close confirmation and multi-instance route identity remain in use.
- Sales and quotation line entry continues to use the original data/grid components; only containing JSX and presentation have changed.

### Verification and acceptance
- `cd frontend && npm.cmd run typecheck` — PASS.
- `cd frontend && npm.cmd run build` — PASS; Vite reported the existing dynamic-import/chunk-size warnings.
- `cd frontend && npm.cmd run ui:check` — PASS.
- `cd frontend && npm.cmd run ui:navigation-check` — PASS (pending-data switching and bounded 10,000-row render cases).
- `git diff --check` — PASS (Git reported its normal LF-to-CRLF notice for `Ribbon.tsx`).
- Static parity audit confirmed route registrations, command registry, API modules and backend files are unchanged. The only backend worktree difference is the pre-existing `backend/composer.lock` change, excluded from this batch.
- Manual screenshot review of the new authenticated shell, Sales Invoice and Quotation at desktop/tablet/mobile sizes remains pending owner acceptance.

### Actual files edited
- `frontend/src/layouts/AppShell.tsx`
- `frontend/src/components/desktop/Ribbon.tsx`
- `frontend/src/components/desktop/ApplicationTitleBar.tsx`
- `frontend/src/components/desktop/WorkspaceTabBar.tsx`
- `frontend/src/components/desktop/ModuleCommandBar.tsx` (new)
- `frontend/src/pages/SalesInvoicePage.tsx`
- `frontend/src/pages/QuotationEstimatePage.tsx`
- `frontend/src/ahpos-structural.css` (new)
- `frontend/src/main.tsx`
- `PROJECT_UI_DESIGN_SYSTEM.md`
- `docs/AH_POS_DESIGN_MIGRATION.md`

## Batch 04 / 2026-11-22 — shell and Products workspace correction

### Findings from the rejected browser review
- The prior shell had redundant tenant context in the active-workspace title, an expanded sidebar wider than requested when collapsed, and hid a titlebar control at the narrow breakpoint.
- Products Definition still rendered a vertical image/action rail next to a narrow legacy form and an unbounded catalog area. Five successive page stylesheets layered conflicting visual overrides over that markup.

### Structural changes
- Tightened the application header to show the active workspace once, set the collapsed navigation rail to 68px, and restored the titlebar control at mobile widths. Sidebar command scrolling remains isolated from the workspace content scroll.
- Removed duplicate presentation of the active module's command group: it remains in the contextual command bar while the sidebar keeps the other groups; navigation search still indexes the complete registry.
- Replaced the Products Definition rail with a page header and a wrapping, horizontal action bar. Added a clear New action while keeping existing Save, Refresh, Delete/Activate, Close, Barcode Print, and Current Print handlers and shortcut hooks intact.
- Rebuilt product content into a responsive editor/catalog split. Product Identity now includes the existing upload/preview/remove control; Classification, Units/Pricing/Inventory, Product Settings and Barcode Management are sectioned within the editor. The catalog has a headed panel, category/search filters, virtualized selectable rows, empty/loading states and its existing record count/sync status.
- Added shared `PageLayout` primitives (`PageHeader`, `PageToolbar`, `ContentPanel`, `FormSection`, `ResponsiveSplitLayout`, `PageActionBar`) and used them in Products. These are compositional layout helpers; field state and business behavior remain in the product page.
- Replaced the Products page's five imported legacy visual layers with `ProductsPage.ahpos.css`. Common button, dropdown, panel and table token faces now use flat surface values while retaining the selected AppearanceProvider theme, density and radius settings.

### Preservation audit
- Product identity/classification, supplier/company, units, location, barcode group, rates/margin, stock/reorder, supplier code, discontinued/tax/packaging/free quantity, multi-barcode, image upload/removal, opening balance and reserved product-usage tab remain present.
- Existing product query/cache, row selection/double-click, lookup, validation, save/deactivate/reactivate, pricing/barcode save, scanner, image upload, printing, opening-balance draft/post, permission gates, route and API behavior are unchanged. F8/F9 workspace hooks and the existing F1 tab behavior remain; the action bar labels remain visible.
- Tenant route registrations, command registry, APIs, backend, database and inventory/accounting rules are unchanged.

### Verification and acceptance
- `cd frontend && npm.cmd run typecheck` — PASS.
- `cd frontend && npm.cmd run build` — PASS; Vite reported its existing dynamic-import and large-chunk warnings.
- `cd frontend && npm.cmd run ui:check` — PASS.
- `cd frontend && npm.cmd run ui:navigation-check` — PASS (deferred data, tab switching and bounded 10,000-row render cases).
- `git diff --check` — PASS.
- Static parity audit: route registrations, command registry, APIs and backend are unchanged. Old Products page stylesheets are no longer imported; the replacement page stylesheet is the sole Products-specific visual layer.
- Browser screenshot review of the shell and Products workspace at desktop/tablet/mobile sizes remains pending owner acceptance; automated checks do not constitute visual approval.

### Actual files edited
- `frontend/src/ahpos-structural.css`
- `frontend/src/components/desktop/ApplicationTitleBar.tsx`
- `frontend/src/components/ui/PageLayout.tsx` (new)
- `frontend/src/components/ui/PageLayout.css` (new)
- `frontend/src/pages/ProductsPage.tsx`
- `frontend/src/pages/ProductsPage.ahpos.css` (new)
- `PROJECT_UI_DESIGN_SYSTEM.md`
- `docs/AH_POS_DESIGN_MIGRATION.md`

## Batch 03 / 2026-11-22 — core POS workflows

### Module changes
- **Sales Invoice:** gave the invoice header/options, scanner strip, footer navigation, action row, and payment surfaces the AH-POS token treatment. Preserved the approved editable sales grid geometry and Amounts layout.
- **Purchase Invoice:** clarified supplier/invoice, GST, charges, items toolbar, totals, and payment panels using shared surfaces and semantic action tokens. Kept the specialized purchase entry grid and all column controls intact.
- **Sales Returns:** restyled the view bar, source invoice chooser, return options, amount summary, editable rows, and settlement/action surfaces.
- **Purchase Returns:** aligned source purchase, supplier/warehouse, amount summary, editable entry, search, and action surfaces with the same workflow language.
- **Sales Quotations:** changed the entry/search view selector from a vertical rail to a horizontal, scrollable workspace bar and refreshed header/totals panels.
- **Purchase Orders:** changed entry/search/status navigation to a horizontal workspace bar and refreshed options, search/status panels, footer, and totals.
- Responsive rules retain access to every tab, field, column, shortcut, command, and action.

### Preservation boundary
- Batch 03 edits are scoped CSS plus this migration record. No React handlers, component markup, route definitions, requests, permissions, formulas, posting transitions, or tenant scoping were changed.
- Multiple document instances continue to use the existing workspace-tab provider and route behavior.
- Sales Invoice line grid column/row geometry and Amounts layout remain unchanged. Existing specialized Purchase Invoice entry geometry remains intact.

### Verification
- `npm.cmd run typecheck` — PASS.
- `npm.cmd run build` — PASS; Vite reported existing dynamic-import/chunk-size warnings.
- `npm.cmd run ui:check` — PASS.
- `npm.cmd run ui:navigation-check` — PASS (pending-data switching and bounded 10,000-row render cases).
- `git diff --check` — PASS.
- Manual visual review of all six workflows remains pending owner acceptance.

### Actual files edited
- `frontend/src/ahpos-design.css`
- `docs/AH_POS_DESIGN_MIGRATION.md`

## Tenant UI — Product Grids batch 10 (2026-11-24)
- After `redesign/ahpos-complete-ui` synchronized with imported platform fixes (`fd9c5df`), implemented two existing Definition pages: Product View and Product Tabular View.
- Both use grid-first, high-contrast, scroll-owned card presentation and tenant-scoped `ProductGridWorkspaces.css`; top filters and data grids are visually distinct from inherited BluePOS. Floating action bars preserve live handlers, not placeholders.
- Product View retains print-only header, per-column product filtering/sorting, stock price and supply summaries; Tabular View retains bulk Set/Save/Export, required RBAC gates and dirty-state Close confirmation. No backend/data/API changes.
- Header navigation/title policy persists. No duplicate decorative heading was introduced. Screenshot and functional browser acceptance pending.

## 2026-11-24 — Batch 11: actual Products and Product Tabular visual repair
The authenticated screenshots of 4,435 imported products exposed a severe Product Management layout regression (giant unused area and squeezed editor) plus an unreadably dense Tabular View. Actual `/definition/product-view` route resolves to ProductTabularViewPage, NOT the separate ProductViewPage implementation. Batch 11 returns to the approved tenant pattern:
- Products standalone = catalog list only; opening an Add/Edit product uses a real UiModal with all existing operational form fields, actions and inventory/barcode/image sections.
- Tabular View = compact but legible bulk-edit toolbar and consistent high-contrast virtualized rows, with fixed floating Save/Export/Close.
- Top tenant navigation/active title remains in the existing contextual shell; no redundant module heading in the content panel.
- Source branch `fix/products-tabular-structural-11`, browser acceptance pending. Never mistake source-only commits or passing type checks for visual sign-off.

## 2026-11-24 — Batch 12 screenshot follow-up: compact product editor and full-height list
User accepted the general Batch 11 structure but required: denser product Add/Edit modal with fields fully fitting on standard desktop and an undisturbed fallback scrollbar on small screens; Tabular View filters in one compact desktop row; and the 'All products loaded' footer integrated into the table card instead of wasting its own panel. Implemented on `fix/product-modal-tabular-density-12` in `ProductsDirectoryModal.css`, `ProductTabularClarity.css` and `ProductTabularViewPage.tsx`.
The Product modal retains original image chooser, barcode grid, Product settings, Opening Balance tab and bottom actions; native file input is visually hidden but triggered through existing image click target. On desktop the Section grid is dense without removing business labels; on short viewports use local scrolling rather than inaccessible/hidden fields. The actual Product View route continues to use `ProductTabularViewPage`, and status/aggregate footer is now DOM-nested within the grid card. Authenticated local acceptance is pending.

## 2026-11-24 — Batch 13: Product modal layout and nested Supplier popup repair
Owner screenshot revealed that Batch 12 forced an oversized 96dvh modal despite content using only part of height. Fixed structurally at layout level through content-sized dialog, white single-form canvas and subtle dividers (not separate boxed sections), compact 30px input heights, horizontal readable action toolbar, viewport-limited overflow fallback. Supplier popup underneath product dialog was traced to `PartyModal` rendering in the parent component tree at the same `UI_LAYER.modal` z-index while the product editor is a React portal. The vendor modal now portals to body and opts into `UI_LAYER.nestedModal`; quick catalog editors can do the same. Product parent Escape is disabled while child popup is active. Backend and domain data unchanged. Browser validation pending. Branch `fix/product-editor-compact-overlay-13`.

## 2026-11-24 — Batch 14: approved Product modal mockup implementation
The user approved the proposed high-contrast navy-header Product Add/Edit visual mockup and explicitly requested implementation before evaluating. The Product editor now loads `ProductApprovedMockup.css` after earlier styling layers. It establishes a full-width Product Identity section, balanced Classification/Pricing panels, balanced Settings/Barcode panels, stronger label/control alignment, image upload drop target, and readable single-row action footer with safe responsive overflow. This is styling/composition only; Product editing/save/stock/barcode business code is unchanged. Prior nested Supplier/Catalog popup layering remains. Owner authenticated browser acceptance and typecheck still pending.

### Batch 15 — Products list height correction (2026-11-24)
The Products directory now consumes remaining workspace height, nearly touching the shell status footer. Eliminated old bottom blank strip, made grid scroll own its available area and integrated floating actions with the count/status strip in the same card (footer padding prevents collision). Only `ProductApprovedMockup.css` plus handoff/design docs updated; desktop and compact browser review pending.

## 2026-11-24 — Batch 16: Opening Stock and Stock Taking
Following approved full-height Products list styling, the next tenant modules are Opening Stock and Stock Taking. Each list is now a full-height document directory with compact warehouse/status filters, selection and double-click Open, integrated document-count footer, floating New/Refresh/Open/Delete draft/Close. The rich transaction editor remains a dedicated workspace with unchanged posted-state safety, per-line editing and confirmation actions; its Save/Post buttons move from the old header button band into a floating action dock while meaningful document context remains in the header. List and editor footers have been nested in their actual record cards, not styled as independent panels. No duplicated page title. Files: both Page.tsx files and `InventoryDocumentWorkspaces.css`; local check/browser review pending.

## 2026-11-24 — Batch 17: Stock Taking full-size modal
The user accepted Stock Taking list UI but rejected weak contrast and the flat New/Edit screen. Converted only the Stock Taking document editor to a full-viewport real `UiModal` over the existing mounted list, retaining document number, Draft/Posted badge, warehouse/date, editable line grid and stock posting controls. High-contrast navy/blue/white palette, legible inputs, amber Draft/green Posted, green Save/amber Post, full-height list scroll. Product lookup uses additive optional modal-layer z-index so that lookup isn't obscured. Unsaved-close confirmation and existing mutations remain untouched. Files: `StockTakingPage.tsx`, `StockTakingModal.css`, `ProductLookupGrid.tsx`. Source committed; authenticated browser review pending.

### 2026-11-24 — Batch 18 Stock Taking editor field cleanup
Owner's screenshot showed double nested field/border inside Product combobox and excessively tall row controls in the new Stock Taking modal. Fixed root CSS specificity in `StockTakingModal.css`: outer combo trigger owns exactly one border and focus; nested search input is transparent and borderless, the arrow button is neatly docked at right; row cells use compact padding, ~33px saved rows and ~39px entry row. No functionality or API changed. Browser review pending. Branch `fix/stock-taking-row-dropdown-18`.

### 2026-11-24 — Batch 19: global toast semantics and Web Audio feedback
Screenshot/owner feedback found errors acoustically silent and Success vs Error toasts too similar. Implemented shared typed Success (green ascending), Error (red low falling), Warning (amber double ping), Info (blue short cue). Scoped color overrides follow a legacy universal `!important` background rule which previously neutralized severity. Browser audio unlock occurs on user gesture and sound playback may still be restricted by tab/browser, while visual/ARIA notices never depend on sound. Stock Taking invalid product/qty notices reclassified from Info to Warning. Files `FeedbackProvider.tsx`, `feedback.css`, new `feedbackSounds.ts` and `StockTakingPage.tsx`. All business code untouched; verified only as source committed, browser acceptance pending.

### 2026-11-24 — Batch 20: Stock Taking list Notes vs line notes, post-close, audible notifications
The Stock Taking 'testing' remark was entered in a **product row**, while the old list Notes column showed only document-level notes. Code and backend `SaveStockTakeDraftAction` distinguish them and preserve both separately. To avoid misleading display for multi-line documents, removed list Notes column but retained per-line Notes controls and persistence. After successful server Post the Stock Taking modal closes and updated list remains. Feedback sound implementation now uses actual committed local MP3s per outcome with a louder synthesized fallback; sound remains subject to Chrome/OS tab muting and gesture/autoplay restrictions. No backend/domain modifications. Branch `fix/stock-take-post-notes-audio-20`. Authenticated local tests pending.

## 2026-11-25 — Batch 21 direct UI branch; Opening Stock and Barcode Printing
No more feature/fix branches: the two approved branches are `main` and `redesign/ahpos-complete-ui`. Opening Stock document editor now opens as a canonical `UiModal` on top of the still-mounted list and uses high-contrast navy/steel-blue grid, meaningful record context, product lookup dropdown at modal layer, integrated lines footer and floating transaction buttons. Existing server-driven posting and unsaved close protection preserved; confirmed Post returns to the document list. Barcode Printing now uses modern tenant-only two-pane settings/preview and auto-fill queue surfaces; the old handlers, print preview, settings dialog and browser printer limitations are intact. Source committed, local browser checks pending.
