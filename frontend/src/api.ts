export type Profile = { name: string; email: string };
export type TenantChoice = { ulid: string; name: string };

type DataResponse<T> = { data: T };
type TokenResponse = { token: string };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) {
    throw new ApiError(response.status, body?.message || `Request failed (${response.status})`);
  }
  return body as T;
}

export async function csrfToken(): Promise<string> {
  const response = await fetch('/api/csrf', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  return (await readJson<TokenResponse>(response)).token;
}

async function post<T>(url: string, payload?: object): Promise<T> {
  const token = await csrfToken();
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
    },
    body: JSON.stringify(payload || {}),
  });
  return readJson<T>(response);
}

export async function me(): Promise<Profile> {
  const response = await fetch('/api/me', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  return (await readJson<DataResponse<Profile>>(response)).data;
}

export async function login(email: string, password: string): Promise<Profile> {
  return (await post<DataResponse<Profile>>('/api/login', { email, password })).data;
}

export async function logout(): Promise<void> {
  await post<{ message: string }>('/api/logout');
}

export async function myTenants(): Promise<TenantChoice[]> {
  const response = await fetch('/api/my/tenants', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  return (await readJson<DataResponse<TenantChoice[]>>(response)).data;
}

export async function tenantContext(ulid: string): Promise<TenantChoice> {
  const response = await fetch(`/api/tenants/${encodeURIComponent(ulid)}/context`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  return (await readJson<DataResponse<TenantChoice>>(response)).data;
}


export type Product = {
  ulid: string;
  sku: string;
  name: string;
  barcode: string | null;
  sale_price: string;
  category_ulid?: string | null;
  subcategory_ulid?: string | null;
  brand_ulid?: string | null;
  unit_ulid?: string | null;
  is_active: boolean;
};

type ProductPage = { data: Product[]; current_page: number; last_page: number; total: number };

export async function listProducts(tenantUlid: string, query = '', signal?: AbortSignal): Promise<ProductPage> {
  const parameters = new URLSearchParams();
  if (query.trim()) parameters.set('q', query.trim());
  const qs = parameters.toString();
  const response = await fetch(`/api/tenants/${encodeURIComponent(tenantUlid)}/products${qs ? `?${qs}` : ''}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
    headers: { Accept: 'application/json' },
  });
  return readJson<ProductPage>(response);
}

export async function createProduct(
  tenantUlid: string,
  input: { sku: string; name: string; barcode: string; sale_price: string;
    category_ulid?: string | null; subcategory_ulid?: string | null;
    brand_ulid?: string | null; unit_ulid?: string | null },
): Promise<Product> {
  return (await post<DataResponse<Product>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/products`,
    { ...input, barcode: input.barcode.trim() || null },
  )).data;
}


export type PartyType = 'customer' | 'supplier';
export type Party = {
  ulid: string;
  type: PartyType;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
};

export async function listParties(tenantUlid: string, type: PartyType, query = ''): Promise<{ data: Party[]; total: number }> {
  const parameters = new URLSearchParams({ type });
  if (query.trim()) parameters.set('q', query.trim());
  const response = await fetch(`/api/tenants/${encodeURIComponent(tenantUlid)}/parties?${parameters.toString()}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  return readJson<{ data: Party[]; total: number }>(response);
}

export async function createParty(
  tenantUlid: string,
  input: { type: PartyType; name: string; phone: string; email: string; address: string },
): Promise<Party> {
  return (await post<DataResponse<Party>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/parties`,
    {
      type: input.type,
      name: input.name,
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      address: input.address.trim() || null,
    },
  )).data;
}


export type Warehouse = { ulid: string; code: string; name: string; is_active: boolean };
export type StockBalance = {
  warehouse_ulid: string; warehouse_name: string;
  product_ulid: string; sku: string; product_name: string; quantity: string;
};
export type StockMovement = {
  ulid: string; type: 'opening' | 'receipt' | 'sale' | 'sale_return'; quantity: string;
  unit_cost: string; note: string | null; created_at: string;
  product_name: string; warehouse_name: string;
};
export type InventoryOverview = {
  balances: StockBalance[];
  movements: StockMovement[];
  warehouse_count: number;
};

async function getData<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin', cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  return (await readJson<DataResponse<T>>(res)).data;
}

