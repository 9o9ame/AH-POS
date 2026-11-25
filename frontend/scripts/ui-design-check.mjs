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
  if (source.includes(`className="${picker}"`) ||
      !source.includes(`className="${picker} ${contract}"`)) {
    failures.push(`${file}: product picker must use shared ${contract} caret contract.`)
  }
}

if (failures.length > 0) {
  console.error('BluePOS UI design-system check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('BluePOS UI design-system check passed.')
