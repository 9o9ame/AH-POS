# AH-POS Global UI Design System — initial approved direction needed

**Status:** Foundational standards / visual identity **not yet approved**. This is a contract for future design, not proof of coded components.

## Visual independence
BluePOS is a business-flow reference, not a UI template. AH-POS must have original branding, color language, navigation, typography, icon usage and layout. Do not reuse proprietary BluePOS artwork, distinctive ribbon appearance or screenshots as code.

## Single source of visual truth
Before feature pages, define globally: `font-family`, 12/14/16/18/24/32 typography scale (proposed, tune after review), typography weights and line heights; neutral + semantic color tokens; light/dark theme; contrast; 4px spacing system; responsive breakpoints; density; radii/shadows; focus/hover/disabled/error/selected; overlays/z-index; animation reduction.

## Shared components (planned)
AppShell; Sidebar; Topbar; PageHeader; UiButton; UiInput; UiSelect; UiDatePicker; MoneyInput; QuantityInput; UiModal; ConfirmDialog; DataTable; PosEntryGrid; ProductPicker; PartyPicker; Toast; SearchPalette; ReceiptPreview; UploadDropzone; AiAssistantDock; VoiceRecorder; SyncStatusBadge.

## Enforced rules
- Central tokens and component implementation own appearance and state.
- Feature pages own business layout only; no duplicate font sizes and ad hoc colors.
- Responsive, keyboard accessible and mobile-friendly from the start. Ensure POS keyboard entry and scanners don't lose focus.
- Freeze visual geometry after explicit acceptance; subsequent functional fixes must preserve approved structure.
- Design mobile alongside the web contract but begin mobile app coding at 70–80% **accepted** web milestone.
- Require component gallery, screenshot regression and accessibility contrast checks before P2 acceptance.

## Next
Approve unique design direction (logo, palette, navigation, component style), build tokens/components and record signoff. Do not claim designs finalized yet.

## 2026-11-19 — Implemented provisional visual direction (NOT YET APPROVED)
- New `frontend/src/styles.css` global tokens: navy sidebar, teal action/accent, soft gray workspace, white cards, Manrope/DM Sans typography with system fallback, responsive nav and accessible focus states.
- Shared visual building blocks: `AppIcon`, `App` nav/tenant shell, `DashboardPanel`, metric cards and table/card styling. Existing product/party/inventory modules reuse this design without copied BluePOS branding.
- User requested a recognizable full POS application appearance rather than a narrow engineering demo. This batch is **implemented_unverified** until browser screenshot/review; final logo, palette and component geometry still need explicit signoff. Do not mark P2 accepted on source-only evidence.

## 2026-11-19 — Premium UX iteration (pending user visual approval)
- 2026 researched direction: command-first navigation, calm-density business data, meaningful motion, restrained translucent control surfaces, strong keyboard accessibility. No verifiable universal visual style called "V7" or "V24"; use actual reference URLs/screenshots if the user specifies them.
- Implementation: `CommandPalette.tsx`, Ctrl/Cmd+K search/arrow/Enter/Escape, top-bar search affordance; CSS tokens `--ease-expressive`, `--motion-short/medium`, translucent sticky header and modal backdrop; subtle cards, navigation, toast motion and `prefers-reduced-motion` fallbacks.
- Favor cashier speed, 60fps transforms/opacity, measurable interaction responsiveness, readable dense stock/sales tables over broad glass/blur decoration. UI remains NOT approved or locally visually verified for this commit.

## 2026-11-19 — Expanded operational screen patterns (pending local visual verification)
- Desktop purchasing: supplier and warehouse controls, searchable product tiles, multi-line editable quantity/unit cost, provisional draft total, document history.
- Cashier POS: warehouse/customer pickers, barcode/SKU search, click-to-cart, editable quantities, running local estimate, cash tendered, change preview, call-to-action and recent sales; receipt modal/print CSS for narrow 80mm-class output.
- Operations Reports: KPI cards and seven-day bar visualization; trend is tenant-scoped cash-sale volume, NOT GL, profit or tax accounting. Motion uses existing tokens and reduced-motion fallback.
- These new screens are code-complete but **await Vite build/browser review**; not an approved frozen design geometry.

## 2026-11-19 — Dedicated returns workflow UI (implemented/unverified)
- New `ReturnsPanel.tsx` uses existing cards, forms, table, warnings and success feedback for partial/full cash refunds, original receipt selection, item quantities and return history.
- Sidebar and Ctrl+K destinations include Sales Returns. Reports now distinguish gross cash sales from refund-adjusted cash activity; all remain pilot data, not financial statements. No approval claim until browser evidence.

## 2026-11-19 — Cash Register UI module (source committed, not yet visually verified)
- Shared navigation gains Cash Register. Responsive open-shift form, live shift KPI cards, physical-counted cash close interaction, expected-vs-counted variance and immutable closure history reuses original AH POS tokens/cards.
- Operational pilot excludes physical drawer driver and financial ledger; no P2 signoff based only on committed code.

## 2026-11-19 — Desktop invoice workspace based on workflow, NOT BluePOS UI copy
- User explicitly requested desktop-style AH-POS rather than static website screens, with multiple simultaneous customers/purchases, independent modal windows, and BluePOS-style On Hold/Get semantics mapped to AH-POS tenant PostgreSQL.
- Created `TransactionWorkbench.tsx` task dock and maximized modal invoices, dense responsive product/cart layouts, keyboard new-sale/new-purchase, styled titlebars and minimize/close controls, server saved held bills. AH-POS navy/teal original visual system kept. No frozen BluePOS proprietary pixel layout copied.
- Large new UX source is **not yet locally browser-approved or compiled**. Verify multi-window switching, barcode keyboard, modal focus, receipt overlay/print and mobile accessibility before visual signoff; avoid claiming true drag/resize/split view, cross-device workspaces or production-only functions not implemented.

