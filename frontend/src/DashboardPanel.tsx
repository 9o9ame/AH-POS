import { useEffect, useState } from 'react';
import { getInventory, getOperationsReport, listParties, listProducts, type TenantChoice } from './api';
import { AppIcon, type AppIconName } from './AppIcon';

type DashboardPage = 'products' | 'customers' | 'suppliers' | 'inventory' | 'purchases' | 'sales' | 'reports';
type Summary = { products: number; customers: number; suppliers: number; warehouses: number; recent: number; saleCount: number; saleTotal: string; purchaseCount: number };

export function DashboardPanel({
  tenant, navigate,
}: { tenant: TenantChoice; navigate: (page: DashboardPage) => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([
      listProducts(tenant.ulid), listParties(tenant.ulid, 'customer'),
      listParties(tenant.ulid, 'supplier'), getInventory(tenant.ulid), getOperationsReport(tenant.ulid),
    ]).then(([products, customers, suppliers, inventory, report]) => {
      if (active) setSummary({
        products: products.total, customers: customers.total, suppliers: suppliers.total,
        warehouses: inventory.warehouse_count, recent: inventory.movements.length,
        saleCount: report.cash_sales.count, saleTotal: report.cash_sales.total,
        purchaseCount: report.purchases.count,
      });
    }).catch(() => {
      if (active) setError('Some dashboard figures are unavailable. Verify your tenant permissions.');
    });
    return () => { active = false; };
  }, [tenant.ulid]);

  const cards: { label: string; value: number | undefined; icon: AppIconName; to: DashboardPage; note: string }[] = [
    { label: 'Total products', value: summary?.products, icon: 'products', to: 'products', note: 'Active catalog & pricing' },
    { label: 'Customers', value: summary?.customers, icon: 'people', to: 'customers', note: 'Customer directory' },
    { label: 'Suppliers', value: summary?.suppliers, icon: 'truck', to: 'suppliers', note: 'Supplier directory' },
    { label: 'Warehouses', value: summary?.warehouses, icon: 'warehouse', to: 'inventory', note: 'Storage locations' },
  ];
  return (
    <div className="dashboard-content">
      <section className="welcome-banner">
        <div>
          <span className="welcome-tag"><AppIcon name="check" size={14} /> WORKSPACE CONNECTED</span>
          <h2>Welcome to {tenant.name}</h2>
          <p>Manage your catalog, business contacts and incoming inventory from one place.</p>
          <button className="btn-light" type="button" onClick={() => navigate('sales')}>
            Open Point of Sale <AppIcon name="arrow" size={16} />
          </button>
        </div>
        <div className="banner-art" aria-hidden="true"><AppIcon name="package" size={114} /></div>
      </section>
      {summary && <div className="dashboard-financial-strip">
        <button type="button" onClick={() => navigate('sales')}><span>Cash sale pilot</span>
          <strong>PKR {summary.saleTotal}</strong><small>{summary.saleCount} recorded sales</small></button>
        <button type="button" onClick={() => navigate('purchases')}><span>Purchasing activity</span>
          <strong>{summary.purchaseCount} documents</strong><small>Open purchasing</small></button>
        <button type="button" onClick={() => navigate('reports')}><span>Operational insights</span>
          <strong>View reports</strong><small>Local pilot data only</small></button>
      </div>}
      <div className="metrics-grid">
        {cards.map(card => <button type="button" className="metric-card" key={card.label} onClick={() => navigate(card.to)}>
          <span className="metric-icon"><AppIcon name={card.icon} size={22} /></span>
          <span className="metric-title">{card.label}</span>
          <strong className="metric-value">{card.value ?? '—'}</strong>
          <small>{card.note}</small>
        </button>)}
      </div>
      <div className="dashboard-bottom">
        <div className="panel-card">
          <div className="panel-heading"><div><span className="small-overline">QUICK ACTIONS</span><h2>Get things done</h2></div></div>
          <div className="quick-grid">
            <button type="button" onClick={() => navigate('products')}><AppIcon name="products" /> Add a product <AppIcon name="arrow" size={17} /></button>
            <button type="button" onClick={() => navigate('customers')}><AppIcon name="people" /> Customers <AppIcon name="arrow" size={17} /></button>
            <button type="button" onClick={() => navigate('suppliers')}><AppIcon name="truck" /> Suppliers <AppIcon name="arrow" size={17} /></button>
            <button type="button" onClick={() => navigate('inventory')}><AppIcon name="inventory" /> Stock inward <AppIcon name="arrow" size={17} /></button>
            <button type="button" onClick={() => navigate('purchases')}><AppIcon name="truck" /> New purchase <AppIcon name="arrow" size={17} /></button>
            <button type="button" onClick={() => navigate('sales')}><AppIcon name="sales" /> Cash checkout <AppIcon name="arrow" size={17} /></button>
            <button type="button" onClick={() => navigate('reports')}><AppIcon name="reports" /> Reports <AppIcon name="arrow" size={17} /></button>
          </div>
        </div>
        <div className="panel-card roadmap-card">
          <div className="panel-heading"><div><span className="small-overline">DELIVERY TRACKER</span><h2>Operations rollout</h2></div></div>
          <div className="progress-row"><span>Catalog & contacts</span><span className="progress-done">Browser verified</span></div>
          <div className="progress-row"><span>Warehouse receiving</span><span>Awaiting local verification</span></div>
          <div className="progress-row"><span>Cash sale & purchase pilots</span><span>Pending UAT and GL</span></div>
          <div className="progress-row"><span>Full accounting, returns & tax</span><span>Not implemented</span></div>
          <p className="muted">These are evidence-based feature statuses, not project completion percentages.</p>
        </div>
      </div>
      {summary && <p className="muted">Recent stock entries (last 30): {summary.recent}. Statistics update when this page opens.</p>}
      {error && <p className="inline-alert">{error}</p>}
    </div>
  );
}
