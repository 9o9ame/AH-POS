# AH-POS — Independent Visual Design Contract

**Current product is AH-POS.** This repository was intentionally sourced from the working BluePOS codebase; pre-existing component names, UI variables, route IDs and descriptions below are legacy implementation references, **not** permission to reproduce its old look. Preserve their technical meaning while converting the visual identity.

## Mandatory preservation policy
- No changes to the route registry, ribbon command arrays, registered workspace modules, required fields, API requests, tenant/platform auth, permission/entitlement guards or business workflow semantics merely to achieve a visual result.
- **No hiding:** Never use `display:none`, `visibility:hidden`, `opacity:0`, zero dimensions, moved-offscreen positioning, removal of nav controls or changed permission checks to disguise legacy UI. Responsive behavior may reorganize controls but must retain reachability.
- Keep multi-instance sales/purchase tabs, all existing actions, alerts, focus states, document controls, popovers and modal portals operational.
- AH-POS look: premium business workspace with a warm ivory canvas, dark charcoal tenant shell, warm amber brand highlights, clean rounded work surfaces, readable typography and compact operation density. The shell uses grouped searchable vertical navigation, tenant context controls and persistent workspace tabs. The tenant language is distinct from BluePOS's old Windows-style chrome; Platform Admin keeps its independent design and is excluded from tenant theme selectors.
- Use existing `--ui-*` variables and AppearanceProvider for runtime theme/density/primary accent compatibility. `frontend/src/ahpos-design.css` holds transitional shared visual overrides; `frontend/src/ahpos-structural.css` owns the corrected AH-POS shell and the scoped structural workflow compositions. Both are imported after the canonical theme styles in `main.tsx`. Do not add scattered per-page CSS overrides for common visual controls.
- Default new AH-POS users to advanced skin, Inter, teal primary; user-selected settings remain authoritative. Appearance local-storage prefix is AH-POS-specific (not BluePOS).
- Maintain a before/after registry audit of feature navigation as migration advances. CSS must not alter data or auth.

## Design progress
**Batch 01 / 2026-11-22:** tenant/title/ribbon/tab/status chrome; independent Platform header/sidebar; tenant/Platform login visual geometry and brand texts; browser metadata/PWA banner; appearance defaults. Code committed; initial commit notes marked build and browser acceptance unverified. No functions removed.
**Batch 02 / 2026-11-22:** shared tenant shell composition, ribbon/workspace surfaces, status bar, token-driven shared control/table/modal appearance, and responsive Platform navigation refinement. Implementation and verification details are tracked in `docs/AH_POS_DESIGN_MIGRATION.md`. Deeper workflow composition, grids, report viewers, and platform pages remain for later batches.
**Batch 03 / 2026-11-22:** Sales Invoice, Purchase Invoice, Sales Returns, Purchase Returns, Quotations and Purchase Orders received scoped AH-POS workflow styling and responsive tab composition. Sales editable grid/Amounts geometry and specialized Purchase Invoice grid remain preserved. Implementation and verification details are tracked in `docs/AH_POS_DESIGN_MIGRATION.md`.
**Critical design correction / 2026-11-22:** Browser screenshot review rejected Batches 01–03 because their CSS treatment left the ribbon and legacy workflow composition recognizable. This correction replaces the tenant shell's visual navigation structure and restructures Sales Invoice and Quotation JSX. Do not describe the rejected styling-only batches as accepted visual redesign.
**Structural correction implementation / 2026-11-22:** Tenant navigation now renders the existing command registry in a searchable/collapsible left sidebar; contextual commands, tenant/branch/warehouse context, notification/account controls and persistent document tabs are composed in the new top/workspace shell. Sales Invoice keeps its calculations and existing editable grid component inside a new transaction layout. Quotation has a new command/navigation header and distinct document details, line items, notes and summary regions. See `docs/AH_POS_DESIGN_MIGRATION.md` for preservation and verification details.
**Batch 04 / 2026-11-22:** Corrected shell sizing/context redundancy and replaced the Products Definition rail/form/list composition with a responsive product-management workspace. Shared `PageHeader`, `PageToolbar`, `ContentPanel`, `FormSection`, `ResponsiveSplitLayout` and `PageActionBar` primitives provide reusable structure; shared control faces now resolve to flat AppearanceProvider tokens. Product handlers, fields, permission gates, lookup, barcode operations, opening balance and keyboard bindings remain page-owned and unchanged.

**Tenant 3D visual direction / 2026-11-23:** The owner supplied three video references showing soft raised/inset controls, a 3D security form and a glass sidebar. The tenant interface now uses the canonical AppearanceProvider 3D shadow setting as the visual switch, with the new-user default set to 3D. Existing saved theme, radius, density, font, animation and shadow preferences remain authoritative. Shared controls, panels, application shell, portalled menus/dialogs and tenant authentication consume existing `--ui-*` tokens. Platform Admin is excluded. Routes, command registries, page handlers and business workflows are unchanged.
**Screenshot refinement / 2026-11-23:** Tenant topbar contrast and context controls were corrected; sidebar navigation lost the over-raised button faces; the Sales Invoice now has more readable document options, payment summary and actions plus a helpful empty-grid state. Notification popovers open on deliberate activation rather than hover. Sales columns, fields, shortcuts and handlers remain intact.
**Complete tenant mockup direction / 2026-11-23:** The supplied library contains 82 static proposals (70 route previews and 12 dialog/component previews). Its shared warm-canvas, charcoal navigation/topbar, amber identity, rounded card, action-toolbar and data-table language now drives the tenant shell and shared tenant surfaces. The sidebar presents the existing grouped command registry together with the real navigation search. Home branding moved into the sidebar; the topbar now holds business/branch/warehouse context, a real command-search affordance, notifications, appearance and account controls. Static demo fields/actions/data were not copied. Current local routes, authorization, handlers and page-owned financial behavior remain authoritative. See `docs/AH_POS_DESIGN_MIGRATION.md`.

