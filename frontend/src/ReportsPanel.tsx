import { useEffect, useState } from 'react';
import { getOperationsReport, type OperationsReport, type TenantChoice } from './api';
import { AppIcon } from './AppIcon';

const money = (amount: string) => new Intl.NumberFormat('en-PK', {
  style:'currency', currency:'PKR', minimumFractionDigits: 2,
}).format(Number(amount));

export function ReportsPanel({ tenant }: { tenant: TenantChoice }) {
  const [data, setData] = useState<OperationsReport | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    void getOperationsReport(tenant.ulid).then(report => {
      if (active) { setData(report); setError(''); }
    }).catch(() => { if (active) setError('Report unavailable. Check tenant permissions.'); });
    return () => { active = false; };
  }, [tenant.ulid, refresh]);

  const daily = data?.daily_cash_sales || [];
  const max = Math.max(1, ...daily.map(day => Number(day.total)));

  return <div className="reports-layout">
    <div className="report-intro">
      <div><span className="small-overline">BUSINESS INTELLIGENCE</span>
        <h2>Operations snapshot</h2>
        <p>Live transactions for your selected business. Pilot totals, not a tax or financial statement.</p>
      </div>
      <button className="btn-ghost" type="button" onClick={() => setRefresh(n => n + 1)}>
        Refresh figures</button>
    </div>
    <div className="report-metric-grid">
      <div className="panel-card report-kpi"><span>Cash sales</span><AppIcon name="sales" size={22}/>
        <strong>{data ? money(data.cash_sales.total) : '—'}</strong><small>{data?.cash_sales.count ?? 0} transactions</small></div>
      <div className="panel-card report-kpi"><span>Cash refunds</span><AppIcon name="arrow" size={22}/>
        <strong>{data ? money(data.cash_returns.total) : '—'}</strong><small>{data?.cash_returns.count ?? 0} return documents</small></div>
      <div className="panel-card report-kpi"><span>Net cash sale activity</span><AppIcon name="sales" size={22}/>
        <strong>{data ? money(data.net_cash_sales) : '—'}</strong><small>Gross sales less recorded refunds</small></div>
      <div className="panel-card report-kpi"><span>Purchases received</span><AppIcon name="truck" size={22}/>
        <strong>{data ? money(data.purchases.total) : '—'}</strong><small>{data?.purchases.count ?? 0} purchase documents</small></div>
      <div className="panel-card report-kpi"><span>Stocked product locations</span><AppIcon name="inventory" size={22}/>
        <strong>{data?.stocked_product_locations ?? '—'}</strong>
        <small>Positive-quantity product/warehouse combinations</small></div>
    </div>
    <div className="panel-card report-chart-card">
      <div className="panel-heading"><div><span className="small-overline">LAST 7 DAYS</span>
        <h2>Cash sales trend</h2></div><span className="count-pill">Daily totals</span></div>
      <div className="report-bars" role="img" aria-label="Cash sales for the last seven calendar days">
        {daily.map(row => <div className="report-bar-group" key={row.day}
          title={row.day + ': ' + money(row.total) + ', ' + row.sale_count + ' sales'}>
          <div className="report-bar-track"><div className="report-bar"
            style={{ height: Math.max(5, (Number(row.total) / max) * 100) + '%' }}/></div>
          <span>{row.day.slice(5)}</span><strong>{money(row.total)}</strong>
        </div>)}
        {daily.length===0 && <p className="empty-copy">No sales recorded during the last seven days.</p>}
      </div>
      <p className="muted">Days without sales have no bars. Hover over a column for counts and totals.</p>
    </div>
    {data && <p className="inline-alert">{data.disclaimer}</p>}
    {error && <p className="inline-alert">{error}</p>}
  </div>;
}