export function listWarehouses(tenantUlid: string): Promise<Warehouse[]> {
  return getData<Warehouse[]>(`/api/tenants/${encodeURIComponent(tenantUlid)}/warehouses`);
}
export function createWarehouse(tenantUlid: string, input: {code: string; name: string}): Promise<Warehouse> {
  return post<DataResponse<Warehouse>>(`/api/tenants/${encodeURIComponent(tenantUlid)}/warehouses`, input)
    .then(result => result.data);
}
export function getInventory(tenantUlid: string): Promise<InventoryOverview> {
  return getData<InventoryOverview>(`/api/tenants/${encodeURIComponent(tenantUlid)}/inventory`);
}
export function receiveStock(tenantUlid: string, input: {
  warehouse_ulid: string; product_ulid: string; idempotency_key: string;
  type: 'opening' | 'receipt'; quantity: string; unit_cost: string; note: string;
}): Promise<{ ulid: string; replayed: boolean }> {
  return post<DataResponse<{ ulid: string; replayed: boolean }>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/inventory/receive`, input,
  ).then(result => result.data);
}


// Local development transaction pilots. Only backend calculates authoritative totals.
export type PurchaseRecord = {
  ulid: string; reference: string | null; total: string; status: string;
  created_at: string; supplier_name: string; warehouse_name: string;
};
export type PurchaseInput = {
  supplier_ulid: string; warehouse_ulid: string; idempotency_key: string; reference: string;
  lines: { product_ulid: string; quantity: string; unit_cost: string }[];
};
export type TransactionResult = { ulid: string; total: string; replayed: boolean; change_due?: string };
export type SaleRecord = {
  ulid: string; total: string; amount_paid: string; change_due: string;
  status: string; created_at: string; customer_name: string | null;
};
export type SaleInput = {
  warehouse_ulid: string; customer_ulid: string | null; idempotency_key: string;
  amount_paid: string; hold_ulid?: string | null;
  lines: { product_ulid: string; quantity: string }[];
};
export type SaleReceipt = {
  sale: SaleRecord & {
    subtotal: string; payment_method: string; warehouse_name: string;
  };
  lines: { ulid: string; sku: string; product_name: string;
    quantity: string; unit_price: string; line_total: string }[];
};

export function listPurchases(tenantUlid: string): Promise<PurchaseRecord[]> {
  return getData<PurchaseRecord[]>(`/api/tenants/${encodeURIComponent(tenantUlid)}/purchases`);
}
export function postPurchase(tenantUlid: string, input: PurchaseInput): Promise<TransactionResult> {
  return post<DataResponse<TransactionResult>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/purchases`, input,
  ).then(result => result.data);
}
export function listSales(tenantUlid: string): Promise<SaleRecord[]> {
  return getData<SaleRecord[]>(`/api/tenants/${encodeURIComponent(tenantUlid)}/sales`);
}
export function postSale(tenantUlid: string, input: SaleInput): Promise<TransactionResult> {
  return post<DataResponse<TransactionResult>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/sales`, input,
  ).then(result => result.data);
}
export function getSaleReceipt(tenantUlid: string, saleUlid: string): Promise<SaleReceipt> {
  return getData<SaleReceipt>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/sales/${encodeURIComponent(saleUlid)}`,
  );
}