---

# BluePOS Project UI Design System

This file is the single source of truth for BluePOS frontend visual language and reusable UI behavior.

It applies to the React + TypeScript + Vite frontend, including tenant application pages, authentication, platform administration, dialogs, nested dialogs, reports, POS screens, and future modules.

## 1. Core rule

BluePOS uses one design system, not one visual implementation per page.

Page-specific code may control:
- workflow,
- information hierarchy,
- geometry,
- responsive composition,
- business-specific layout.

Page-specific code must not invent a separate visual language for:
- colors,
- fonts,
- control appearance,
- dropdowns,
- dropdown arrows,
- buttons,
- tabs,
- modals,
- shadows,
- radii,
- focus,
- hover,
- disabled states,
- validation,
- loading,
- selected states,
- animation timing.

If a shared BluePOS UI component already exists, reuse it. Do not create a local replacement unless the shared component cannot support the required behavior.

Report viewers: use `frontend/src/components/reports/ReportViewerToolbar.tsx` and its shared stylesheet for Print/PDF, Copy, Text, HTML, CSV export, Search, Zoom, Refresh, Edit Options, and Close. The approved Trial Balance viewer is the visual reference. Individual reports own their data and callbacks; do not duplicate or locally restyle the toolbar. Frozen report layouts and specialized section navigation remain unchanged until separately approved.

## 2. Theme & Appearance is authoritative

Voucher identity is an approved fixed-color exception: Opening amber, Payment
red, Receiving green and Journal indigo. The palette lives in `appearance.css`
as `--ui-voucher-*` tokens. Selected workspace tabs retain that identity; form
headers and table headings use soft versions with contrasting text. The heading
row immediately under workspace tabs follows the selected Primary Theme.
Entry controls keep accessible theme surfaces;
Save/Post/Delete retain their semantic action colors. Ribbon menus use shared
spaced, raised menu rows, with matching voucher badges where applicable. Ribbon
dropdowns stay mounted for smooth hover opening/closing and retain the shared
left-to-right color-fill effect. Keyboard/click navigation remains available.
Workspace tab backgrounds and hover fills belong to the outer tab container.
Report menu items declare a semantic Lucide `icon` and `iconTone` in the shared
ribbon registry; colored icon plates use global semantic tokens. Disabled
reports keep disabled actions and greyscale icons. Do not copy reference-app assets.
Label and close buttons keep transparent faces so the entire tab reads as one
continuous selected/hovered surface, with separate accessible click targets.

All migrated and new UI must respond to the user-selected Theme & Appearance settings:

- Appearance: Light / Dark / System
- Primary Theme: Indigo / Blue / Emerald / Teal / Purple / Slate
- Density: Compact / Comfortable
- Border Radius: Small / Medium / Large
- Card Shadow: None / Soft / Normal / 3D
- Font Family
- UI Animations: On / Off

The runtime source of truth is the appearance provider and root data attributes. Visual code must use the global tokens derived from those settings.

Do not hard-code a primary brand blue, purple, green, radius, shadow, or font in a component.

Semantic colors are allowed only through global semantic tokens:
- success
- warning
- danger
- info

## 3. Canonical token source

Do not create a second token system.

Use the existing global variables exposed through `frontend/src/appearance.css`, especially:

- `--ui-bg`
- `--ui-surface`
- `--ui-surface-subtle`
- `--ui-surface-muted`
- `--ui-text`
- `--ui-text-muted`
- `--ui-border`
- `--ui-accent`
- `--ui-accent-soft`
- `--ui-accent-strong`
- `--ui-success`
- `--ui-warning`
- `--ui-danger`
- `--ui-info`
- `--ui-focus-shadow`
- `--ui-card-shadow`
- `--ui-control-shadow`
- `--control-radius`
- `--panel-radius`
- `--app-font-family`
- `--ui-transition-fast`
- `--ui-transition-normal`

The approved Definition visual baseline also exposes reusable state/face tokens for canonical controls and grids, including:
- `--ui-control-face`
- `--ui-control-border`
- `--ui-control-hover-bg`
- `--ui-control-hover-border`
- `--ui-select-arrow-face`
- `--ui-select-arrow-border`
- `--ui-select-menu-bg`
- `--ui-select-hover-bg`
- `--ui-select-hover-text`
- `--ui-select-selected-face`
- `--ui-select-selected-text`
- `--ui-button-primary-face`
- `--ui-button-success-face`
- `--ui-button-warning-face`
- `--ui-button-danger-face`
- `--ui-button-info-face`
- `--ui-table-header`
- `--ui-table-header-text`
- `--ui-table-border`
- `--ui-row-alt`
- `--ui-row-hover`
- `--ui-selected-row`
- `--ui-selected-row-text`

These tokens are the reusable implementation of the client-approved Definition look. Page CSS must consume them or canonical components rather than copying Definition hex colors, gradients, selected-row styles, dropdown arrow styles, or semantic button faces locally.

Density-dependent font, spacing and control-height variables already exposed by the appearance/density CSS must be preferred over literal values when practical.

## 4. Canonical components

### BluePOS canonical UI vocabulary

When discussing or implementing these patterns, use these exact names:

