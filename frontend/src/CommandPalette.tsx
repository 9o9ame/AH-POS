import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from './AppIcon';
import { modules, type WorkspacePage } from './ModuleCatalog';

type Entry = {
  key: string; page?: WorkspacePage; itemId: string; label: string;
  detail: string; group: string; icon: typeof modules[number]['icon'];
  planned: boolean;
};

const commands: Entry[] = modules.flatMap(module => module.items.map(item => ({
  key: module.id + '-' + item.id,
  page: item.page, itemId: item.id, label: item.name,
  detail: item.description, group: module.title + ' · ' + item.group,
  icon: item.icon, planned: item.state === 'planned',
})));

export function CommandPalette({ open, close, navigate }: {
  open: boolean; close: () => void; navigate: (page: WorkspacePage, itemId?: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = commands.filter(item => !term
      ? !item.planned
      : (item.label + ' ' + item.detail + ' ' + item.group).toLowerCase().includes(term));
    return filtered.slice(0, 28);
  }, [query]);

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
    if (found && found.page && !found.planned) {
      navigate(found.page, found.itemId);
      close();
    }
  }

  return <div className="command-overlay" role="presentation"
    onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
    <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Search ERP modules">
      <div className="command-input-wrap">
        <AppIcon name="search" size={23} />
        <input ref={searchRef} aria-label="Search all ERP modules" value={query}
          onChange={e => setQuery(e.target.value)} placeholder="Find sales, purchase, categories, journals, users…"
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();setActive(n => Math.min(n + 1, matches.length - 1));
            }
            if (e.key === 'ArrowUp') {e.preventDefault();setActive(n => Math.max(0, n - 1));}
            if (e.key === 'Enter') {e.preventDefault();execute(active);}
            if (e.key === 'Escape') {e.preventDefault();close();}
          }} />
        <kbd>ESC</kbd>
      </div>
      <div className="command-list" role="listbox" aria-label="ERP module search">
        <div className="command-label">{query.trim() ? 'MATCHING MODULES' : 'AVAILABLE WORKFLOWS'}</div>
        {matches.map((item,index) => <button type="button" role="option"
          aria-selected={active===index && !item.planned}
          disabled={item.planned}
          onMouseEnter={() => {if(!item.planned)setActive(index);}}
          className={'command-item'+(active===index&&!item.planned?' command-selected':'')+(item.planned?' command-planned':'')}
          key={item.key} onClick={() => execute(index)}>
          <span className="command-icon"><AppIcon name={item.icon} size={19}/></span>
          <span className="command-description">
            <strong>{item.label}</strong><small>{item.group} · {item.detail}</small>
          </span>
          {item.planned ? <span className="command-pending">Planned</span> : <AppIcon name="arrow" size={17}/>}
        </button>)}
        {matches.length === 0 && <p className="command-empty">No matching module found.</p>}
      </div>
      <footer className="command-footer">
        <span>↑ ↓ Navigate</span><span>↵ Open available</span><span>ESC Close</span>
      </footer>
    </section>
  </div>;
}
