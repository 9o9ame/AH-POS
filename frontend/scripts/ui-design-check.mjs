import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve('src')
const failures = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

const files = await walk(root)

for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/')
  const source = await readFile(file, 'utf8')

  if (file.endsWith('.tsx') && /<select\b/.test(source)) {
    failures.push(`${relative}: native <select> found; use UiSelect/UiMultiSelect or document an approved exception.`)
  }
  if (file.endsWith('.tsx') && relative !== 'components/ui/UiDatePicker.tsx' && /<input\b[^>]*\btype\s*=\s*['"]date['"]/s.test(source)) {
    failures.push(`${relative}: native date input found; use UiDatePicker for single dates and linked From/To ranges.`)
  }

  if (relative.startsWith('components/ui/') && file.endsWith('.css')) {
    const forbiddenPrimary = /#(?:1769aa|0f7dcc|1f4e79|2b6aa3|0969da|58a6ff|2388c9|3c94cf)\b/i
    if (forbiddenPrimary.test(source)) {
      failures.push(`${relative}: hard-coded primary-theme color found in canonical UI CSS.`)
    }

    const numericLayer = /z-index\s*:\s*(\d+)/g
    for (const match of source.matchAll(numericLayer)) {
      if (Number(match[1]) >= 1000) {
        failures.push(`${relative}: numeric overlay z-index ${match[1]} found; use uiLayers contract.`)
      }
    }
  }
}

// Keep all transaction product-picker arrows aligned with UiSelect's shared
// caret contract. A new custom picker must reuse the class instead of
// inventing a page-local shape, size, or color.
const caretStyles = await readFile(path.join(root, 'components/ui/UiSelect.css'), 'utf8')
const sharedSelect = await readFile(path.join(root, 'components/ui/UiSelect.tsx'), 'utf8')
if (!caretStyles.includes('AH-POS SELECT/DROPDOWN DESIGN CONTRACT') ||
    !caretStyles.includes('--ah-select-caret-size') ||
    !sharedSelect.includes('ah-select-caret')) {
  failures.push('Canonical UiSelect caret contract is missing; restore shared sizing/colors and markup.')
}
const customProductPickerFiles = [
  ['pages/InventoryAdjustmentsPage.tsx', 'inventory-adjustments-product-arrow', 'ah-dropdown-arrow-hitbox'],
  ['pages/PurchasesPage.tsx', 'pie-product-combo-toggle', 'ah-dropdown-arrow-button'],
  ['pages/PurchaseOrderPage.tsx', 'purchase-order-product-toggle', 'ah-dropdown-arrow-button'],
  ['pages/PurchaseReturnsPage.tsx', 'purchase-return-product-toggle', 'ah-dropdown-arrow-button'],
  ['pages/SalesInvoicePage.tsx', 'sales-product-combo-toggle', 'ah-dropdown-arrow-button'],
  ['pages/SalesReturnsPage.tsx', 'sales-product-combo-toggle', 'ah-dropdown-arrow-button'],
  ['pages/QuotationEstimatePage.tsx', 'quotation-product-combo-toggle', 'ah-dropdown-arrow-button'],
]
for (const [file, picker, contract] of customProductPickerFiles) {
  const source = await readFile(path.join(root, file), 'utf8')
  const classNames = [...source.matchAll(/className="([^"]+)"/g)]
    .map((match) => match[1].split(/\s+/))
  const pickerClasses = classNames.filter((classes) => classes.includes(picker))
  if (pickerClasses.length === 0 ||
      pickerClasses.some((classes) => !classes.includes(contract))) {
    failures.push(`${file}: every ${picker} picker must use shared ${contract} caret contract.`)
  }
}