- **Simple Dropdown** -> `UiSimpleDropdown` (implemented through `UiSelect`).
  Use for ordinary single-value choices such as warehouse, unit, status, order type,
  category, price type and payment method. When searchable, search happens in the
  main trigger field; do not add a second search input inside the popup.
- **Table Dropdown** -> `UiTableDropdown` (implemented through `UiSelect` with
  headed columns). Use for entity lookups such as customer, supplier, salesman,
  account, invoice or other multi-column choices. Search happens in the main trigger
  field; the popup contains headings and result rows, not another search bar.
- **Custom Table** -> `PosEntryGrid`. Use for editable/addable transaction-line
  tables. Modules define their own columns, widths, cells and business behavior;
  the shared component owns table header, borders, row density, numeric alignment,
  entry-row surface and base editor geometry. The approved Sales Invoice table is
  the visual baseline. Empty editable cells are blank unless the workflow explicitly
  requires a placeholder.
- **Simple Table** -> `PosDataGrid`. Use for read/search/report/history/tabular lists
  where rows are displayed or selected rather than edited inline.

Do not recreate these four patterns with page-specific table/dropdown chrome. Page CSS
may control layout and business-specific cells, but not duplicate shared borders,
header faces, row height, dropdown arrows, search placement or base editor geometry.

**Approved exceptions:** Purchase Invoice has specialized approved table behavior and
must not be migrated to `PosEntryGrid` unless explicitly requested. Sales Invoice is
the approved visual reference and should not be rewritten merely to adopt the shared
component.


### Dropdowns / selects

Canonical component: `UiSelect` in `frontend/src/components/ui/UiSelect.tsx`.

Rules:
- use `UiSelect` for user-facing application dropdowns,
- standard `UiSelect` dropdowns are searchable by default; the search field must filter visible options without changing the selected value until the user explicitly chooses an option,
- popup is rendered in a portal so it is not clipped by tables, panels, or dialogs,
- selected, hover, disabled, focus, Light/Dark, radius, shadow, density and animation states come from global tokens,
- nested dialogs must pass a suitable `menuZIndex`,
- use text labels in the popup; never expose internal BIGINT IDs,
- do not add native-select arrow CSS to imitate the canonical dropdown.

Compatibility wrappers such as `BpFancySelect` and `AnimatedSelect` may remain temporarily, but they must delegate to `UiSelect`; they must not maintain independent visual behavior.

Canonical multi-select component: `UiMultiSelect` in `frontend/src/components/ui/UiMultiSelect.tsx`.

Rules:
- use `UiMultiSelect` for user-facing multi-selection instead of native `select multiple`,
- keep the same Theme & Appearance, portal, layering, focus, disabled, density, radius, shadow and animation contract as `UiSelect`.

`UiSelect` supports controlled values and legacy form serialization through `name` + `defaultValue`; do not keep a native single-select only because a form currently uses `FormData`.

Native `select` is permitted only where there is a concrete browser-semantic reason that the canonical component cannot safely provide. It must still use global tokens. Single-value controlled dropdowns should use `UiSelect`.

### Buttons

Canonical component: `UiButton` in `frontend/src/components/ui/UiButton.tsx`.

Legacy wrappers such as `DesktopButton` must delegate to `UiButton` rather than maintaining a second visual system.

Variants:
- default,
- primary,
- success,
- warning,
- danger,
- info,
- icon-only.

Primary follows `--ui-accent`. Semantic variants use semantic tokens.

All buttons must implement consistent:
- focus-visible,
- hover,
- active,
- disabled,
- radius,
- shadow,
- density,
- animations.

### Semantic action button colors

Button background color must communicate the action consistently across pages and modals while remaining soft/subtle rather than saturated.

Canonical action mapping:
- Save / Activate / Post / Approve / Complete -> success tone (soft green).
- Delete / Remove / Void / Deactivate / Reject -> danger tone (soft red).
- Refresh / Close / Preview / Print / Search -> info tone (soft blue/info).
- Hold / Retry / cautionary actions -> warning tone (soft amber).
- New / Add / Create -> Primary Theme tone (soft accent).
- Neutral navigation or non-semantic actions -> default neutral surface.

Rules:
- use `UiButton` semantic variants or shared `data-tone` / `data-action` semantics; do not hard-code action colors locally,
- the same action must have the same semantic tone whether it appears in a page toolbar, modal footer, nested modal, or admin/platform screen,
- semantic action colors must derive from `--ui-success`, `--ui-danger`, `--ui-info`, `--ui-warning`, or the Primary Theme tokens,
- disabled buttons remain visibly disabled and must not look like an enabled semantic action,
- Light/Dark, selected theme, radius, shadow and animations continue to apply.

### Inputs and textareas

Inputs inherit global surface/text/border/radius/shadow/focus/disabled tokens.

Do not create page-specific focus-ring colors.

### Tabs

Tabs may have page-specific geometry but must use global:
- text,
- muted text,
- border,
- accent,
- surface,
- active/hover states,
- radius,
- animations.

Workspace tabs follow the same token contract.

### Tables / data grids

Prefer `PosDataGrid` for standard application data grids.

Custom tables may retain module-specific columns and geometry but must use global:
- header surfaces,
- borders,
- text,
- hover rows,
- selected rows,
- empty/loading states.

### Toggles / checkboxes / radios

Use existing shared controls where available.

Toggle visual tones must use semantic/global tokens. Disabled and animations-off behavior must be respected.

## 5. Modal contract

Canonical standard modal: `UiModal` in `frontend/src/components/ui/UiModal.tsx`.

