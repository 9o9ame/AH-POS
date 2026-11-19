import { useEffect, useState, type FormEvent } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';
import { CommandPalette } from './CommandPalette';
import { DashboardPanel } from './DashboardPanel';
import { InventoryPanel } from './InventoryPanel';
import { ProductsPanel } from './ProductsPanel';
import { PartiesPanel } from './PartiesPanel';
import { ApiError, login, logout, me, myTenants, tenantContext, type Profile, type TenantChoice } from './api';

type Screen = 'loading' | 'guest' | 'authenticated' | 'unavailable';
type Page = 'dashboard' | 'products' | 'customers' | 'suppliers' | 'inventory' | 'sales' | 'reports';
const pages: { id: Page; label: string; icon: AppIconName; group: string; ready: boolean }[] = [
  { id: 'dashboard', label: 'Overview', icon: 'dashboard', group: 'WORKSPACE', ready: true },
  { id: 'products', label: 'Products', icon: 'products', group: 'CATALOG', ready: true },
  { id: 'customers', label: 'Customers', icon: 'people', group: 'CATALOG', ready: true },
  { id: 'suppliers', label: 'Suppliers', icon: 'truck', group: 'CATALOG', ready: true },
  { id: 'inventory', label: 'Inventory & Warehouses', icon: 'inventory', group: 'OPERATIONS', ready: true },
  { id: 'sales', label: 'Point of Sale', icon: 'sales', group: 'OPERATIONS', ready: false },
  { id: 'reports', label: 'Reports', icon: 'reports', group: 'INSIGHTS', ready: false },
];