export type OperationsReport = {
  cash_sales: { count: number; total: string };
  cash_returns: { count: number; total: string };
  net_cash_sales: string;
  purchases: { count: number; total: string };
  stocked_product_locations: number;
  daily_cash_sales: { day: string; sale_count: number; total: string }[];
  disclaimer: string;
};
export function getOperationsReport(tenantUlid: string): Promise<OperationsReport> {
  return getData<OperationsReport>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/reports/operations`,
  );
}


export type SaleReturnRecord = {
  ulid: string; sale_ulid: string; reason: string; refund_total: string;
  refund_method: string; status: string; created_at: string;
};
export type SaleReturnInput = {
  sale_ulid: string; idempotency_key: string; reason: string;
  lines: { sale_line_ulid: string; quantity: string }[];
};
export type SaleReturnResult = {
  ulid: string; sale_ulid: string; refund_total: string; replayed: boolean;
};
export function listSaleReturns(tenantUlid: string): Promise<SaleReturnRecord[]> {
  return getData<SaleReturnRecord[]>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/sale-returns`,
  );
}
export function postSaleReturn(tenantUlid: string, input: SaleReturnInput): Promise<SaleReturnResult> {
  return post<DataResponse<SaleReturnResult>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/sale-returns`, input,
  ).then(result => result.data);
}


export type CashShift = {
  ulid: string; opening_cash: string; opening_note: string | null; created_at: string;
  warehouse_ulid: string; warehouse_name: string; is_open: boolean;
  closure_ulid: string | null; cash_sales: string; cash_refunds: string;
  expected_cash: string; counted_cash: string | null; difference: string | null;
  closed_at: string | null;
};
export type CashClosure = {
  closure_ulid: string; cash_sales: string; cash_refunds: string;
  expected_cash: string; counted_cash: string; difference: string;
};
export function listCashShifts(tenantUlid: string): Promise<CashShift[]> {
  return getData<CashShift[]>(`/api/tenants/${encodeURIComponent(tenantUlid)}/cash-shifts`);
}
export function openCashShift(tenantUlid: string, payload: {
  warehouse_ulid: string; opening_cash: string; opening_note: string;
}): Promise<{ ulid: string; is_open: boolean }> {
  return post<DataResponse<{ulid: string;is_open: boolean}>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/cash-shifts`, payload,
  ).then(result => result.data);
}
export function closeCashShift(tenantUlid: string, shiftUlid: string, payload: {
  counted_cash: string; closing_note: string;
}): Promise<CashClosure> {
  return post<DataResponse<CashClosure>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/cash-shifts/${encodeURIComponent(shiftUlid)}/close`,
    payload,
  ).then(result => result.data);
}


export type SaleHold = {
  ulid: string; client_ref: string; title: string;
  warehouse_ulid: string | null; warehouse_name: string | null;
  customer_ulid: string | null; customer_name: string | null;
  amount_paid: string | null; created_at: string; updated_at: string;
  lines: { product_ulid: string; quantity: string; product: Product | null }[];
};
export type SaveSaleHold = {
  client_ref: string; title: string; warehouse_ulid: string | null;
  customer_ulid: string | null; amount_paid: string | null;
  lines: { product_ulid: string; quantity: string }[];
};
export function listSaleHolds(tenantUlid: string): Promise<SaleHold[]> {
  return getData<SaleHold[]>(`/api/tenants/${encodeURIComponent(tenantUlid)}/sale-holds`);
}
export function saveSaleHold(tenantUlid: string, payload: SaveSaleHold): Promise<{ulid: string; saved: boolean}> {
  return post<DataResponse<{ulid: string; saved: boolean}>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/sale-holds`, payload,
  ).then(result => result.data);
}
export function discardSaleHold(tenantUlid: string, ulid: string): Promise<{discarded: boolean}> {
  return post<DataResponse<{discarded: boolean}>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/sale-holds/${encodeURIComponent(ulid)}/discard`,
  ).then(result => result.data);
}


// Real tenant-owned definition masters used by the product catalog.
export type ProductMasterKind = 'categories' | 'subcategories' | 'brands' | 'units';
export type ProductMaster = {
  ulid: string; code: string; name: string; is_active: boolean;
  category_ulid?: string; category_name?: string;
};
export function listProductMasters(tenantUlid: string, kind: ProductMasterKind): Promise<ProductMaster[]> {
  return getData<ProductMaster[]>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/definitions/${kind}`,
  );
}
export function createProductMaster(tenantUlid: string, kind: ProductMasterKind, payload: {
  code: string; name: string; category_ulid?: string;
}): Promise<ProductMaster> {
  return post<DataResponse<ProductMaster>>(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/definitions/${kind}`, payload,
  ).then(response => response.data);
}
export async function setProductMasterStatus(
  tenantUlid: string, kind: ProductMasterKind, masterUlid: string, active: boolean,
): Promise<void> {
  const token = await csrfToken();
  const response = await fetch(
    `/api/tenants/${encodeURIComponent(tenantUlid)}/definitions/${kind}/${encodeURIComponent(masterUlid)}/status`,
    {
      method: 'PATCH', credentials: 'same-origin',
      headers: {Accept:'application/json','Content-Type':'application/json','X-CSRF-TOKEN':token},
      body: JSON.stringify({is_active: active}),
    },
  );
  await readJson<DataResponse<{ulid: string; is_active: boolean}>>(response);
}


// Separate Super Admin Platform authority; never uses selected business ULID.
export type PlatformSession = { name: string; permissions: string[] };
export type PlatformOverview = { admins: number; active_admins: number; platform_staff: number };
export type PlatformAdminRecord = {
  ulid: string; name: string; status: string; created_at: string;
  owner_name: string | null; owner_email: string | null;
};
export type PlatformStaffRecord = { name: string; email: string; platform_role: string };
export type PlatformAuditRecord = {
  ulid: string; action: string; target_type: string; target_ulid: string | null;
  created_at: string; actor_name: string;
};
export async function getPlatformSession(): Promise<PlatformSession | null> {
  try { return await getData<PlatformSession>('/api/platform/me'); }
  catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) return null;
    throw error;
  }
}
export function getPlatformOverview(): Promise<PlatformOverview> {
  return getData<PlatformOverview>('/api/platform/overview');
}
export function getPlatformAdmins(): Promise<PlatformAdminRecord[]> {
  return getData<PlatformAdminRecord[]>('/api/platform/admins');
}
export function createPlatformAdmin(input: {
  business_name: string; owner_name: string; owner_email: string; password: string;
}): Promise<PlatformAdminRecord> {
  return post<DataResponse<PlatformAdminRecord>>('/api/platform/admins', input).then(r => r.data);
}
export function getPlatformStaff(): Promise<PlatformStaffRecord[]> {
  return getData<PlatformStaffRecord[]>('/api/platform/staff');
}
export function createPlatformStaff(input: {
  name: string; email: string; password: string; role: 'Support Operator' | 'Admin Manager';
}): Promise<PlatformStaffRecord> {
  return post<DataResponse<PlatformStaffRecord>>('/api/platform/staff', input).then(r => r.data);
}
export function getPlatformAudit(): Promise<PlatformAuditRecord[]> {
  return getData<PlatformAuditRecord[]>('/api/platform/audit');
}