Specialized draggable or complex nested dialogs may keep their workflow-specific structure, but their visual properties must use the same tokens and overlay-layer contract.

All application dialogs must follow the same modal contract even when their internal layouts differ.

Required behaviors:
- token-based surface, border, text, radius and shadow,
- visible title/header hierarchy,
- keyboard-accessible close action,
- predictable z-index layering,
- nested dialog support,
- no popup hidden behind a backdrop,
- responsive max width/height,
- scroll only inside the content region where practical,
- animations disabled by global Animations Off.

Overlay layers are defined in `frontend/src/components/ui/uiLayers.ts`. Do not invent local numeric z-index values for modals/dropdowns.

Use the closest appropriate `UI_LAYER` constant so dropdown menus always sit above the modal that owns them.

Do not solve modal layering with unrelated page-specific z-index values when a shared modal/dropdown prop can express the layer.

## 6. Nested modal rule

When a module is embedded in another modal:
- keep the same component and workflow,
- use a compact size variant instead of creating a second implementation,
- preserve functionality,
- keep dropdown/menu portals above the nested modal,
- do not duplicate forms or business logic.

## 7. Typography

Font family comes from `--app-font-family`.

Prefer density-aware shared font tokens. Page-specific typography is allowed for hierarchy, not for a separate brand style.

Do not hard-code a different font stack inside module CSS unless required for printing/export.

## 8. Radius and shadow

Do not hard-code decorative border radii or card shadows in new/migrated UI.

Use:
- `--control-radius` for controls,
- `--panel-radius` for cards/panels/dialogs,
- `--ui-control-shadow` for controls,
- `--ui-card-shadow` for panels/dialogs.

The 3D shadow option must work through these same tokens, not through special per-page CSS.

## 9. Animations

Useful animations are allowed:
- dropdown opening,
- caret rotation,
- modal entrance,
- hover transitions,
- expand/collapse.

All such animations must stop when `data-animations='off'`.

Use global transition timing tokens. Avoid new literal timings unless a component has a strong UX reason.

## 10. Focus, hover, disabled and selected states

Every interactive component must have all applicable states.

Focus:
- keyboard-visible,
- uses `--ui-focus-shadow`,
- uses the selected accent.

Hover:
- subtle accent-derived background/border.

Disabled:
- uses muted surface/text,
- clear not-allowed affordance where appropriate,
- no misleading active animation.

Selected:
- accent-derived selected state with readable contrast in both Light and Dark.

## 11. Validation, alerts, feedback

Validation and errors use `--ui-danger`.
Success uses `--ui-success`.
Warnings use `--ui-warning`.
Informational states use `--ui-info`.

Use the existing feedback/toast/confirm system. Do not introduce a second toast or confirm style.

## 12. Responsive behavior

Do not redesign a page merely to make it use shared components.

Preserve intentional module layouts. Shared controls must fit existing responsive containers and must not force desktop-only widths.

Dropdown portals should reposition to remain in viewport.

Dialogs must use viewport-safe max width and max height.

## 13. Frozen / sensitive screens

UI system migration must not change business behavior or financial invariants.

Sales Invoice:
- preserve its approved geometry,
- preserve Amounts layout,
- token changes may affect visual styling only unless explicitly authorized.

The same principle applies to accounting, inventory, posting, payment and stock workflows.

## 14. CSS ownership

Global visual behavior belongs in:
- `frontend/src/appearance.css`
- shared component CSS under `frontend/src/components/ui/`
- existing shared component CSS when the component is domain-neutral.

Page CSS may own:
- layout,
- grid-template geometry,
- widths/heights required by workflow,
- page-only responsive composition.

Page CSS should not redefine the canonical dropdown, button, modal, focus ring, accent palette, shadow system, or theme behavior.

## 15. No local component duplication

Before creating a new UI component:
1. search shared UI components,
2. search shared desktop components,
3. extend a shared component if the behavior is generally useful,
4. create a domain-specific component only when the domain behavior is genuinely unique.

Never create `AnotherSelect`, `SpecialModal`, or page-only arrow styles just to get a different look.

## 16. Modification checklist

Whenever a page or component is created or changed:

1. Read this file.
2. Reuse canonical shared components.
3. Verify Light / Dark / System.
4. Verify all six Primary Themes.
5. Verify Compact / Comfortable.
6. Verify Small / Medium / Large radius.
7. Verify None / Soft / Normal / 3D shadow.
8. Verify Font Family.
9. Verify Animations On / Off.
10. Verify hover, focus, disabled, selected, loading, empty and error states.
11. Verify dropdown/menu z-index inside modals.
12. Verify responsive behavior.
13. Preserve business logic and page-specific workflow.
14. Avoid introducing new hard-coded primary colors or decorative shadows/radii.

## 17. Review rule

A UI task is not complete merely because the requested screen looks correct.

Before finishing, check whether the changed pattern also appears elsewhere. If it does, fix the shared component/token instead of only the current page.

If a local exception is truly required, document why in the code near the exception.

## 18. AI / coding-agent instruction

Any AI or coding agent modifying BluePOS UI must read and follow this file first.

The default decision should always be:

reuse shared component -> extend shared component -> add token -> local exception only as last resort.

Do not rely on conversation memory for UI rules. This repository file is authoritative.


## 19. Repository enforcement

Run the design-system guard before frontend typecheck/build:

```bash
cd frontend
npm run ui:check
npm run typecheck
npm run build
```

