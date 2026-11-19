import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';

export type CommandDestination = 'dashboard' | 'products' | 'customers' | 'suppliers' | 'inventory' | 'purchases' | 'sales' | 'reports';
const commands: { destination: CommandDestination; label: string; detail: string; icon: AppIconName; terms: string }[] = [
  { destination: 'dashboard', label: 'Business overview', detail: 'Dashboard and KPIs', icon: 'dashboard', terms: 'home overview dashboard' },
  { destination: 'products', label: 'Manage products', detail: 'SKUs, barcodes, selling prices', icon: 'products', terms: 'add new product catalog search sku barcode' },
  { destination: 'customers', label: 'Open customers', detail: 'Contacts and customer directory', icon: 'people', terms: 'customer contact buyer' },
  { destination: 'suppliers', label: 'Open suppliers', detail: 'Supplier directory', icon: 'truck', terms: 'supplier vendor contacts' },
  { destination: 'inventory', label: 'Inventory & warehouses', detail: 'Receiving, stock balances', icon: 'inventory', terms: 'warehouse stock opening receipt goods inward' },
  { destination: 'purchases', label: 'Supplier purchasing', detail: 'Receive goods against purchase', icon: 'truck', terms: 'purchase order supplier bill receive' },
  { destination: 'sales', label: 'Open Point of Sale', detail: 'Cash checkout and printable receipts', icon: 'sales', terms: 'sell checkout cashier barcode receipt' },
  { destination: 'reports', label: 'Operations reports', detail: 'Cash sales and purchase analytics', icon: 'reports', terms: 'analytics reports figures trend revenue' },
];

export function CommandPalette({ open, close, navigate }: {
  open: boolean; close: () => void; navigate: (destination: CommandDestination) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => commands.filter(item =>
    (item.label + ' ' + item.detail + ' ' + item.terms).toLowerCase().includes(query.trim().toLowerCase()),
  ), [query]);

  useEffect(() => {
    if (open) {
      setQuery(''); setActive(0);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);
  useEffect(() => { setActive(0); }, [query]);
  if (!open) return null;

  function execute(index: number) {
    const found = matches[index];
    if (found) { navigate(found.destination); close(); }
  }

  return <div className="command-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Quick navigation">
      <div className="command-input-wrap">
        <AppIcon name="search" size={23} />
        <input ref={searchRef} aria-label="Search navigation" value={query}
          onChange={e => setQuery(e.target.value)} placeholder="Where would you like to go?"
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive(n => Math.min(n + 1, matches.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive(n => Math.max(0, n - 1)); }
            if (e.key === 'Enter') { e.preventDefault(); execute(active); }
            if (e.key === 'Escape') { e.preventDefault(); close(); }
          }} />
        <kbd>ESC</kbd>
      </div>
      <div className="command-list" role="listbox" aria-label="Pages">
        <div className="command-label">NAVIGATION</div>
        {matches.map((item, index) => <button
          type="button" role="option" aria-selected={active === index}
          onMouseEnter={() => setActive(index)}
          className={'command-item' + (active === index ? ' command-selected' : '')}
          key={item.destination} onClick={() => execute(index)}>
          <span className="command-icon"><AppIcon name={item.icon} size={19}/></span>
          <span className="command-description"><strong>{item.label}</strong><small>{item.detail}</small></span>
          <AppIcon name="arrow" size={17} />
        </button>)}
        {matches.length === 0 && <p className="command-empty">No matching page found.</p>}
      </div>
      <footer className="command-footer"><span>↑ ↓ Navigate</span><span>↵ Open</span><span>ESC Close</span></footer>
    </section>
  </div>;
}
