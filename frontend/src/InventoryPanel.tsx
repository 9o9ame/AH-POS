import { EntityModal, TableSkeleton } from './EntityModal';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ApiError, createWarehouse, getInventory, listProducts, listWarehouses, receiveStock,
  type InventoryOverview, type Product, type TenantChoice, type Warehouse,
} from './api';

export function InventoryPanel({ tenant }: { tenant: TenantChoice }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [editor, setEditor] = useState<'warehouse'|'receipt'|null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [warehouse, setWarehouse] = useState({ code: '', name: '' });
  const [receipt, setReceipt] = useState({
    warehouse_ulid: '', product_ulid: '', type: 'opening' as 'opening' | 'receipt',
    quantity: '1', unit_cost: '0.0000', note: '',
  });
  const receiptKey = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [locations, catalog, inventory] = await Promise.all([
        listWarehouses(tenant.ulid), listProducts(tenant.ulid), getInventory(tenant.ulid),
      ]);
      setWarehouses(locations.filter(w => w.is_active));
      setProducts(catalog.data.filter(p => p.is_active));
      setOverview(inventory);
      setReceipt(v => ({
        ...v,
        warehouse_ulid: locations.some(w => w.ulid === v.warehouse_ulid)
          ? v.warehouse_ulid : (locations.find(w => w.is_active)?.ulid || ''),
        product_ulid: catalog.data.some(p => p.ulid === v.product_ulid)
          ? v.product_ulid : (catalog.data.find(p => p.is_active)?.ulid || ''),
      }));
    } catch (e) {
      setError(true);
      setMessage(e instanceof ApiError && e.status === 403
        ? 'Inventory permissions missing. Ask your Admin for inventory permissions.'
        : 'Unable to load warehouses or inventory.');
    } finally { setLoading(false); }
  }, [tenant.ulid]);

  useEffect(() => { void load(); }, [load]);

  async function addWarehouse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(false); setMessage('');
    try {
      const created = await createWarehouse(tenant.ulid, warehouse);
      setWarehouse({ code: '', name: '' });
      setEditor(null);
      await load();
      setReceipt(v => ({ ...v, warehouse_ulid: created.ulid }));
      setMessage(`Warehouse ${created.name} created.`);
    } catch (err) {
      setError(true);
      setMessage(err instanceof ApiError && err.status === 422
        ? 'Warehouse code must be unique and contain only letters, numbers, - or _.'
        : 'Could not create warehouse. Check your permission and connection.');
    } finally { setBusy(false); }
  }

  async function postReceipt(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(false); setMessage('');
    try {
      const saved = await receiveStock(tenant.ulid, {
        ...receipt, idempotency_key: receiptKey.current,
      });
      receiptKey.current = crypto.randomUUID();
      setReceipt(v => ({ ...v, quantity: '1', note: '' }));
      setEditor(null);
      await load();
      setMessage(saved.replayed ? 'Existing receipt confirmed; no duplicate stock added.'
        : 'Stock received successfully. Inventory balance updated.');
    } catch (err) {
      setError(true);
      setMessage(err instanceof ApiError && err.status === 422
        ? 'Enter a positive quantity (up to 6 decimals) and non-negative unit cost (up to 4 decimals).'
        : err instanceof ApiError && err.status === 409
          ? 'Duplicate receipt conflict. Review movements before retrying.'
          : 'Could not receive stock. Verify the product/warehouse and permissions.');
    } finally { setBusy(false); }
  }

  return (
    <div className="inventory-layout">
      <section className="panel-card inventory-toolbar">
        <div className="panel-heading"><div><span className="small-overline">INVENTORY / LOCATIONS</span><h2>Warehouses and stock movements</h2></div>
          <div className="dense-actions"><span className="count-pill">{warehouses.length} active warehouses</span>
            <button className="list-create-button" type="button" onClick={()=>setEditor('warehouse')}>+ Warehouse</button>
            <button className="list-create-button" type="button" onClick={()=>setEditor('receipt')}>+ Stock inward</button>
          </div></div>
        <div className="chip-row">{warehouses.map(w=><span className="location-chip" key={w.ulid}>{w.name} <small>{w.code}</small></span>)}</div>
      </section>
      {editor === 'warehouse' && <EntityModal title="Create Warehouse" subtitle="Add a new storage location for the current Admin." onClose={()=>setEditor(null)} busy={busy} error={error ? message : undefined}>
        <form className="compact-form" onSubmit={e => { void addWarehouse(e); }}>
          <div className="field-row">
            <label>Code<input required maxLength={40} placeholder="MAIN" value={warehouse.code}
              onChange={e => setWarehouse(v => ({ ...v, code: e.target.value }))} /></label>
            <label>Warehouse name<input required maxLength={160} placeholder="Main Store"
              value={warehouse.name} onChange={e => setWarehouse(v => ({ ...v, name: e.target.value }))} /></label>
          </div>
          <button type="submit" disabled={busy}>+ Add warehouse</button>
        </form>

      </EntityModal>}
      {editor === 'receipt' && <EntityModal title="Receive Stock" subtitle="Immutable inventory ledger entry. Backend validates quantities and permissions." onClose={()=>setEditor(null)} busy={busy} error={error ? message : undefined}>
        <form className="compact-form" onSubmit={e => { void postReceipt(e); }}>
          <div className="field-row">
            <label>Warehouse<select required value={receipt.warehouse_ulid} onChange={e => setReceipt(v => ({...v, warehouse_ulid: e.target.value}))}>
              <option value="">Select warehouse</option>
              {warehouses.map(w => <option key={w.ulid} value={w.ulid}>{w.name}</option>)}
            </select></label>
            <label>Product<select required value={receipt.product_ulid} onChange={e => setReceipt(v => ({...v, product_ulid: e.target.value}))}>
              <option value="">Select product</option>
              {products.map(p => <option key={p.ulid} value={p.ulid}>{p.name} ({p.sku})</option>)}
            </select></label>
            <label>Receipt type<select value={receipt.type} onChange={e => setReceipt(v => ({...v, type: e.target.value as 'opening' | 'receipt'}))}>
              <option value="opening">Opening balance</option>
              <option value="receipt">Goods received</option>
            </select></label>
            <label>Quantity<input required inputMode="decimal" value={receipt.quantity} onChange={e => setReceipt(v => ({...v, quantity: e.target.value}))} /></label>
            <label>Unit cost (PKR)<input required inputMode="decimal" value={receipt.unit_cost} onChange={e => setReceipt(v => ({...v, unit_cost: e.target.value}))} /></label>
            <label>Note<input maxLength={500} value={receipt.note} placeholder="Optional reference" onChange={e => setReceipt(v => ({...v, note: e.target.value}))} /></label>
          </div>
          <button type="submit" disabled={busy || warehouses.length === 0 || products.length === 0}>{busy ? 'Recording…' : 'Record stock inward'}</button>
        </form>

      </EntityModal>}

      <div className="panel-card panel-wide">
        <div className="panel-heading"><div><span className="small-overline">LIVE STOCK</span><h2>Warehouse balances</h2></div>
          <button type="button" className="btn-ghost" onClick={() => void load()}>Refresh</button></div>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>SKU</th><th>Product</th><th>Warehouse</th><th className="num">Available qty</th></tr></thead>
          <tbody>{overview?.balances.map(b => <tr key={b.product_ulid + b.warehouse_ulid}>
            <td>{b.sku}</td><td>{b.product_name}</td><td>{b.warehouse_name}</td><td className="num"><strong>{b.quantity}</strong></td>
          </tr>)}</tbody>
        </table></div>
        {loading && <TableSkeleton rows={5} cols={4}/>}
        {!loading && !overview?.balances.length && <p className="empty-copy">No stock entries yet. Record an opening balance above.</p>}
        {(overview?.balances.length || 0) >= 100 && <p className="muted">Showing first 100 balance rows.</p>}
      </div>
      <div className="panel-card panel-wide">
        <div className="panel-heading"><div><span className="small-overline">AUDIT TRAIL</span><h2>Recent stock movements</h2></div>
          <span className="count-pill">Last 30</span></div>
        <div className="table-scroll"><table className="data-table"><thead>
          <tr><th>Date</th><th>Type</th><th>Product</th><th>Warehouse</th><th className="num">Signed qty</th><th className="num">Unit cost</th></tr>
        </thead><tbody>{overview?.movements.map(m => <tr key={m.ulid}>
          <td>{new Date(m.created_at).toLocaleString()}</td><td>{m.type}</td><td>{m.product_name}</td>
          <td>{m.warehouse_name}</td><td className="num">{m.quantity}</td><td className="num">PKR {m.unit_cost}</td>
        </tr>)}</tbody></table></div>
        {loading && <TableSkeleton rows={5} cols={6}/>}
        {!loading && !overview?.movements.length && <p className="empty-copy">No stock movements recorded yet.</p>}
      </div>
      {message && <p role="status" className={error ? 'inline-alert' : 'inline-success'}>{message}</p>}
    </div>
  );
}
