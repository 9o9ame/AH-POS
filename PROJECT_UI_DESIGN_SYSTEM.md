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