`ui:check` currently enforces:
- no raw date inputs outside `UiDatePicker`,
- no raw single/multi `<select>` elements in React TSX; use `UiSelect` / `UiMultiSelect`,
- no known hard-coded Primary Theme colors inside canonical `components/ui` CSS,
- no large numeric overlay z-index values inside canonical `components/ui` CSS.

If a real browser-semantic exception is required, update this document and the checker deliberately in the same reviewed change rather than bypassing the rule locally.


## 2026-10-31 — Shared motion references (user-approved direction)

The seven reference videos supplied on 2026-10-31 establish **animation behavior**, not permission to alter frozen geometry, control sizes, widths, spacing, border thickness, border radius, selected Theme & Appearance palette, data semantics, or workflows.

Shared opt-in motion classes live in `frontend/src/motion.css`, imported once by `frontend/src/main.tsx`. Reuse these on the *existing* canonical components only:
- Real dashboard KPI/chart entry: `bp-motion-enter`, `bp-motion-progress`, `bp-motion-ring`. Animate actual API values; never fabricate historical measurements.
- Notifications and bell: `bp-motion-notice`, `bp-motion-bell` on existing accessible notification components, without replacing their notification/read logic.
- CRUD buttons: `bp-motion-action`, preserving canonical semantic faces and current geometry. The user explicitly wants the reference's action semantics, but fixed hue values must continue coming from `--ui-button-*-face` and `--ui-{success|warning|danger|info}`, never from copied video hex.
- Downloads: `bp-motion-download` with `data-busy` based on the **real export** lifecycle; never report success until the file is actually produced.
- Skeleton loading: `bp-motion-skeleton` on existing-size placeholders, only when a genuine request is loading.
- Single and from/to date controls: `bp-motion-date-cell` on the existing date-picker implementation. Preserve locale, bounds, valid range, keyboard behavior, filtering, and the format currently in use.
- Copy control: `bp-motion-copy` with `data-copied` only after successful clipboard write and accessible status feedback.

Motion must respect `[data-animations="off"]` and `prefers-reduced-motion: reduce`. Use appearance token colors, radius and shadow; animation does not create a second design system. Shared primitives are implemented, but **each workflow integration requires focused inspection and local verification**; these seven items are not all complete merely because classes exist.

## Premium dates, notification stacks and skeletons

- `UiDatePicker` owns single-date and From/To calendars. Keep the native input's
  geometry, props, ISO value, form serialization, constraints and change handlers.
  Use `UiDateRangePicker` for From/To filters: one visible trigger and two native
  form values preserving the original change handlers. Independent dates stay
  single. The user-approved calendar has raised 3D faces using theme colors.
  Calendars render in a portal using the shared overlay layer contract.
- `UiNotificationStack` layers actual notifications with a count and navigation
  dots. Back cards are inert. Navigation never marks security alerts read;
  acknowledging a device alert continues through its existing server action.
  The notification bar shows unread alerts only. Its close cross acknowledges
  through the existing read endpoint; failed acknowledgements leave alerts visible.
- `UiSkeleton` owns the premium avatar, lines and banner shimmer. Its color comes
  from `--ui-accent`, so Theme & Appearance changes update it immediately.
  Use its compact variant for incremental loading; use the card for initial data.
  Render it only while the corresponding request is pending, preserving errors
  and empty states. Both animation preferences remain authoritative.
  Save/post and other blocking mutations retain the original spinner overlay.
  Data skeletons belong only inside the card/table/content region awaiting data.
  Keep module headers, filters and controls visible; do not replace the entire
  workspace with a module-mount skeleton. Persistent document instances retain drafts.
  Register a requested workspace tab immediately, independently of route/data
  rendering. `PosDataGrid` paints its header and local loading region before
  mounting cached rows. Product lists use its existing virtualization so a large
  cache cannot block the first module paint; fetched rows reveal with shared motion.
  Run `npm run ui:navigation-check` to verify tab navigation with a deliberately
  unresolved data request and a 10,000-row cache (requires Edge/Chrome/Chromium;
  `BLUEPOS_TEST_BROWSER` can specify its executable).

## Tenant directory pattern — 2026-11-24 implementation contract
- Definition masters with existing Create/Edit logic must use a **list-only main screen**, existing `UiModal` for Add/Edit and an accessible floating action toolbar; all required form fields remain available only inside the modal, not removed.
- Pure read-only directories (Price Lists) must NOT invent Add/Edit APIs or fake dialogs. Preserve real search/filter/pagination/export behavior and place existing quick actions in a floating toolbar.
- Keep only one page title within a workspace; avoid duplicate contextual heading. The `PosDataGrid` owns record scrolling; the workspace itself should not gain an extra outer scrollbar. Ensure modal dropdowns layer above modal with canonical `UI_LAYER`.
- Shared tenant directory look is implemented in `frontend/src/pages/TenantDirectoryPages.css`, with Categories/Brands/Units/Subcategories using existing catalog master workspace CSS. Never turn this into a global Platform Admin override.
- For each implementation batch update `docs/AH_POS_MOCKUP_IMPLEMENTATION_BATCHES.md`, `docs/AH_POS_DESIGN_MIGRATION.md`, and `docs/AH_POS_SESSION_HANDOFF.md`. Record branch, exact modules, preserved functions and what is still unverified. Avoid claiming complete until owner browser acceptance.