// Purchase Order and Purchase Return must not diverge into separate
// transaction themes again. Both reuse the same workspace CSS and the
// global UiSelect caret contract.
const purchaseWorkspacePath = path.join(root, 'pages/PurchaseTransactionWorkspace.css')
const purchaseWorkspaceCss = await readFile(purchaseWorkspacePath, 'utf8')
for (const [pageFile, rootClass] of [
  ['PurchaseOrderPage.tsx', 'purchase-order-page ah-purchase-document-workspace'],
  ['PurchaseReturnsPage.tsx', 'purchase-return-screen ah-purchase-document-workspace'],
]) {
  const source = await readFile(path.join(root, 'pages', pageFile), 'utf8')
  if (!source.includes(rootClass) ||
      !source.includes("import './PurchaseTransactionWorkspace.css'")) {
    failures.push(`pages/${pageFile}: share PurchaseTransactionWorkspace.css and the canonical transaction root class.`)
  }
}
if (!purchaseWorkspaceCss.includes('.purchase-order-lines') ||
    !purchaseWorkspaceCss.includes('.purchase-return-grid') ||
    !purchaseWorkspaceCss.includes('bottom-right')) {
  failures.push('PurchaseTransactionWorkspace.css: preserve shared PO/Return grid and action dock contract.')
}

// Sales Invoice/Return must share visual transaction tokens while retaining
// their independent checkout, refund and posting behavior.
const salesWorkspaceCss = await readFile(path.join(root, 'pages/SalesTransactionWorkspace.css'), 'utf8')
for (const [file, rootClass] of [
  ['SalesInvoicePage.tsx', 'sales-reference-screen ah-sales-transaction-workspace'],
  ['SalesReturnsPage.tsx', 'sales-return-screen ah-sales-transaction-workspace'],
]) {
  const source = await readFile(path.join(root, 'pages', file), 'utf8')
  if (!source.includes("import './SalesTransactionWorkspace.css'") ||
      !source.includes(rootClass)) {
    failures.push(`pages/${file}: must use the shared sales transaction workspace.`)
  }
}
// Avoid the former Sales Invoice regression: the historic theme used fixed
// 62px options and 18px inputs, clipping fields under the barcode lane.
for (const essential of [
  '.ah-sales-document-header',
  '.ah-sales-document-facts',
  '.sales-reference-meta',
  '.sales-reference-option-grid',
  '.sales-reference-entry-row',
  '.sales-reference-pay',
]) {
  if (!salesWorkspaceCss.includes(essential)) {
    failures.push(`SalesTransactionWorkspace.css: missing Sales Invoice corrective layout contract ${essential}.`)
  }
}

if (!salesWorkspaceCss.includes('.sales-reference-grid') ||
    !salesWorkspaceCss.includes('.sales-return-custom-table') ||
    !salesWorkspaceCss.includes('UiSelect.css')) {
  failures.push('SalesTransactionWorkspace.css: missing invoice, return or canonical dropdown contract.')
}

// Inline Sales Invoice Customer/Salesman/Quotation picker buttons also MUST
// use the canonical UiSelect caret tokens; otherwise legacy page CSS inflates
// the little arrow to full field height or paints a different color.
const salesInvoiceSource = await readFile(path.join(root, 'pages/SalesInvoicePage.tsx'), 'utf8')
const salesInlineCaretMatches = [...salesInvoiceSource.matchAll(/className="sales-reference-field-caret([^"]*)"/g)]
if (salesInlineCaretMatches.length !== 3 ||
    salesInlineCaretMatches.some((match) => !match[1].split(/\s+/).includes('ah-inline-field-caret'))) {
  failures.push('SalesInvoicePage.tsx: all Customer, Salesman and Quotation picker arrows must use ah-inline-field-caret.')
}
if (!caretStyles.includes('.sales-reference-inline-caret > .ah-inline-field-caret') ||
    !caretStyles.includes('--ah-inline-caret-right')) {
  failures.push('UiSelect.css: inline lookup arrow must share canonical 18px caret tokens and preserve customer quick-add spacing.')
}
if (salesWorkspaceCss.includes('.sales-reference-input-button > button,')) {
  failures.push('SalesTransactionWorkspace.css: do not force inline dropdown buttons to full form-field height.')
}

if (failures.length > 0) {
  console.error('BluePOS UI design-system check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('BluePOS UI design-system check passed.')
