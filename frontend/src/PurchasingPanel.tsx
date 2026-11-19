import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ApiError, listWarehouses, listParties, listProducts, listPurchases, postPurchase,
  type Party, type Product, type PurchaseRecord, type TenantChoice, type Warehouse,
} from './api';
import { AppIcon } from './AppIcon';

type Line = { product_ulid: string; name: string; sku: string; quantity: string; unit_cost: string };
const currency = (amount: number) => new Intl.NumberFormat('en-PK', {
  style: 'currency', currency: 'PKR', minimumFractionDigits: 2,
}).format(amount);

export function PurchasingPanel({ tenant, onDraftChange, active = true }: {
  tenant: TenantChoice; onDraftChange?: (dirty: boolean) => void; active?: boolean;
}) {
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [supplier, setSupplier] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [reference, setReference] = useState('');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [last, setLast] = useState<{ ulid: string; total: string } | null>(null);
  const key = useRef(crypto.randomUUID());

  const refresh = useCallback(async () => {
    try {
      const [vendors, places, catalog, documents] = await Promise.all([
        listParties(tenant.ulid, 'supplier'), listWarehouses(tenant.ulid),
        listProducts(tenant.ulid), listPurchases(tenant.ulid),
      ]);
      setSuppliers(vendors.data.filter(x => x.is_active));
      setWarehouses(places.filter(x => x.is_active));
      setProducts(catalog.data.filter(x => x.is_active));
      setHistory(documents);
      setSupplier(current => current || vendors.data.find(x => x.is_active)?.ulid || '');
      setWarehouse(current => current || places.find(x => x.is_active)?.ulid || '');
    } catch {
      setError(true); setMessage('Unable to load purchasing data. Check permissions and connection.');
    }
  }, [tenant.ulid]);

  useEffect(() => { if (active) void refresh(); }, [refresh, active]);
  useEffect(() => { onDraftChange?.(lines.length > 0 || reference.trim() !== ''); }, [lines, reference, onDraftChange]);

  function add(product: Product) {
    setSearch('');
    setLines(current => current.some(line => line.product_ulid === product.ulid)
      ? current
      : [...current, { product_ulid: product.ulid, sku: product.sku,
        name: product.name, quantity: '1', unit_cost: '0.0000' }]);
  }
  const estimated = lines.reduce((sum, line) =>
    sum + Number(line.quantity || '0') * Number(line.unit_cost || '0'), 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(false); setMessage('');
    try {
      const result = await postPurchase(tenant.ulid, {
        supplier_ulid: supplier, warehouse_ulid: warehouse, idempotency_key: key.current,
        reference, lines: lines.map(({product_ulid, quantity, unit_cost}) =>
          ({ product_ulid, quantity, unit_cost })),
      });
      setLast({ ulid: result.ulid, total: result.total });
      key.current = crypto.randomUUID();
      setLines([]); setReference('');
      setMessage(result.replayed ? 'Existing purchase confirmed; no duplicate stock added.'
        : 'Purchase recorded. Stock received in the selected warehouse.');
      await refresh();
    } catch (ex) {
      setError(true);
      setMessage(ex instanceof ApiError ? ex.message : 'Could not record purchase. Verify products and quantities.');
    } finally { setBusy(false); }
  }

  return <div className="transactions-layout">
    <div className="panel-card trans-editor">
      <div className="panel-heading">
        <div><span className="small-overline">PURCHASING / GOODS RECEIPT</span><h2>New purchase</h2></div>
        <span className="status-tag">Local pilot</span>
      </div>
      <p className="muted">Supplier purchases update stock immediately. Tax, payables and accounting journals are not yet integrated.</p>
      <form onSubmit={e => { void submit(e); }}>
        <div className="field-row">
          <label>Supplier<select required value={supplier} onChange={e => setSupplier(e.target.value)}>
            <option value="">Select supplier</option>
            {suppliers.map(s => <option key={s.ulid} value={s.ulid}>{s.name}</option>)}
          </select></label>
          <label>Receiving warehouse<select required value={warehouse} onChange={e => setWarehouse(e.target.value)}>
            <option value="">Select warehouse</option>
            {warehouses.map(w => <option key={w.ulid} value={w.ulid}>{w.name}</option>)}
          </select></label>
          <label>Supplier invoice/reference<input maxLength={100} value={reference}
            onChange={e => setReference(e.target.value)} placeholder="e.g. INV-205" /></label>
        </div>
        <div className="product-picker">
          <label htmlFor="purchase-product-search">Add products</label>
          <div className="picker-input"><AppIcon name="search" size={17}/>
            <input id="purchase-product-search" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product name, SKU or barcode…" /></div>
          <div className="picker-results">
            {products.filter(p => (p.name + p.sku + (p.barcode || '')).toLowerCase()
              .includes(search.toLowerCase())).slice(0,8).map(p =>
              <button type="button" key={p.ulid} disabled={lines.some(l => l.product_ulid === p.ulid)}
                onClick={() => add(p)}>
                <span className="picker-item-icon"><AppIcon name="products" size={17}/></span>
                <span><strong>{p.name}</strong><small>{p.sku}</small></span>
                <span className="picker-add">+ Add</span>
              </button>)}
            {products.length >= 30 && <p className="muted">Showing catalog first page; full picker coming next.</p>}
          </div>
        </div>
        <div className="table-scroll"><table className="data-table trans-lines"><thead>
          <tr><th>Item</th><th>Quantity</th><th>Unit cost (PKR)</th><th className="num">Estimate</th><th/></tr>
        </thead><tbody>{lines.map((line, idx) => <tr key={line.product_ulid}>
          <td><strong>{line.name}</strong><small>{line.sku}</small></td>
          <td><input required aria-label={'Quantity '+line.name} inputMode="decimal" value={line.quantity}
            onChange={e => setLines(current => current.map((x,i) => i===idx ? {...x, quantity:e.target.value} : x))}/></td>
          <td><input required aria-label={'Unit cost '+line.name} inputMode="decimal" value={line.unit_cost}
            onChange={e => setLines(current => current.map((x,i) => i===idx ? {...x, unit_cost:e.target.value} : x))}/></td>
          <td className="num">{currency(Number(line.quantity) * Number(line.unit_cost))}</td>
          <td><button type="button" className="icon-dismiss" aria-label={'Remove '+line.name}
            onClick={() => setLines(current => current.filter((_,i)=>i!==idx))}>×</button></td>
        </tr>)}</tbody></table></div>
        {lines.length===0 && <div className="empty-transaction"><AppIcon name="package" size={28}/><strong>No items yet</strong><span>Pick a product above to build your purchase.</span></div>}
        <div className="trans-summary"><span>Estimated total</span><strong>{currency(estimated)}</strong></div>
        <button type="submit" className="primary-post" disabled={busy || lines.length===0 || !supplier || !warehouse}>
          <AppIcon name="check" size={18}/>{busy?'Recording…':'Record purchase & receive stock'}
        </button>
      </form>
      {message && <p className={error ? 'inline-alert':'inline-success'} role="status">{message}</p>}
      {last && <div className="receipt-success"><strong>Server total: {last.total} PKR</strong><span>Document: {last.ulid}</span></div>}
    </div>
    <div className="panel-card trans-history">
      <div className="panel-heading"><div><span className="small-overline">RECENT DOCUMENTS</span><h2>Purchase history</h2></div>
        <button type="button" className="btn-ghost" onClick={() => void refresh()}>Refresh</button></div>
      {history.map(doc => <div className="history-entry" key={doc.ulid}>
        <div><strong>{doc.supplier_name}</strong><span>{doc.reference || doc.ulid.slice(-8)}</span>
          <small>{new Date(doc.created_at).toLocaleString()} · {doc.warehouse_name}</small></div>
        <b>{currency(Number(doc.total))}</b>
      </div>)}
      {history.length===0 && <p className="empty-copy">No purchases recorded yet.</p>}
    </div>
  </div>;
}