## Permanent one-title tenant rule — 2026-11-24
- Contextual module navigation always LEFT; active workspace/tab title + relevant context always RIGHT, sourced from existing workspace state. CSS/layout must not switch their positions between modules. Implementation: `frontend/src/components/desktop/ModuleCommandBar.tsx` and `frontend/src/ahpos-context-bar.css` on complementary shell branch `fix/tenant-context-bar-left-nav-07`.
- No redundant page/module title or decorative subtitle inside Definition directory/list cards. Categories, Subcategories, Brands, Units, Sale Schemes, Price Lists must begin with functional list controls and data, not another header. Remove duplicate JSX, not just visually hide with CSS. Preserve status chips, search, filters, document identifiers, modal form field labels, actions and table.
- Keep this invariant for all future tenant screen batches; update `docs/AH_POS_SESSION_HANDOFF.md` with acceptance status. Platform Admin remains separate.

## Product information grids — AH-POS approved migration pattern (Batch 10)
- List-heavy Definition screens are a **single filter toolbar/card, a main record grid with internal scroll and a compact metrics footer**, with floating action controls instead of legacy button bands. No duplicated in-card module/page title; shell owns active tab title.
- Product View retains special print-only header and generated report metadata (these are meaningful hardcopy data, not duplicate screen headers). Sorting/filtering and stock permissions stay intact.
- Product Tabular View's editable grid must keep exact bulk-update formula/Set semantics, unsaved-draft Save and Close confirmation, cached catalog and export behavior; only surrounding layout changes.
- Always preserve original handlers, registered commands, keyboard flow, authorization and report rendering, with no fake controls or cross-tenant client trust.
- Batch reference: `frontend/src/pages/ProductGridWorkspaces.css`; source implementation must be tested in authenticated browser before visual approval.

## Product Definition / Tabular View hard rule (2026-11-24)
- `/definition/products` is a *list-only standalone page*. Add/Edit must show the complete product editor in a **real modal**; do not split a 3-column page into skinny editor + blank gap + catalog. Modal requires every existing field, barcode/image, linked category/supplier/price/stock interaction and action/keyboard handler. Preserve embedded Product editor flows that other modules invoke.
- `/definition/product-view` is **ProductTabularViewPage**, a dense bulk-update product spreadsheet. Do not confuse it with `ProductViewPage`. Maintain checked selections, formula Set, dirty drafts/Save, permissions, export and large-row virtualization; improve legibility and layout rather than hiding columns.
- Search and filters immediately above a full-width directory, floating actions at bottom-right, table scroll only within its own card, header navigation left/active tab title right. No second in-card page title.
- Use `UI_LAYER.nestedDropdown` for portalled selects within product editor modal. Never leave dropdowns behind the modal or hide business controls to obtain a screenshot.
- Batch 11 implementation: `ProductsDirectoryModal.css`, `ProductTabularClarity.css`. Authenticated browser acceptance remains mandatory.

## Product density and list-card footer rule — Batch 12
- Standard desktop Product Add/Edit modal should exploit usable width/height. Compact form controls and multi-column sections rather than forcing a vertical scrollbar when screen has available room; **never remove or clip fields** merely to achieve no scrollbar. On short/narrow screens, allow local scrolling.
- Product photo must be initiated through the accessible product-image trigger; native hidden file input should not appear next to the preview icon. Original validation/removal, barcode, prices, opening stock and permission checks remain untouched.
- Product Tabular View search, bulk update selector, Set Text, Refresh/Set and four checkbox filters share **one row when desktop width permits**. Use responsive wrap when necessary rather than hiding actions or overlapping controls.
- The tabular product status footer ('All products loaded', counts, staged/selection/stock summary) belongs structurally within the same list card and list reaches near bottom status bar. Floating Save/Export/Close must remain visible and must not obscure the table or aggregate information.
- Keep render/handlers and virtualized rows unmodified by layout work. Branch `fix/product-modal-tabular-density-12`; local browser review and tests pending.

## Nested modal layering and compact forms — Batch 13
- For nested Product -> Supplier (vendor/account) or Product -> Catalog quick-create, all popups must be rendered above their parent modal using established `UI_LAYER.nestedModal` and `UI_LAYER.nestedDropdown` where relevant. Reusable modals retain default stacking outside nested context. Escape must close only the top dialog rather than both.
- Avoid full-viewport-height forced modals when content fits naturally; use `height:auto` plus accessible `max-height` and local overflow fallback for small viewports. Product Create/Edit fields must remain intact. Prefer one cohesive white form surface with subtle section labels/separators, not five decorative cards.
- Product footer actions use consistent, readable icon + label buttons; no 8px cramped controls or floating overlays obscuring bottom actions. Do not alter product posting logic to accomplish styling.

## Batch 14 — Approved Product Add/Edit mockup is design reference
- Follow the user-approved Product modal visual structure: navy header, concise tab strip, identity section full width including image, two-column classification/pricing, two-column settings/barcodes, visible action footer. Align labels directly with their controls: no huge blank columns, no uneven independent cards. Moderate field height for readability.
- The existing Product Form React controls, `UI_LAYER` nested Supplier/Catalog dialogs, F9/F8/F7 actions, barcode add/delete/unit conversions, image upload and Opening Balance tab **must** remain operational. Do not invent client authority, recalculate finance in frontend, or modify business logic to reproduce a mockup.
- Batch 14 styling lives at `frontend/src/pages/ProductApprovedMockup.css` loaded last and scoped to `.product-definition-modal`; rest of POS / Platform Administration should not inherit these styles. Responsive breakpoint may stack form sections and allow localized scroll rather than hiding fields.
- Use actual authenticated browser screenshots compared to approved design before calling this visually accepted; code submission and typecheck are not visual acceptance.

