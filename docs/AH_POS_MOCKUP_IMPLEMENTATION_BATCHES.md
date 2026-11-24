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
