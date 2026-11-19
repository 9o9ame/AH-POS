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
  is_active: boolean;
};

type ProductPage = { data: Product[]; current_page: number; last_page: number; total: number };

export async function listProducts(tenantUlid: string, query = ''): Promise<ProductPage> {
  const parameters = new URLSearchParams();
  if (query.trim()) parameters.set('q', query.trim());
  const qs = parameters.toString();
  const response = await fetch(`/api/tenants/${encodeURIComponent(tenantUlid)}/products${qs ? `?${qs}` : ''}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  return readJson<ProductPage>(response);
}

export async function createProduct(
  tenantUlid: string,
  input: { sku: string; name: string; barcode: string; sale_price: string },
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
  ulid: string; type: 'opening' | 'receipt'; quantity: string;
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