### Products directory bottom-edge rule — Batch 15
The standalone Definition/Products catalog list should extend to the bottom of the workspace immediately above the application status bar, with no 70px artificial blank gap. Grid scrolling is internal; product totals and status are inside the catalog card's footer. Floating actions occupy reserved right footer space and may not obscure product counts or rows. Compact viewport must preserve scrolling and all actions. See `ProductApprovedMockup.css` Batch 15.

## Batch 16 — Inventory document master/detail pattern
- For tenant inventory **document** modules (Opening Stock, Stock Taking), the main list is a full-height single-card directory: compact real warehouse/status filters, no duplicate module heading, internal grid scroll, record totals inside same card and a dock with genuine authorized New/Open/Refresh/Delete draft/Close actions.
- Operational document editing with a large line-entry grid and irreversible posting is **not** a simple master-data form. Preserve a full-height document workspace for entry, product lookup/scanner, quantity/cost, drafts and posting. Keep document number/status/warehouse/date readable, with integrated line footer and floating Save/Post/Refresh/Close. Do not hide authorizations, stale-stock checks, save-before-post guard or posted immutability.
- Use existing `UiButton`, `PosDataGrid` and `PosEntryGrid` rather than creating parallel data/financial flows. Scroll within the record grid only where possible; responsive narrower widths must preserve all actions, including Post confirmation. Shared CSS is tenant-scoped `InventoryDocumentWorkspaces.css`.
- User has approved Products Batch 15; Batch 16 is source committed only and must undergo authenticated browser review before being called visually accepted.

## Stock Taking document-modal exception (Batch 17)
- Simple Definition masters still use compact Add/Edit modals, but Stock Taking's complex line-entry document can use a nearly full-screen `UiModal` OVER the existing full-height list. Keep original Save/Post, draft confirmation, variance and posted immutability; never substitute a fake screen or hide stock fields.
- Use high-contrast text and surfaces: navy header, dark table header with white labels, white/blue-white alternating rows, visible steel-blue borders, strong blue focused inputs, amber Draft, green Posted. Avoid light-on-light low readability.
- Modal product lookup is portal-backed and must use `UI_LAYER.modalDropdown` to open above parent. Preserve original default lookup z-index elsewhere. Close modal via existing discard confirmation, keep list/active tab visible in the background.
- `frontend/src/pages/StockTakingModal.css` governs this editor only. Require authenticated browser verification before visual approval.

### Stock Taking combobox and density rule — Batch 18
Never style `input.ui-select-trigger-search` as a full standalone field inside `.ui-select-combobox-trigger`. The trigger is the only visible outlined surface; nested input must be transparent, borderless, occupy available width and leave room for the toggler. Preserve outer focus ring, keyboard search/Enter and portalled dropdown above document modal. In Stock Taking editor use compact 29px fields, ~33px saved rows, ~39px entry row; avoid oversized padding. Source: `StockTakingModal.css`, branch `fix/stock-taking-row-dropdown-18`.

### Global feedback contract — Batch 19 (2026-11-24)
- Every action outcome must be communicated through shared `useFeedback()` by **semantic tone**, not one neutral toast: Success green/check; Error red/cross; Warning amber/triangle (e.g. missing required field); Info blue/information. Background, text, border, icon must be distinguishable in light/dark modes; avoid generic `!important` overrides erasing tones.
- Play a unique **short, non-startling** locally generated sound for each tone. Audio respects browser gesture/autoplay restrictions; never let failed audio stop UI or business actions. Avoid repetition storms via sound cooldown. ARIA text/visual color/icon must always work even when sound is blocked. New `feedback.warning` is available for form warnings.
- Don't use error sound for neutral routine statuses or success for invalid inputs. Use existing `feedback.fromApiError` for backend failures. Never Post/Save stock just to test sound in non-disposable tenant. Code lives in `frontend/src/feedback/feedbackSounds.ts`, FeedbackProvider and feedback.css.

### Stock Taking list semantics, Post completion, and audio — Batch 20
- Stock Taking line notes describe individual products and are not document-level remarks; don't show line notes in a single list Notes column. The directory should show Document #, Date, Warehouse, Status and Line count; line notes stay in the detailed editor and are saved by the existing draft save API.
- After successful Stock Taking **server Post**, close the editor modal and refresh the directory; on post failure leave editor open, with all existing safeguards and confirmation semantics intact. Never change posted stock or create a test movement merely to test visuals.
- Global feedback sounds should use existing repo-served files in `frontend/public/sounds` with local WebAudio fallback, recognizable by tone. UI must work when muted/autoplay-restricted; display severity colors and accessible live text independently. Sound files are verified present (not missing) and play failure must not interrupt POS workflows.

## 2026-11-25 — Approved single-branch policy and Inventory/Barcode pattern
- **Branch discipline:** Create NO additional Git branches without explicit owner request. All future UI commits go directly to `redesign/ahpos-complete-ui`; `main` is separate. Owner pulls with `git pull --ff-only origin redesign/ahpos-complete-ui`. Maintain handoff docs every batch.
- Opening Stock: list remains a full-height directory; New/Open enter a large canonical transaction modal with actual draft/posted document number, warehouse/date/notes, product search/selection and line grid. Header and row entry must be readable with high-contrast surfaces and labels. Product dropdown must layer above modal; Save/Post workflow and immutability unchanged. Local table scroll only, dock at footer.
- Barcode Printing: premium two-column workspace, crisp settings/label preview on one side, Auto Fill and full-height queue on the other; white content, strong navy headers, visible borders, readable inputs, distinctly colored real operations and Print All in integrated footer. Do not remove unsupported native-printer controls or pretend browser can enumerate printers. Actual barcode validation and rendering/print handlers remain source of truth.
- These source changes require local typecheck, UI navigation guard and owner visual acceptance; don't mistake committed code for validated screenshots.

