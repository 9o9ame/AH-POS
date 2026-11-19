import { useEffect, useState } from 'react';
import {
  getInventory, getOperationsReport, listParties, listProducts,
  type InventoryOverview, type OperationsReport, type TenantChoice,
} from './api';
import { AppIcon, type AppIconName } from './AppIcon';
import { TableSkeleton } from './EntityModal';

type DashboardPage =
  | 'products' | 'customers' | 'suppliers' | 'inventory'
  | 'purchases' | 'sales' | 'reports' | 'cash' | 'held';
type Summary = {
  products: number; customers: number; suppliers: number; warehouses: number;
  report: OperationsReport | null; inventory: InventoryOverview | null;
};
const formatMoney = (v: string | number) => new Intl.NumberFormat('en-PK', {
  style: 'currency', currency: 'PKR', maximumFractionDigits: 0,
}).format(Number(v));
const compact = (n: number) => new Intl.NumberFormat('en-PK', {notation:'compact'}).format(n);

export function DashboardPanel({ tenant, navigate }: {
  tenant: TenantChoice; navigate: (page: DashboardPage) => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Individual cards get their own skeletons; one unavailable API must not
    // invent numbers for the remaining widgets.
    void Promise.allSettled([
      listProducts(tenant.ulid),
      listParties(tenant.ulid,'customer'),
      listParties(tenant.ulid,'supplier'),
      getInventory(tenant.ulid),
      getOperationsReport(tenant.ulid),
    ]).then(results => {
      if (!mounted) return;
      const val = <T,>(index: number): T | null =>
        results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<T>).value : null;
      const products = val<{total:number}>(0);
      const customers = val<{total:number}>(1);
      const suppliers = val<{total:number}>(2);
      const inventory = val<InventoryOverview>(3);
      const report = val<OperationsReport>(4);
      setSummary({
        products: products?.total ?? -1,
        customers: customers?.total ?? -1,
        suppliers: suppliers?.total ?? -1,
        warehouses: inventory?.warehouse_count ?? -1,
        inventory, report,
      });
      setError(results.some(result => result.status === 'rejected')
        ? 'Some live figures could not load. Check your Admin permissions or connection.' : '');
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [tenant.ulid]);

  const cards: {label:string;count:number;icon:AppIconName;to:DashboardPage}[] = [
    {label:'Products',count:summary?.products ?? -1,icon:'products',to:'products'},
    {label:'Customers',count:summary?.customers ?? -1,icon:'people',to:'customers'},
    {label:'Suppliers',count:summary?.suppliers ?? -1,icon:'truck',to:'suppliers'},
    {label:'Warehouses',count:summary?.warehouses ?? -1,icon:'warehouse',to:'inventory'},
  ];
  const report = summary?.report;
  const daily = report?.daily_cash_sales ?? [];
  const max = Math.max(1, ...daily.map(item => Number(item.total)));
  const totalSales = Number(report?.cash_sales.total || 0);
  const totalPurchases = Number(report?.purchases.total || 0);
  const totalRefunds = Number(report?.cash_returns.total || 0);
  // Donut intentionally shows DOCUMENT COUNTS, not mixed-meaning money
  // percentages or profitability. No invented revenue or financial KPIs.
  const slices = [
    {label:'Cash sales',count:report?.cash_sales.count || 0,color:'#13a794'},
    {label:'Purchases',count:report?.purchases.count || 0,color:'#4e88de'},
    {label:'Cash refunds',count:report?.cash_returns.count || 0,color:'#e59c5a'},
  ];
  const sumDocs = slices.reduce((sum,item)=>sum+item.count,0);
  let offset = 0;
  const arcs = slices.map(item => {
    const start = offset;
    const portion = sumDocs === 0 ? 0 : item.count/sumDocs;
    offset += portion;
    return {...item, portion, start};
  });

  const lowStock = (summary?.inventory?.balances || [])
    .filter(item => Number(item.quantity) <= 5 && Number(item.quantity) >= 0)
    .sort((a,b)=>Number(a.quantity)-Number(b.quantity))
    .slice(0,5);
  return <div className="admin-dashboard">
    <div className="admin-dashboard-head">
      <div>
        <span className="small-overline">ADMIN COMMAND CENTER</span>
        <h2>{tenant.name} <span>· business dashboard</span></h2>
        <p>Live operational activity from this Admin workspace. No sample financial numbers.</p>
      </div>
      <div className="dashboard-primary-actions">
        <button type="button" onClick={()=>navigate('sales')}><AppIcon name="sales" size={17}/> New Sale <kbd>F2</kbd></button>
        <button type="button" onClick={()=>navigate('purchases')}><AppIcon name="truck" size={17}/> New Purchase</button>
        <button type="button" className="dash-secondary" onClick={()=>navigate('held')}><AppIcon name="package" size={17}/> Held Bills</button>
      </div>
    </div>
    <div className="dashboard-counters">
      {cards.map(card=><button className="dashboard-count" type="button" onClick={()=>navigate(card.to)} key={card.label}>
        <span className="dashboard-count-icon"><AppIcon name={card.icon} size={19}/></span>
        <span>{card.label}</span>
        {loading ? <span className="skeleton-cell" style={{width:'55%',height:22}}/> :
          <strong>{card.count < 0 ? 'Unavailable' : compact(card.count)}</strong>}
      </button>)}
    </div>
    <div className="dashboard-counters dashboard-money-counters">
      <div className="dashboard-money-card"><span>Gross cash sales · pilot</span>
        {loading ? <span className="skeleton-cell"/> : <strong>{report ? formatMoney(totalSales) : 'Unavailable'}</strong>}
        <small>Not GL revenue</small></div>
      <div className="dashboard-money-card"><span>Purchases received · pilot</span>
        {loading ? <span className="skeleton-cell"/> : <strong>{report ? formatMoney(totalPurchases) : 'Unavailable'}</strong>}
        <small>Not a payable balance</small></div>
      <div className="dashboard-money-card"><span>Cash refunds · pilot</span>
        {loading ? <span className="skeleton-cell"/> : <strong>{report ? formatMoney(totalRefunds) : 'Unavailable'}</strong>}
        <small>Not a cash drawer settlement</small></div>
    </div>
    <div className="dashboard-charts">
      <section className="dashboard-chart-card">
        <header><div><span className="small-overline">SALES TREND</span><h3>Gross cash sales · last 7 days</h3></div>
          <button type="button" className="chart-action" onClick={()=>navigate('reports')}>Reports <AppIcon name="arrow" size={14}/></button></header>
        {loading ? <TableSkeleton rows={6} cols={5}/> : report ? <div className="dashboard-bars" role="img"
          aria-label="Seven day gross cash sale bar chart">
          {daily.map((item,i)=><div className="dashboard-bar-column" key={item.day+i}
            title={item.day+': '+formatMoney(item.total)}>
            <strong>{Number(item.total)>0?compact(Number(item.total)):'—'}</strong>
            <div className="dashboard-bar-track"><span style={{height:Math.max(0,Number(item.total)/max*100)+'%'}}/></div>
            <small>{item.day.slice(5)}</small>
          </div>)}
          {!daily.length&&<p className="empty-copy">No sales activity for this period.</p>}
        </div>:<p className="inline-alert">Sales trend unavailable.</p>}
      </section>
      <section className="dashboard-chart-card">
        <header><div><span className="small-overline">DOCUMENT ACTIVITY</span><h3>Transaction mix</h3></div></header>
        {loading ? <TableSkeleton rows={5} cols={3}/> : report ? <>
          <div className="dashboard-donut-layout">
            <div className="dashboard-donut" role="img" aria-label="Purchase, cash sale and cash refund document count distribution"
              style={{background: sumDocs ? 'conic-gradient('+arcs.map(a=>a.color+' '+(a.start*100)+'% '+((a.start+a.portion)*100)+'%').join(',')+')' : '#e5edf0'}}>
              <div><strong>{sumDocs}</strong><span>Documents</span></div>
            </div>
            <div className="dashboard-donut-legend">
              {slices.map(item=><div key={item.label}><i style={{background:item.color}}/>{item.label}<strong>{item.count}</strong></div>)}
            </div>
          </div>
          <p className="chart-disclaimer">Operational document counts, not a revenue or profit breakdown.</p>
        </>:<p className="inline-alert">Transaction mix unavailable.</p>}
      </section>
    </div>
    <section className="dashboard-chart-card dashboard-stock-watch">
      <header><div><span className="small-overline">INVENTORY WATCH</span><h3>Items requiring attention</h3></div>
        <button type="button" className="chart-action" onClick={()=>navigate('inventory')}>Inventory <AppIcon name="arrow" size={14}/></button></header>
      <p>Display-only watch rule: quantity at or below 5 in an individual warehouse. Not a configured reorder point.</p>
      {loading ? <TableSkeleton rows={3} cols={4}/> : !summary?.inventory ? <p>Stock monitoring unavailable.</p> :
        lowStock.length ? <div className="dashboard-stock-list">{lowStock.map(item=><div key={item.product_ulid+item.warehouse_ulid}>
          <span className={'stock-severity '+(Number(item.quantity)===0?'stock-critical':'stock-warning')}/>
          <strong>{item.product_name}</strong><span>{item.warehouse_name}</span>
          <b>{Number(item.quantity)===0?'Out of stock':item.quantity+' remaining'}</b>
        </div>)}</div> : <p className="dashboard-stock-clear">No entries meet the provisional low-stock rule.</p>}
    </section>
    {error && <p className="inline-alert" role="alert">{error}</p>}
  </div>;
}
