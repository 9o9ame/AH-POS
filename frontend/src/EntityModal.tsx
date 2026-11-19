import { useEffect, type ReactNode } from 'react';
import { AppIcon } from './AppIcon';

export function EntityModal({ title, subtitle, children, onClose, busy = false }: {
  title: string; subtitle?: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [onClose, busy]);

  return <div className="entity-modal-backdrop" onMouseDown={e => {
    if (!busy && e.target === e.currentTarget) onClose();
  }}>
    <section role="dialog" aria-modal="true" aria-label={title} className="entity-modal">
      <header className="entity-modal-header">
        <div><span className="small-overline">AH POS / NEW RECORD</span><h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}</div>
        <button type="button" className="entity-modal-close" onClick={onClose} disabled={busy} aria-label="Close form">
          <AppIcon name="logout" size={17}/>
        </button>
      </header>
      <div className="entity-modal-body">{children}</div>
    </section>
  </div>;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return <div className="table-skeleton" role="status" aria-label="Loading records">
    {Array.from({ length: rows }, (_, row) => <div key={row} className="skeleton-row">
      {Array.from({ length: cols }, (_, col) => <span key={col} className="skeleton-cell"
        style={{width: col === 1 ? '25%' : col === 0 ? '12%' : '15%'}}/>)}
    </div>)}
  </div>;
}
