const plannedModules = [
  'Tenants & permissions',
  'Products & units',
  'Customers & suppliers',
  'Purchasing & inventory',
  'Sales & returns',
  'Accounting & reports',
  'Offline sales & sync',
  'AI & WhatsApp entitlements',
] as const;

export function App() {
  return (
    <main className="page">
      <header className="header">
        <span className="eyebrow">AH-POS / DEVELOPMENT</span>
        <h1>Application foundation</h1>
        <p>Temporary engineering shell — not an approved UI design or a working POS.</p>
      </header>

      <section aria-labelledby="status-title" className="section">
        <h2 id="status-title">Current environment</h2>
        <dl className="facts">
          <div><dt>Deployment</dt><dd>Local development / test only</dd></div>
          <div><dt>Database</dt><dd>One test database planned; no application DB connected yet</dd></div>
          <div><dt>Backend</dt><dd>Laravel bootstrap pending local installation</dd></div>
          <div><dt>Production tenants</dt><dd>Not onboarded</dd></div>
        </dl>
      </section>

      <section aria-labelledby="modules-title" className="section">
        <h2 id="modules-title">Planned workstreams</h2>
        <ul className="modules">
          {plannedModules.map((name) => <li key={name}>{name}<span>Not implemented</span></li>)}
        </ul>
      </section>
      <footer>All business data must remain server-authorized and tenant-scoped. No production actions are available.</footer>
    </main>
  );
}