## 2026-11-19 — User-requested full ERP information architecture
- User explicitly requires AH-POS to present a mature professional ERP menu, with top-level Definitions, Daily Entries, Reports, Tools, Administration, Help and detailed business groups, while remaining visually distinct from BluePOS.
- Implemented new canonical `ModuleCatalog`, original responsive AH-POS module ribbon, grouped contextual sidebar, searchable module family pages with available/planned counters, Ctrl+K taxonomy search and disabled planned screens. Existing desktop POS/Purchase multi-window workbench persists. Original AH-POS navy/teal theme retained.
- Four-tab real Definitions master management added for Category/Subcategory/Brand/Unit; product form captures optional links. Unbuilt admin/accounting/lot/multiunit workflows remain labeled `Planned`, not fake finished UI.
- Large shell/refactor **not yet locally built or browser approved**. User to inspect dense desktop hierarchy, mobile ribbon, context switching, contrast and speed. No geometry frozen or signoff implied.

## 2026-11-19 — User-directed compact desktop Admin interaction contract
- Initial tenant/Admin with exactly one active authorized membership enters dashboard via server-verified context after login; multiple memberships continue to show chooser.
- The six-family ribbon becomes first/top chrome, with workspace/profile identity on right; redundant breadcrumb/search/development second bar removed (Ctrl+K still works).
- Contextual sidebar closed by default; hover/focus left edge smoothly reveals, pin toggle keeps visible, switching family hides previous submenu, repeated family click closes module explorer. Responsive/keyboard/reduced-motion contract; browser verification pending.
- Compact density and fixed application frame. Workspace or table has its own scroll, not a whole-page document scroll. No permanent master create forms: Product, Parties, Product Masters, Warehouse/Stock Inward are dialog-driven list pages. Transaction invoice windows remain custom POS/Purchase workspaces.
- Dashboard live source chart types: seven-day gross cash sales **bars** and sale/purchase/refund **document count donut**, no unsourced profit or cash balances. New provisional color-coded Stock Watch is **not server-defined notifications**.
- Added shared EntityModal and TableSkeleton; source is **unverified** until frontend TS build and browser keyboard/mobile review. Device-safe IndexedDB persistence is a later explicitly gated milestone as documented in ADR-0003; first-load can never be magically cached without a prior download.

## 2026-11-19 — Corrected top-ribbon hover / click navigation contract (user screenshot feedback)
- **Supersedes** earlier "hover left edge" behavior. User marked **Home / Definitions / Daily Entries / Reports / Tools / Administration / Help** tabs in screenshot as the correct hover targets and crossed out the separate left-side hamburger.
- On desktop: hover/focus **any main ribbon tab** previews that family's contextual left submenu while keeping the current business page unchanged; moving pointer into sidebar keeps it open; leaving preview hides it when unpinned. Click a family tab to **pin** its submenu and navigate to that family's module directory; click same pinned family again to **unpin and close** submenu. Clicking another family replaces the previously pinned submenu. Home hover shows Overview submenu; Home click navigates dashboard and closes submenu.
- Remove detached left-edge trigger and ribbon hamburger completely. Sidebar animates from under top ribbon, never obscures the top navigation. Side menu chosen via top navbar not anonymous edge. Keyboard focus previews ribbon item; Escape closes; reduced-motion disables transition.
- Opening a subpage inside the clicked family retains the pinned submenu, rather than resetting it. Switch across families clears/changes pin. Platform vs Admin staff/permissions, secure device approval and IndexedDB remain separate unimplemented security milestones.
- **Committed source, NOT locally built/browser tested**. Verify hover-to-drawer traversal, pin/reclick/switch, mobile touch, keyboard and dashboard. Older paragraphs referencing hover-left-edge are historical and superseded by this explicit correction.

## 2026-11-19 — Platform console distinct from business Admin shell
- A platform-authorized user sees Platform entry in the main ribbon; Platform-only staff without a tenant enters Platform console directly. The Platform console has a separate premium AH-POS control-plane header and dense list/create-modal registers for Admin onboarding, Platform operators and audit.
- Unauthorized users never see Platform link. Platform UI does not show business transactions or bypass tenant RBAC. Source is NOT yet browser/TypeScript verified.
- Top family-hover sidebar correction remains source-of-truth: hover any top tab previews matching subnav; click pins, same click unpins, switch replaces. No edge hamburger.

## 2026-11-19 — Real tenant Staff + Device Approval administration UI
- Top ribbon Administration → Users & Staff, Roles & Permissions and Device Management now map to one compact `StaffSecurityPanel` with contextual tab, Create Staff modal, role-permission display and device approval/reject/revoke table. Each action is backed by tenant/RBAC server APIs; local old Ali tenant requires explicit Admin Owner grant.
- On single-staff login without approved device, show dedicated `DevicePendingPanel` with device label form, pending status, refresh/check approval action and logout. No tenant data is rendered until server returns approved member context; HttpOnly cookie is not exposed to React/IndexedDB.
- No browser acceptance yet. No fake GPS or notification claims. Continue original top-ribbon hover-preview, click-pin, toggle submenu and compact modal/table density without creating an extra left-edge hover button.
