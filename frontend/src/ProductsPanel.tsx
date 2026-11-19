import { EntityModal, TableSkeleton } from './EntityModal';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, createProduct, listProducts, listProductMasters, type Product, type ProductMaster, type TenantChoice } from './api';

export function ProductsPanel({ tenant }: { tenant: TenantChoice }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const blank = { sku: '', name: '', barcode: '', sale_price: '0.0000',
    category_ulid: '', subcategory_ulid: '', brand_ulid: '', unit_ulid: '' };
  const [input, setInput] = useState(blank);
  const [masters, setMasters] = useState<{
    categories: ProductMaster[]; subcategories: ProductMaster[];
    brands: ProductMaster[]; units: ProductMaster[];
  }>({categories:[],subcategories:[],brands:[],units:[]});
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
    let active = true;
    void Promise.all([
      listProductMasters(tenant.ulid,'categories'),
      listProductMasters(tenant.ulid,'subcategories'),
      listProductMasters(tenant.ulid,'brands'),
      listProductMasters(tenant.ulid,'units'),
    ]).then(([categories,subcategories,brands,units])=>{
      if(active)setMasters({categories,subcategories,brands,units});
    }).catch(()=>{ if(active)setMessage('Products loaded; definition master choices are unavailable.'); });
    return ()=>{active=false};
  }, [refresh,tenant.ulid]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const created = await createProduct(tenant.ulid, {
        ...input,
        category_ulid: input.category_ulid || null,
        subcategory_ulid: input.subcategory_ulid || null,
        brand_ulid: input.brand_ulid || null,
        unit_ulid: input.unit_ulid || null,
      });
      setInput(blank);
      setEditorOpen(false);
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
          <p>Tenant-scoped product catalog linked to category, brand and unit masters. Inventory and purchasing use these product SKUs.</p>
        </div>
        <div className="dense-actions"><span className="catalog-count">{total} products</span>
          <button type="button" className="list-create-button" onClick={() => setEditorOpen(true)}>+ Add Product</button>
        </div>
      </div>

      {canRead && (
        <>
          {editorOpen && <EntityModal title="Add Product" subtitle="Create an authorized catalog record in this Admin workspace." onClose={() => setEditorOpen(false)} busy={busy} error={message || undefined}>
          <form className="catalog-form modal-entry-form" onSubmit={(event) => void add(event)}>
            
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
              <label>Category (optional)
                <select value={input.category_ulid} onChange={e=>setInput(v=>({...v,category_ulid:e.target.value,subcategory_ulid:''}))}>
                  <option value="">Uncategorized</option>
                  {masters.categories.filter(x=>x.is_active).map(x=><option value={x.ulid} key={x.ulid}>{x.name}</option>)}
                </select>
              </label>
              <label>Sub Category (optional)
                <select value={input.subcategory_ulid} disabled={!input.category_ulid}
                  onChange={e=>setInput(v=>({...v,subcategory_ulid:e.target.value}))}>
                  <option value="">None</option>
                  {masters.subcategories.filter(x=>x.is_active&&x.category_ulid===input.category_ulid)
                    .map(x=><option value={x.ulid} key={x.ulid}>{x.name}</option>)}
                </select>
              </label>
              <label>Brand (optional)
                <select value={input.brand_ulid} onChange={e=>setInput(v=>({...v,brand_ulid:e.target.value}))}>
                  <option value="">No brand</option>
                  {masters.brands.filter(x=>x.is_active).map(x=><option value={x.ulid} key={x.ulid}>{x.name}</option>)}
                </select>
              </label>
              <label>Base Unit (optional)
                <select value={input.unit_ulid} onChange={e=>setInput(v=>({...v,unit_ulid:e.target.value}))}>
                  <option value="">Unspecified</option>
                  {masters.units.filter(x=>x.is_active).map(x=><option value={x.ulid} key={x.ulid}>{x.name}</option>)}
                </select>
              </label>
            </div>
            <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
          </form>

          </EntityModal>}
          <form className="catalog-search" onSubmit={e => { e.preventDefault(); void refresh(query); }}>
            <label htmlFor="product-search">Search products</label>
            <div className="catalog-search-row">
              <input id="product-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, SKU or barcode" maxLength={120} />
              <button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
            </div>
          </form>
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Brand / Unit</th><th>Barcode</th><th>Sale price</th><th>Status</th></tr></thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.ulid}>
                    <td>{product.sku}</td><td>{product.name}</td>
                    <td>{masters.categories.find(x=>x.ulid===product.category_ulid)?.name||'—'}</td>
                    <td>{[masters.brands.find(x=>x.ulid===product.brand_ulid)?.name,masters.units.find(x=>x.ulid===product.unit_ulid)?.code].filter(Boolean).join(' / ')||'—'}</td>
                    <td>{product.barcode || '—'}</td>
                    <td>PKR {product.sale_price}</td><td>{product.is_active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {searching && <TableSkeleton rows={4} cols={7}/>}
            {!searching && products.length === 0 && <p>No products found.</p>}
            {total > 30 && <p>Showing first 30 products. Pagination UI is pending.</p>}
          </div>
        </>
      )}
      {message && <p role="status" className="notice">{message}</p>}
    </section>
  );
}
