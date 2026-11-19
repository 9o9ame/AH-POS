import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, createProduct, listProducts, type Product, type TenantChoice } from './api';

export function ProductsPanel({ tenant }: { tenant: TenantChoice }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [input, setInput] = useState({ sku: '', name: '', barcode: '', sale_price: '0.0000' });
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [canRead, setCanRead] = useState(true);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const page = await listProducts(tenant.ulid, q);
      setProducts(page.data);
      setTotal(page.total);
      setCanRead(true);
    } catch (error) {
      setProducts([]);
      if (error instanceof ApiError && error.status === 403) {
        setCanRead(false);
        setMessage('Catalog access is not assigned. Ask your local administrator for products.read permission.');
      } else {
        setMessage('Could not load products. Please retry.');
      }
    } finally {
      setSearching(false);
    }
  }, [tenant.ulid]);

  useEffect(() => {
    void refresh('');
  }, [refresh]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const created = await createProduct(tenant.ulid, input);
      setInput({ sku: '', name: '', barcode: '', sale_price: '0.0000' });
      setMessage(`Product "${created.name}" saved successfully.`);
      await refresh(query);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setMessage('You do not have products.create permission for this tenant.');
      } else if (error instanceof ApiError && error.status === 422) {
        setMessage('Invalid product details, or the SKU/barcode already exists for this tenant.');
      } else {
        setMessage('Unable to save product.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section catalog" aria-labelledby="catalog-title">
      <div className="between">
        <div>
          <h2 id="catalog-title">Products — {tenant.name}</h2>
          <p>Tenant-scoped catalog. Stock and purchasing are not connected yet.</p>
        </div>
        <span className="catalog-count">{total} products</span>
      </div>

      {canRead && (
        <>
          <form className="catalog-form" onSubmit={(event) => void add(event)}>
            <h3>Add product</h3>
            <div className="catalog-fields">
              <label>SKU
                <input required maxLength={64} value={input.sku} onChange={e => setInput(v => ({ ...v, sku: e.target.value }))} placeholder="SKU-001" />
              </label>
              <label>Product name
                <input required maxLength={180} value={input.name} onChange={e => setInput(v => ({ ...v, name: e.target.value }))} placeholder="Product name" />
              </label>
              <label>Barcode (optional)
                <input maxLength={100} value={input.barcode} onChange={e => setInput(v => ({ ...v, barcode: e.target.value }))} placeholder="Barcode" />
              </label>
              <label>Sale price (PKR)
                <input required inputMode="decimal" pattern="(0|[1-9][0-9]{0,15})(\\.[0-9]{1,4})?" value={input.sale_price} onChange={e => setInput(v => ({ ...v, sale_price: e.target.value }))} />
              </label>
            </div>
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
          </form>

          <form className="catalog-search" onSubmit={e => { e.preventDefault(); void refresh(query); }}>
            <label htmlFor="product-search">Search products</label>
            <div className="catalog-search-row">
              <input id="product-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, SKU or barcode" maxLength={120} />
              <button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
            </div>
          </form>
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead><tr><th>SKU</th><th>Product</th><th>Barcode</th><th>Sale price</th><th>Status</th></tr></thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.ulid}>
                    <td>{product.sku}</td><td>{product.name}</td><td>{product.barcode || '—'}</td>
                    <td>PKR {product.sale_price}</td><td>{product.is_active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <p>{searching ? 'Loading…' : 'No products found.'}</p>}
            {total > 30 && <p>Showing first 30 products. Pagination UI is pending.</p>}
          </div>
        </>
      )}
      {message && <p role="status" className="notice">{message}</p>}
    </section>
  );
}
