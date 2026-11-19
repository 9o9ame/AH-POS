import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ApiError, getInventory, getSaleReceipt, listParties, listProducts, listSales, listWarehouses, postSale,
  type Party, type Product, type SaleReceipt, type SaleRecord, type StockBalance, type TenantChoice, type Warehouse,
} from './api';
import { AppIcon } from './AppIcon';

type CartLine = { product: Product; quantity: string };
const money = (value: number) => new Intl.NumberFormat('en-PK', {
  style: 'currency', currency: 'PKR', minimumFractionDigits: 2,
}).format(value);

export function PosPanel({ tenant }: { tenant: TenantChoice }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState('');
  const [customers, setCustomers] = useState<Party[]>([]);
  const [customer, setCustomer] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cash, setCash] = useState('');
  const [history, setHistory] = useState<SaleRecord[]>([]);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const key = useRef(crypto.randomUUID());
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [locations, people, catalog, inventory, sales] = await Promise.all([
        listWarehouses(tenant.ulid), listParties(tenant.ulid, 'customer'),
        listProducts(tenant.ulid), getInventory(tenant.ulid), listSales(tenant.ulid),
      ]);
      setWarehouses(locations.filter(x => x.is_active));
      setWarehouse(current => current || locations.find(x => x.is_active)?.ulid || '');
      setCustomers(people.data.filter(x => x.is_active));
      setProducts(catalog.data.filter(x => x.is_active));
      setBalances(inventory.balances);
      setHistory(sales);
    } catch {
      setError(true); setStatus('Could not load checkout data. Verify permissions and server.');
    }
  }, [tenant.ulid]);
  useEffect(() => { void load(); }, [load]);

  async function queryCatalog(query: string) {
    setLoading(true);
    try {
      const result = await listProducts(tenant.ulid, query);
      setProducts(result.data.filter(p => p.is_active));
    } catch {
      setStatus('Product search unavailable. Please retry.'); setError(true);
    } finally { setLoading(false); }
  }

  function add(product: Product) {
    setCart(lines => {
      const exists = lines.some(line => line.product.ulid === product.ulid);
      return exists ? lines.map(line => line.product.ulid === product.ulid
        ? {...line, quantity: String(Number(line.quantity || '0') + 1)} : line)
        : [...lines, { product, quantity: '1' }];
    });
    setSearch('');
    searchRef.current?.focus();
  }

  async function onBarcode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!search.trim()) return;
    const found = products.find(p =>
      p.sku.toLowerCase() === search.trim().toLowerCase()
      || p.barcode?.toLowerCase() === search.trim().toLowerCase());
    if (found) { add(found); return; }
    try {
      const results = await listProducts(tenant.ulid, search.trim());
      const exact = results.data.find(p => p.is_active &&
        (p.sku.toLowerCase() === search.trim().toLowerCase()
          || p.barcode?.toLowerCase() === search.trim().toLowerCase()));
      if (exact) add(exact);
      else setProducts(results.data.filter(p => p.is_active));
    } catch { setError(true); setStatus('Barcode lookup failed.'); }
  }

  const estimated = useMemo(() => cart.reduce((total, line) =>
    total + Number(line.quantity || 0) * Number(line.product.sale_price), 0), [cart]);
  const cartQty = cart.reduce((count, line) => count + Number(line.quantity || 0), 0);
  const changeEstimate = Number(cash || 0) - estimated;

  async function checkout() {
    if (!warehouse || cart.length === 0 || busy) return;
    setBusy(true); setError(false); setStatus('');
    try {
      const saved = await postSale(tenant.ulid, {
        warehouse_ulid: warehouse, customer_ulid: customer || null,
        idempotency_key: key.current, amount_paid: cash,
        lines: cart.map(line => ({ product_ulid: line.product.ulid, quantity: line.quantity })),
      });
      const details = await getSaleReceipt(tenant.ulid, saved.ulid);
      setReceipt(details);
      key.current = crypto.randomUUID();
      setCart([]); setCash('');
      setStatus(saved.replayed ? 'Existing sale confirmed; stock was not deducted twice.'
        : 'Cash sale recorded. Receipt ready to print.');
      await load();
    } catch (exception) {
      setError(true);
      setStatus(exception instanceof ApiError
        ? exception.message : 'Could not complete checkout. Review the cart and retry.');
    } finally { setBusy(false); }
  }

  async function showReceipt(ulid: string) {
    try { setReceipt(await getSaleReceipt(tenant.ulid, ulid)); }
    catch { setError(true); setStatus('Unable to fetch sale receipt.'); }
  }

  return <div className="pos-layout">
    <section className="panel-card pos-catalog">
      <div className="panel-heading"><div><span className="small-overline">CASHIER WORKSPACE</span><h2>Product selection</h2></div>
        <span className="status-tag">Cash · Local pilot</span></div>
      <form className="pos-search-box" onSubmit={e => { void onBarcode(e); }}>
        <AppIcon name="search" size={20}/>
        <input ref={searchRef} placeholder="Scan barcode or search product / SKU" value={search}
          aria-label="Search or scan products"
          onChange={e => { setSearch(e.target.value); void queryCatalog(e.target.value); }}/>
        <kbd>ENTER</kbd>
      </form>
      <div className="pos-product-grid">
        {products.map(product => {
          const available = balances.find(b => b.product_ulid === product.ulid
            && b.warehouse_ulid === warehouse)?.quantity ?? '0';
          return <button type="button" className="pos-product" key={product.ulid}
            onClick={() => add(product)}>
            <span className="pos-product-art"><AppIcon name="package" size={26}/></span>
            <span className="pos-product-text"><strong>{product.name}</strong><small>{product.sku}</small>
              <b>{money(Number(product.sale_price))}</b>
              <small className={Number(available)>0 ? 'stock-positive' : 'stock-empty'}>{available} available</small>
            </span>
          </button>;
        })}
      </div>
      {loading && <p className="muted">Searching…</p>}
      {products.length === 0 && <p className="empty-copy">No matching products.</p>}
      <p className="muted">Select a warehouse to view its stock. Final price and stock are verified on the server.</p>
    </section>

    <section className="panel-card pos-checkout">
      <div className="panel-heading"><div><span className="small-overline">NEW CASH SALE</span><h2>Current cart <span className="count-pill">{cartQty} items</span></h2></div>
        <button type="button" className="btn-ghost" disabled={cart.length===0} onClick={() => setCart([])}>Clear</button></div>
      <div className="pos-selectors">
        <label>Sale warehouse<select required value={warehouse} onChange={e => setWarehouse(e.target.value)}>
          <option value="">Select warehouse</option>{warehouses.map(w => <option key={w.ulid} value={w.ulid}>{w.name}</option>)}
        </select></label>
        <label>Customer<select value={customer} onChange={e => setCustomer(e.target.value)}>
          <option value="">Walk-in customer</option>{customers.map(c => <option key={c.ulid} value={c.ulid}>{c.name}</option>)}
        </select></label>
      </div>
      <div className="pos-cart-lines">
        {cart.map((line, index) => <div className="pos-cart-row" key={line.product.ulid}>
          <div className="cart-product-icon"><AppIcon name="package" size={18}/></div>
          <div className="cart-name"><strong>{line.product.name}</strong><small>{line.product.sku} · {money(Number(line.product.sale_price))} each</small></div>
          <input type="text" inputMode="decimal" aria-label={'Quantity '+line.product.name} value={line.quantity}
            onChange={e => setCart(lines => lines.map((x,i) => index===i ? {...x, quantity:e.target.value} : x))}/>
          <b>{money(Number(line.quantity || 0) * Number(line.product.sale_price))}</b>
          <button type="button" className="icon-dismiss" aria-label={'Remove '+line.product.name}
            onClick={() => setCart(lines => lines.filter((_,i) => i!==index))}>×</button>
        </div>)}
        {cart.length===0 && <div className="empty-transaction"><AppIcon name="sales" size={31}/><strong>Your cart is empty</strong><span>Scan a barcode or select products to start a sale.</span></div>}
      </div>
      <div className="pos-totals">
        <div><span>Estimated subtotal</span><strong>{money(estimated)}</strong></div>
        <div><span>Tax & discounts</span><span>Not configured</span></div>
        <div className="pos-total"><span>Estimated total</span><strong>{money(estimated)}</strong></div>
        <label>Cash received (PKR)<input type="text" inputMode="decimal" value={cash} placeholder="0.00"
          onChange={e => setCash(e.target.value)}/></label>
        <button type="button" className="exact-cash" onClick={() => setCash(estimated.toFixed(4))}>
          Use exact cash
        </button>
        <div><span>Estimated change</span><strong>{money(Math.max(0,changeEstimate))}</strong></div>
      </div>
      <button type="button" className="primary-post pos-pay-button"
        disabled={busy || cart.length===0 || !warehouse || !cash || changeEstimate < -0.0001}
        onClick={() => void checkout()}>
        <AppIcon name="check" size={20}/>{busy ? 'Completing sale…' : 'Complete cash sale'}
      </button>
      <p className="pos-warning">Development-only transactions. Accounting, cost valuation, fiscal tax and payment integrations are not ready for production.</p>
      {status && <p role="status" className={error?'inline-alert':'inline-success'}>{status}</p>}
    </section>

    <section className="panel-card pos-sales-history">
      <div className="panel-heading"><div><span className="small-overline">RECENT CASH SALES</span><h2>Sales history</h2></div>
        <button type="button" className="btn-ghost" onClick={() => void load()}>Refresh</button></div>
      <div className="pos-history-grid">
        {history.map(sale => <button type="button" className="sale-history-item" key={sale.ulid} onClick={() => void showReceipt(sale.ulid)}>
          <span><strong>#{sale.ulid.slice(-8)}</strong><small>{sale.customer_name || 'Walk-in'} · {new Date(sale.created_at).toLocaleString()}</small></span>
          <b>{money(Number(sale.total))}</b><AppIcon name="arrow" size={16}/>
        </button>)}
        {history.length===0 && <p className="empty-copy">No cash sales yet.</p>}
      </div>
    </section>

    {receipt && <div className="receipt-overlay" role="presentation" onMouseDown={e => { if (e.target===e.currentTarget) setReceipt(null); }}>
      <section className="receipt-modal" role="dialog" aria-modal="true" aria-label="Sale receipt">
        <div className="receipt-actions">
          <strong>Sale receipt</strong><div>
            <button type="button" onClick={() => window.print()}>Print receipt</button>
            <button type="button" className="btn-ghost" onClick={() => setReceipt(null)}>Close</button>
          </div>
        </div>
        <div className="print-receipt" id="ahpos-receipt">
          <h2>AH POS</h2><p>{tenant.name} · CASH RECEIPT</p>
          <div className="receipt-divider"/>
          <dl><div><dt>Invoice</dt><dd>#{receipt.sale.ulid.slice(-10)}</dd></div>
            <div><dt>Date</dt><dd>{new Date(receipt.sale.created_at).toLocaleString()}</dd></div>
            <div><dt>Customer</dt><dd>{receipt.sale.customer_name || 'Walk-in'}</dd></div>
            <div><dt>Warehouse</dt><dd>{receipt.sale.warehouse_name}</dd></div></dl>
          <div className="receipt-divider"/>
          <table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>
            {receipt.lines.map(line => <tr key={line.ulid}><td>{line.product_name}<small>{line.sku} · {line.unit_price}</small></td>
              <td>{line.quantity}</td><td>{line.line_total}</td></tr>)}
          </tbody></table>
          <div className="receipt-divider"/>
          <dl className="receipt-money"><div><dt>Total</dt><dd>PKR {receipt.sale.total}</dd></div>
            <div><dt>Cash</dt><dd>PKR {receipt.sale.amount_paid}</dd></div>
            <div><dt>Change</dt><dd>PKR {receipt.sale.change_due}</dd></div></dl>
          <div className="receipt-divider"/><p>Thank you for your purchase.</p>
          <small>Development receipt · Not a fiscal/tax invoice</small>
        </div>
      </section>
    </div>}
  </div>;
}