export function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenants, setTenants] = useState<TenantChoice[]>([]);
  const [selected, setSelected] = useState<TenantChoice | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    void me().then(async user => {
      const choices = await myTenants();
      if (!cancelled) {
        setProfile(user);
        setTenants(choices);
        setScreen('authenticated');
      }
    }).catch((error: unknown) => {
      if (cancelled) return;
      setScreen(error instanceof ApiError && error.status === 401 ? 'guest' : 'unavailable');
      if (!(error instanceof ApiError && error.status === 401)) setMessage('Backend unavailable. Check Laravel on port 8000.');
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKeyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(open => !open);
      } else if (event.key === 'Escape') {
        setCommandOpen(false);
        setSidebarOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyboard);
    return () => window.removeEventListener('keydown', onKeyboard);
  }, []);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const user = await login(email.trim(), password);
      const choices = await myTenants();
      setProfile(user); setTenants(choices); setPassword('');
      setSelected(null); setPage('dashboard'); setScreen('authenticated');
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 401
        ? 'Invalid email or password.'
        : error instanceof ApiError && error.status === 419
          ? 'Session expired. Try again.' : 'Unable to sign in. Check the backend.');
    } finally { setBusy(false); }
  }

  async function chooseTenant(choice: TenantChoice) {
    setBusy(true); setMessage('');
    try {
      const verified = await tenantContext(choice.ulid);
      setSelected(verified); setPage('dashboard'); setSidebarOpen(false);
    } catch {
      setSelected(null); setMessage('Tenant access denied or your session expired.');
    } finally { setBusy(false); }
  }

  async function submitLogout() {
    setBusy(true); setMessage('');
    try {
      await logout();
      setProfile(null); setTenants([]); setSelected(null); setPage('dashboard'); setScreen('guest');
    } catch {
      setMessage('Logout could not be confirmed. Retry.');
    } finally { setBusy(false); }
  }

  function navigate(next: Page) {
    setPage(next);
    setSidebarOpen(false);
    setCommandOpen(false);
  }

  if (screen === 'loading') {
    return <div className="screen-center"><div className="loading-symbol">A<span>H</span></div><p>Opening your workspace…</p></div>;
  }

  if (screen === 'guest' || screen === 'unavailable') {
    return <div className="auth-layout">
      <aside className="auth-visual">
        <div className="brand-lockup"><span className="brand-mark">A<span>H</span></span><span>AH POS<small>Business operations</small></span></div>
        <div className="auth-visual-center">
          <span className="hero-eyebrow">ONE SMART WORKSPACE</span>
          <h1>Everything your business needs, in one place.</h1>
          <p>Catalogs, business partners and inventory — built for faster daily operations.</p>
        </div>
        <span className="auth-visual-footer">AH POS · Development workspace</span>
      </aside>
      <main className="auth-main"><div className="login-box">
        <span className="small-overline">WELCOME BACK</span>
        <h2>Sign in to AH POS</h2>
        <p className="muted">Use your authorized account to continue.</p>
        {screen === 'unavailable'
          ? <button type="button" onClick={() => window.location.reload()}>Retry connection</button>
          : <form className="auth-form" onSubmit={e => { void submitLogin(e); }}>
              <label>Email address<input id="login-email" type="email" autoComplete="username" required maxLength={255}
                placeholder="you@business.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
              <label>Password<input id="login-password" type="password" autoComplete="current-password" required
                placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} /></label>
              <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'} <AppIcon name="arrow" size={18} /></button>
            </form>}
        {message && <p role="alert" className="inline-alert">{message}</p>}
        <div className="auth-caption"><AppIcon name="shield" size={15}/> Secure, tenant-scoped access</div>
      </div></main>
    </div>;
  }

  return <div className="app-frame">
    <CommandPalette open={commandOpen && selected !== null} close={() => setCommandOpen(false)} navigate={navigate} />
    {sidebarOpen && <button type="button" className="sidebar-shade" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">A<span>H</span></span>
        <span className="brand-text">AH POS<small>OPERATIONS SUITE</small></span>
      </div>
      <div className="sidebar-tenant">
        <div className="tenant-badge">{(selected?.name || tenants[0]?.name || 'W').slice(0, 1).toUpperCase()}</div>
        <div><span className="tenant-overline">CURRENT WORKSPACE</span>
          <strong>{selected?.name || 'Select a business'}</strong></div>
        <AppIcon name="chevron" size={17} />
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {Array.from(new Set(pages.map(item => item.group))).map(group => <div className="nav-group" key={group}>
          <span className="nav-group-title">{group}</span>
          {pages.filter(item => item.group === group).map(item =>
            <button key={item.id} type="button"
              disabled={!selected || !item.ready}
              className={`nav-link ${page === item.id && selected ? 'nav-active' : ''}`}
              onClick={() => navigate(item.id)}>
              <AppIcon name={item.icon} size={19} />
              <span>{item.label}</span>
              {!item.ready && <small className="nav-soon">Soon</small>}
            </button>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-release"><span className="release-pulse"/><span>Development environment<small>Operational modules in progress</small></span></div>
        <button type="button" className="sidebar-logout" disabled={busy} onClick={() => void submitLogout()}>
          <AppIcon name="logout" size={18} /> Sign out
        </button>
      </div>
    </aside>
    <div className="app-main">
      <header className="top-bar">
        <div className="top-left">
          <button type="button" className="mobile-menu" aria-label="Toggle navigation" onClick={() => setSidebarOpen(v => !v)}><AppIcon name="menu" /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-sep">/</span><strong>{pages.find(item => item.id === page)?.label}</strong></div>
        </div>
        <div className="top-right">
          {selected && <button className="top-search" type="button" aria-label="Quick navigation, Ctrl K" onClick={() => setCommandOpen(true)}>
            <AppIcon name="search" size={17} /><span>Search anything…</span><kbd>Ctrl K</kbd>
          </button>}
          <span className="dev-chip"><span/> Local development</span>
          <div className="user-chip"><span className="user-initials">{profile?.name.slice(0, 1).toUpperCase()}</span>
            <span><strong>{profile?.name}</strong><small>Signed in</small></span></div>
        </div>
      </header>

      <main className="workspace-main">
        {!selected ? <div className="tenant-picker">
          <span className="small-overline">LET'S GET STARTED</span><h1>Choose your workspace</h1>
          <p className="muted">Select an active business you are authorized to access.</p>
          {tenants.length === 0 ? <p className="inline-alert">No active tenant membership. Contact your administrator.</p>
            : <div className="tenant-cards">{tenants.map(tenant => <button key={tenant.ulid} disabled={busy} type="button"
                className="tenant-pick-card" onClick={() => void chooseTenant(tenant)}>
                <span className="tenant-pick-icon"><AppIcon name="warehouse" size={24}/></span>
                <span><strong>{tenant.name}</strong><small>Open business workspace</small></span>
                <AppIcon name="arrow" />
              </button>)}</div>}
          {message && <p role="alert" className="inline-alert">{message}</p>}
        </div> : <>
          <div className="page-heading">
            <div><span className="small-overline">AH POS / {selected.name.toUpperCase()}</span>
              <h1>{page === 'dashboard' ? 'Business overview' : pages.find(item => item.id === page)?.label}</h1>
              <p>{page === 'dashboard' ? 'Your business at a glance.' :
                page === 'products' ? 'Manage SKUs, barcodes and selling prices.' :
                page === 'inventory' ? 'Track warehouses, incoming stock and available quantities.' :
                page === 'customers' ? 'Keep your customers organized and ready for sales.' :
                page === 'suppliers' ? 'Manage your purchasing contacts.' : 'Module in development.'}</p>
            </div>
            <button className="workspace-switch" type="button" onClick={() => { setSelected(null); setPage('dashboard'); }}>
              <AppIcon name="warehouse" size={16} /><span>{selected.name}</span><AppIcon name="chevron" size={15} />
            </button>
          </div>
          {page === 'dashboard' && <DashboardPanel key={selected.ulid} tenant={selected} navigate={navigate} />}
          {page === 'products' && <ProductsPanel key={selected.ulid} tenant={selected} />}
          {page === 'customers' && <PartiesPanel key={selected.ulid + '-customer'} tenant={selected} initialType="customer" />}
          {page === 'suppliers' && <PartiesPanel key={selected.ulid + '-supplier'} tenant={selected} initialType="supplier" />}
          {page === 'inventory' && <InventoryPanel key={selected.ulid} tenant={selected} />}
          {(page === 'sales' || page === 'reports') && <div className="panel-card"><h2>Coming next</h2><p className="muted">This module is not ready for transactions yet.</p></div>}
        </>}
      </main>
    </div>
  </div>;
}
