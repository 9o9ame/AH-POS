import type { AppIconName } from './AppIcon';

export type ModuleId = 'overview' | 'definitions' | 'daily' | 'reports' | 'tools' | 'administration' | 'help';
export type WorkspacePage =
  | 'dashboard' | 'products' | 'customers' | 'suppliers' | 'inventory'
  | 'purchases' | 'sales' | 'held' | 'returns' | 'cash' | 'reports';
export type ModuleItem = {
  id: string;
  name: string;
  description: string;
  group: string;
  icon: AppIconName;
  page?: WorkspacePage;
  state: 'working' | 'planned';
};

export type ModuleDefinition = {
  id: ModuleId;
  title: string;
  short: string;
  subtitle: string;
  icon: AppIconName;
  items: ModuleItem[];
};

const item = (
  id: string, name: string, group: string, description: string, icon: AppIconName,
  page?: WorkspacePage,
): ModuleItem => ({ id, name, group, description, icon, page, state: page ? 'working' : 'planned' });

export const modules: ModuleDefinition[] = [
  {
    id: 'overview', title: 'Workspace', short: 'Home', icon: 'dashboard',
    subtitle: 'Operational overview, active work and business shortcuts.',
    items: [
      item('overview', 'Business Overview', 'WORKSPACE', 'Operational metrics and quick actions', 'dashboard', 'dashboard'),
      item('cashdesk', 'Cash Register', 'COUNTER', 'Open and close cashier shifts', 'warehouse', 'cash'),
      item('quick-sales', 'Sales Invoice', 'COUNTER', 'Open multiple independent invoices', 'sales', 'sales'),
      item('quick-holds', 'Held Bills', 'COUNTER', 'Get saved customer bills', 'package', 'held'),
    ],
  },
  {
    id: 'definitions', title: 'Definitions', short: 'Definitions', icon: 'products',
    subtitle: 'Build business master data, products, parties, units and accounts.',
    items: [
      item('products', 'Products', 'PRODUCT MASTER', 'SKUs, barcodes and selling prices', 'products', 'products'),
      item('products-grid', 'Tabular Product View', 'PRODUCT MASTER', 'Editable product grid, mass updates and import', 'inventory'),
      item('categories', 'Categories', 'PRODUCT MASTER', 'Product classification and hierarchy', 'package'),
      item('subcategories', 'Sub Categories', 'PRODUCT MASTER', 'Nested product classification', 'package'),
      item('brands', 'Brands', 'PRODUCT MASTER', 'Brand master list', 'products'),
      item('units', 'Units & Conversions', 'PRODUCT MASTER', 'Base and secondary units, pack factors', 'inventory'),
      item('multiple-barcodes', 'Multiple Barcodes', 'PRODUCT MASTER', 'Barcode-to-unit mapping and labels', 'search'),
      item('price-lists', 'Price Lists', 'PRODUCT MASTER', 'Retail, wholesale and customer prices', 'sales'),
      item('vendors', 'Vendors / Suppliers', 'BUSINESS PARTNERS', 'Supplier contact directory', 'truck', 'suppliers'),
      item('customers', 'Customers', 'BUSINESS PARTNERS', 'Customer contact directory', 'people', 'customers'),
      item('accounts', 'Accounts / Chart of Accounts', 'ACCOUNTING MASTER', 'Account heads, types and leaf accounts', 'reports'),
      item('banks', 'Bank Accounts', 'ACCOUNTING MASTER', 'Cash and bank master definitions', 'warehouse'),
      item('warehouses', 'Warehouses', 'LOCATION MASTER', 'Warehouses and stock receiving', 'warehouse', 'inventory'),
      item('branches', 'Branches & Locations', 'LOCATION MASTER', 'Branch master and access policies', 'warehouse'),
    ],
  },
  {
    id: 'daily', title: 'Daily Entries', short: 'Daily Entries', icon: 'sales',
    subtitle: 'Counter transactions, supplier documents, inventory and cash operations.',
    items: [
      item('sales', 'Sales Invoice', 'SALES & CUSTOMERS', 'Cash sale, barcode entry and receipt', 'sales', 'sales'),
      item('quotation', 'Sales Quotation', 'SALES & CUSTOMERS', 'Quotation, conversion and customer approval', 'package'),
      item('sales-return', 'Sales Return / Refund', 'SALES & CUSTOMERS', 'Original-line linked cash returns', 'arrow', 'returns'),
      item('held', 'Held / Pending Bills', 'SALES & CUSTOMERS', 'Resume cashier-saved invoice drafts', 'package', 'held'),
      item('sales-order', 'Sales Order', 'SALES & CUSTOMERS', 'Order capture, reservation and fulfillment', 'sales'),
      item('customer-payments', 'Customer Receipts', 'SALES & CUSTOMERS', 'Receive payment against customer dues', 'people'),
      item('purchase', 'Purchase Invoice', 'PURCHASING', 'Supplier invoice and stock receipt', 'truck', 'purchases'),
      item('purchase-order', 'Purchase Order', 'PURCHASING', 'Supplier order and receiving plan', 'truck'),
      item('purchase-return', 'Purchase Return', 'PURCHASING', 'Vendor returns and stock reversal', 'arrow'),
      item('supplier-payments', 'Supplier Payments', 'PURCHASING', 'Pay vendor liabilities', 'truck'),
      item('stock-receive', 'Opening / Stock Inward', 'INVENTORY', 'Warehouses, receipts and stock balances', 'inventory', 'inventory'),
      item('stock-transfer', 'Stock Transfer', 'INVENTORY', 'Branch or warehouse movement', 'inventory'),
      item('stock-adjustment', 'Stock Adjustment', 'INVENTORY', 'Authorized count and variance adjustments', 'inventory'),
      item('cash-shift', 'Cash Register & Shift Close', 'CASH & ACCOUNTS', 'Opening cash, counted cash and variance', 'warehouse', 'cash'),
      item('cashbook', 'Cash / Bank Voucher', 'CASH & ACCOUNTS', 'Receipts, payments and transfers', 'reports'),
      item('journal', 'General Journal Voucher', 'CASH & ACCOUNTS', 'Audited double-entry accounting vouchers', 'reports'),
      item('party-ledger', 'Vendor / Customer / Account Ledger', 'CASH & ACCOUNTS', 'Posted ledger entries, dues and running balances', 'reports'),
    ],
  },
  {
    id: 'reports', title: 'Reports', short: 'Reports', icon: 'reports',
    subtitle: 'Operational intelligence and financial reporting as source modules mature.',
    items: [
      item('ops-report', 'Operations Dashboard', 'CURRENT REPORTS', 'Sales, purchases, refunds and daily trend', 'reports', 'reports'),
      item('warehouse-stock', 'Stock Balance & Movement', 'CURRENT REPORTS', 'Live product/warehouse stock activity', 'inventory', 'inventory'),
      item('cash-register-report', 'Cash Closing Register', 'CURRENT REPORTS', 'Cashier shifts and variance records', 'warehouse', 'cash'),
      item('daybook', 'Day Book', 'ACCOUNTING REPORTS', 'Date-wise accounting transactions', 'reports'),
      item('party-outstanding', 'Customer / Supplier Outstanding', 'ACCOUNTING REPORTS', 'Receivables and payables aging', 'people'),
      item('account-ledger-report', 'General Ledger', 'ACCOUNTING REPORTS', 'Posted journal lines and balance', 'reports'),
      item('trial-balance', 'Trial Balance', 'ACCOUNTING REPORTS', 'Debit and credit reconciliations', 'reports'),
      item('profit-loss', 'Profit & Loss', 'ACCOUNTING REPORTS', 'Revenue, COGS and operating expenses', 'reports'),
      item('balance-sheet', 'Balance Sheet', 'ACCOUNTING REPORTS', 'Assets, liabilities and equity', 'reports'),
      item('product-wise', 'Product-wise Sales / Purchases', 'ANALYTICS', 'Item performance and transaction summaries', 'products'),
      item('tax-report', 'Tax / Fiscal Registers', 'ANALYTICS', 'Tax schedules after approved fiscal setup', 'reports'),
      item('salesman', 'Salesperson Performance', 'ANALYTICS', 'Targets, sales and collections', 'people'),
    ],
  },
  {
    id: 'tools', title: 'Tools', short: 'Tools', icon: 'settings',
    subtitle: 'Data operations, imports, labels, sync and integrations.',
    items: [
      item('barcode-tool', 'Barcode Printing', 'PRODUCTIVITY', 'Product labels and printer templates', 'products'),
      item('bulk-import', 'Import / Export', 'PRODUCTIVITY', 'Audited product and account import jobs', 'inventory'),
      item('bulk-edit', 'Bulk Update', 'PRODUCTIVITY', 'Authorized mass edits of master data', 'products'),
      item('backup', 'Backup / Restore', 'DATA SAFETY', 'Tenant export and recovery verification', 'shield'),
      item('data-check', 'Data Integrity Checks', 'DATA SAFETY', 'Audit business consistency and balances', 'shield'),
      item('offline', 'Offline Sync & Queue', 'CONNECTIVITY', 'Device outbox and conflict resolution', 'settings'),
      item('printer', 'Printers & Devices', 'CONNECTIVITY', 'Receipt and label hardware profiles', 'warehouse'),
      item('whatsapp', 'WhatsApp Integration', 'CONNECTIVITY', 'Controlled templates, approvals and delivery logs', 'people'),
      item('ai-tools', 'AI Assistant', 'CONNECTIVITY', 'Allowlisted tenant-secure business assistance', 'search'),
    ],
  },
  {
    id: 'administration', title: 'Administration', short: 'Administration', icon: 'shield',
    subtitle: 'Security, business setup, users, devices and audit controls.',
    items: [
      item('company', 'Business / Tenant Profile', 'BUSINESS SETUP', 'Legal profile, defaults and permitted settings', 'warehouse'),
      item('branches-admin', 'Branch Management', 'BUSINESS SETUP', 'Branch access and location configuration', 'warehouse'),
      item('warehouse-admin', 'Warehouse Operations', 'BUSINESS SETUP', 'Current locations and inventory activity', 'warehouse', 'inventory'),
      item('users', 'Users & Staff', 'ACCESS & SECURITY', 'Invite and manage staff lifecycle', 'people'),
      item('roles', 'Roles & Permissions', 'ACCESS & SECURITY', 'RBAC administration and audit', 'shield'),
      item('devices', 'Device Management', 'ACCESS & SECURITY', 'Register and revoke POS devices', 'shield'),
      item('session-security', 'Sessions & Security', 'ACCESS & SECURITY', 'Session revocation and access policy', 'shield'),
      item('audit', 'Audit Trail', 'ACCESS & SECURITY', 'Tamper-aware event history', 'reports'),
      item('appearance', 'Themes & Appearance', 'PREFERENCES', 'Light/dark, density and interface style', 'settings'),
      item('tax-settings', 'Tax & Invoice Settings', 'PREFERENCES', 'Tax rules, numbering and invoice policies', 'settings'),
      item('ai-controls', 'AI / WhatsApp Controls', 'PREFERENCES', 'Super Admin opt-in, approvals and limits', 'settings'),
      item('subscription', 'Plan & Subscription', 'PLATFORM', 'Tenant billing and enabled entitlements', 'shield'),
    ],
  },
  {
    id: 'help', title: 'Help', short: 'Help', icon: 'shield',
    subtitle: 'Learn the system, get support and prepare a safe launch.',
    items: [
      item('getting-started', 'Getting Started', 'DOCUMENTATION', 'Guided setup and daily operation handbook', 'package'),
      item('keyboard-help', 'Keyboard Shortcuts', 'DOCUMENTATION', 'Cashier keyboard usage and quick access', 'menu'),
      item('release-help', 'Deployment Readiness', 'DOCUMENTATION', 'Accounting, security and backup approval gates', 'shield'),
      item('support', 'Support & Feedback', 'SUPPORT', 'Issue reporting and client help channels', 'people'),
    ],
  },
];

export const moduleById = (id: ModuleId): ModuleDefinition =>
  modules.find(module => module.id === id) ?? modules[0];

export function moduleForPage(page: WorkspacePage): ModuleId {
  switch (page) {
    case 'products': case 'customers': case 'suppliers': return 'definitions';
    case 'purchases': case 'sales': case 'held': case 'returns': case 'cash': case 'inventory': return 'daily';
    case 'reports': return 'reports';
    default: return 'overview';
  }
}

export const enabledModuleItems = (module: ModuleDefinition): ModuleItem[] =>
  module.items.filter(item => item.state === 'working');
