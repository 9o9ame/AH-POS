import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ApiError, createProductMaster, listProductMasters, setProductMasterStatus,
  type ProductMaster, type ProductMasterKind, type TenantChoice,
} from './api';
import { AppIcon } from './AppIcon';

const tabs: {kind: ProductMasterKind; label: string; helper: string}[] = [
  {kind:'categories',label:'Categories',helper:'Main product groups'},
  {kind:'subcategories',label:'Sub Categories',helper:'Nested below a category'},
  {kind:'brands',label:'Brands',helper:'Manufacturer and brand directory'},
  {kind:'units',label:'Units',helper:'Base product unit identity'},
];

export function ProductMastersPanel({tenant, initialKind = 'categories'}: {
  tenant: TenantChoice; initialKind?: ProductMasterKind;
}) {
  const [kind, setKind] = useState<ProductMasterKind>(initialKind);
  const [items, setItems] = useState<ProductMaster[]>([]);
  const [categories, setCategories] = useState<ProductMaster[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [current, parents] = await Promise.all([
        listProductMasters(tenant.ulid, kind),
        kind === 'subcategories' ? listProductMasters(tenant.ulid,'categories') : Promise.resolve([]),
      ]);
      setItems(current);setCategories(parents);
      setParent(v => v || parents.find(item => item.is_active)?.ulid || '');
      setError(false);
    } catch(ex) {
      setError(true);
      setMessage(ex instanceof ApiError ? ex.message : 'Unable to load definition masters.');
    }
  }, [tenant.ulid,kind]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => items.filter(x => (x.name+' '+x.code+' '+(x.category_name||''))
    .toLowerCase().includes(query.trim().toLowerCase())),[items,query]);
  const active = items.filter(x=>x.is_active).length;

  function switchTab(next: ProductMasterKind) {
    setKind(next);setName('');setCode('');setParent('');setMessage('');setQuery('');
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setMessage('');setError(false);
    try {
      await createProductMaster(tenant.ulid,kind,{
        code:code.trim().toUpperCase(),name:name.trim(),
        ...(kind==='subcategories'?{category_ulid:parent}:{}),
      });
      setName('');setCode('');
      setMessage(tabs.find(tab=>tab.kind===kind)?.label+' entry saved successfully.');
      await load();
    }catch(ex){
      setError(true);
      setMessage(ex instanceof ApiError?ex.message:'Unable to create definition master.');
    }finally{setBusy(false)}
  }
  async function toggle(item:ProductMaster){
    setBusy(true);setMessage('');setError(false);
    try{
      await setProductMasterStatus(tenant.ulid,kind,item.ulid,!item.is_active);
      setMessage(item.name+(item.is_active?' deactivated.':' activated.'));
      await load();
    }catch(ex){
      setError(true);setMessage(ex instanceof ApiError?ex.message:'Status update failed.');
    }finally{setBusy(false)}
  }
  return <div className="definition-master-workspace">
    <div className="definition-tabs" role="tablist" aria-label="Product master types">
      {tabs.map(tab=><button key={tab.kind} type="button" role="tab"
        aria-selected={kind===tab.kind} className={'definition-tab '+(kind===tab.kind?'selected':'')}
        onClick={()=>switchTab(tab.kind)}>
        <AppIcon name={tab.kind==='brands'?'products':tab.kind==='units'?'inventory':'package'} size={19}/>
        <span><strong>{tab.label}</strong><small>{tab.helper}</small></span>
      </button>)}
    </div>
    <div className="definition-master-grid">
      <section className="panel-card">
        <div className="panel-heading"><div><span className="small-overline">DEFINITIONS / MASTER RECORDS</span>
          <h2>Add {kind==='subcategories'?'sub category':kind.slice(0,-1)}</h2></div>
          <span className="status-tag">Tenant scoped</span></div>
        <p className="muted">Code and name are unique within this tenant. These masters can be linked to new product records; inactive choices cannot be assigned to new products.</p>
        <form className="definition-master-form" onSubmit={event=>{void save(event)}}>
          {kind==='subcategories'&&<label>Parent category
            <select value={parent} required onChange={event=>setParent(event.target.value)}>
              <option value="">Select category</option>
              {categories.filter(cat=>cat.is_active).map(cat=><option key={cat.ulid} value={cat.ulid}>{cat.name}</option>)}
            </select>
          </label>}
          <label>Code
            <input required maxLength={48} pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,47}"
              value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
              placeholder={kind==='units'?'PCS':kind==='brands'?'BRD001':'CAT001'}/>
          </label>
          <label>{kind==='units'?'Unit name':'Name'}
            <input required minLength={2} maxLength={120} value={name}
              onChange={e=>setName(e.target.value)}
              placeholder={kind==='units'?'Pieces':kind==='brands'?'Brand name':'Category name'}/>
          </label>
          <button type="submit" disabled={busy || (kind==='subcategories'&&!parent)} className="primary-post">
            <AppIcon name="check" size={17}/>{busy?'Saving…':'Save definition'}
          </button>
        </form>
        <p className="pos-warning">Unit master currently records the unit identity only. Pack conversion factors, multi-unit stock and barcode-to-unit conversion are separate upcoming features.</p>
      </section>
      <section className="panel-card definition-master-register">
        <div className="panel-heading"><div><span className="small-overline">REFERENCE DIRECTORY</span><h2>{tabs.find(tab=>tab.kind===kind)?.label}</h2></div>
          <span className="count-pill">{active} active / {items.length} total</span></div>
        <div className="picker-input"><AppIcon name="search" size={17}/>
          <input aria-label="Search definition masters" placeholder="Search code, name or category…"
            value={query} onChange={e=>setQuery(e.target.value)}/>
        </div>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>Code</th><th>Name</th>{kind==='subcategories'&&<th>Category</th>}
            <th>Status</th><th>Action</th></tr></thead>
          <tbody>{filtered.map(item=><tr key={item.ulid}>
            <td><strong>{item.code}</strong></td><td>{item.name}</td>
            {kind==='subcategories'&&<td>{item.category_name}</td>}
            <td><span className={item.is_active?'master-state-active':'master-state-inactive'}>
              {item.is_active?'Active':'Inactive'}</span></td>
            <td><button type="button" className="btn-ghost" disabled={busy} onClick={()=>{void toggle(item)}}>
              {item.is_active?'Deactivate':'Activate'}</button></td>
          </tr>)}</tbody>
        </table></div>
        {filtered.length===0&&<p className="empty-copy">{query?'No matching masters.':'No records. Add the first master on the left.'}</p>}
      </section>
    </div>
    {message&&<p className={error?'inline-alert':'inline-success'} role="status">{message}</p>}
  </div>;
}