## 2026-11-25 — Batch 22 Inventory Adjustment & Product GL pattern
- Batch 21 Opening Stock and Barcode Printing achieved owner-reported 8/8 browser PASS and are visually accepted; do not disrupt these.
- Inventory Adjustments requires clear three-mode tabs (Invoice, Search, Product Wise); remove only redundant decorative page title, never disable account/date/number, staged edits, posting confirmation, posted amendment or print report. Use white panels, navy tab/column headers, visible steel borders, 33px inputs and tables that scroll internally on large datasets. Print report overrides remain intact.
- Product GL Grid should have one compact filters card with product/SKU and date range, no duplicate module title below active workspace tab; actual report remains print-safe, with full viewer tools (Zoom, Search, Copy, Export, Print, Refresh, Edit Options, Close) and complete current-page data/totals semantics.
- No new branches; source on `redesign/ahpos-complete-ui`. Local tests and browser approval required for Batch 22.

### 2026-11-25 — Mandatory contrast / floating transaction dock acceptance
- An AH-POS transaction line must be discoverable at first glance: header dark and legible, visible **vertical and horizontal borders** between all editable cells, active entry row with tinted background and stronger bottom separator, saved rows alternating subtly, focus evident, clear white inputs and readable numeric placeholders. Never infer a visual match from `PosDataGrid` CSS if the module actually uses `PosEntryGrid`; inspect component markup and tableClassName first.
- All active dropdowns must have a visible chevron in a distinct inset blue button, visible trigger border and strong focus. Searchable combobox input remains borderless inside single outlined trigger (no double fields); dark mode retains legibility.
- Default/info/success/primary/warning/danger tenant actions need distinct visual tones with decent contrast, disabled remains visibly inactive. For complex inventory transaction screens, **compact floating navy bottom-right action dock** is the approved pattern; retain genuine Save/Post/Delete/Close handlers. Avoid turning real transaction dock into a pale flat full-width footer.
- Source contract: page-specific `InventoryAdjustmentsWorkspace.css` for Adjustment grid and floating dock, shared tenant-safe visibility in UiSelect.css, PosEntryGrid.css and UiButton.css. Browser acceptance required; no backend, financial or warehouse changes.

Shared list table visibility is governed by `PosDataGrid.css`: stronger cell dividers and row selection but header text palette must remain under module/theme control; do not globally force dark text onto navy headers.

### Global UiSelect arrow — mandatory single source (2026-11-25)
Real dropdowns use the shared UiSelect.tsx trigger and an **18×18px dark navy high-contrast arrow tile with white 10×7px chevron**. The global component CSS governs the actual arrow for normal and searchable combobox modes on pages and portalled modals. Disabled/hover/dark states retain distinction. Do not override with giant pale tiles in individual modules or add a second bordered inner input. Reference `frontend/src/components/ui/UiSelect.css`.

### Canonical select arrow — strict reusable design contract (2026-11-25)
**Do not create screen-specific dropdown/caret sizes, colors, radii or hover backgrounds.** Shared `UiSelect.tsx` renders `.ah-select-caret` on both regular and searchable triggers. Legacy custom transaction product selectors must use `.ah-dropdown-arrow-button` on the existing real trigger, or `.ah-dropdown-arrow-hitbox` on a button with child `.ah-select-caret`. All visible arrow styling and state palettes derive from `frontend/src/components/ui/UiSelect.css` through `--ah-select-caret-size`, `--ah-select-caret-radius`, `--ah-select-caret-bg`, `--ah-select-caret-hover`, `--ah-select-caret-border`, and disabled/dark tokens. Standard visible tile is **18×18px, 4px radius, deep navy, white chevron** in every state; surrounding click target may be larger but must not paint another tile. Screens keep normal filter/input widths and existing dropdown logic/portal stacking. Don't use generic `.ui-select-arrow` `!important` overrides in modules. `npm run ui:check` enforces contract for existing bespoke transaction pickers. Always verify normal, hover, open, disabled, keyboard navigation and display on at least Adjustments, Purchase Invoice, Purchase Order, Purchase Return, Sales and Quotation.

### 2026-11-25 — Transaction workspace reuse (Batch 23)
- Purchase Order and Purchase Return must share `frontend/src/pages/PurchaseTransactionWorkspace.css`, attached via `ah-purchase-document-workspace` root class. Do NOT reintroduce different per-module tab shapes, pale list grids, or independent floating action styles. Reuse common tokens for nav tabs, white panels, navy table headers, visible vertical/horizontal dividers, blue editable-row tint, clear fields, scroll and dark bottom-right action dock.
- The actual controls and operations must stay real. For Purchase Order, approved three horizontal tabs with all existing toolbar actions in one compact dock; for Purchase Return, three horizontal tabs and bottom-right actual Save/Post/Refresh/Close or list New/Open controls. Preserve permission-disabled, status-confirmation, Purchase Order generator/convert and Purchase Return posting/Amend logic. No fictional print or stock operation.
- Dropdown arrows remain **exclusively** controlled by `UiSelect.css` via `ah-select-caret` and `ah-dropdown-arrow-button`; never add new module arrow geometry/color overrides. `PosEntryGrid` retains canonical keyboard/edit business interaction.
- Owner visual approval and npm guard checks pending; use one shared CSS change for future pair-level visual adjustments. Sole UI branch policy unchanged.
