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
