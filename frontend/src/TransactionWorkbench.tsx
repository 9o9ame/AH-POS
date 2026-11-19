import { useEffect } from 'react';
import { AppIcon } from './AppIcon';
import { PosPanel } from './PosPanel';
import { PurchasingPanel } from './PurchasingPanel';
import type { TenantChoice } from './api';

export type WorkKind = 'sale' | 'purchase';
export type WorkWindow = {
  id: string;
  kind: WorkKind;
  label: string;
  number: number;
  dirty: boolean;
};

type Props = {
  tenant: TenantChoice;
  windows: WorkWindow[];
  activeId: string | null;
  open: (kind: WorkKind) => void;
  activate: (id: string) => void;
  minimize: () => void;
  close: (id: string) => void;
  markDirty: (id: string, dirty: boolean) => void;
};

function WindowContent({ kind, tenant, onDirtyChange, active }: {
  kind: WorkKind;
  tenant: TenantChoice;
  onDirtyChange: (dirty: boolean) => void;
  active: boolean;
}) {
  return kind === 'sale'
    ? <PosPanel tenant={tenant} onDraftChange={onDirtyChange} active={active} />
    : <PurchasingPanel tenant={tenant} onDraftChange={onDirtyChange} active={active} />;
}

export function TransactionWorkbench({
  tenant, windows, activeId, open, activate, minimize, close, markDirty,
}: Props) {
  const active = windows.find(item => item.id === activeId) ?? null;

  // Individual components remain mounted even while minimized. This preserves
  // cart, price/quantity edits, reference, tender and per-window idempotency key.
  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (event.target instanceof HTMLElement &&
          event.target.closest('.receipt-overlay, .command-dialog')) return;
      if (document.querySelector('.receipt-overlay, .command-dialog')) return;
      event.preventDefault();
      minimize();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, minimize, active]);

  const shortcuts: { name: string; key: string }[] = [
    { name: 'New sale', key: 'F2' },
    { name: 'New purchase', key: 'Shift+F2' },
    { name: 'Switch window', key: 'Bottom dock' },
  ];

  return <>
    {windows.map((item) => (
      <div key={item.id} className="work-window-layer"
        style={{ display: item.id === activeId ? 'flex' : 'none' }}
        aria-hidden={item.id !== activeId}>
        <section className={'work-window work-window-' + item.kind}
          role="dialog" aria-modal={item.id === activeId} aria-label={item.label}>
          <header className="work-window-header">
            <div className="work-window-identity">
              <span className={'work-window-symbol ' + item.kind}>
                <AppIcon name={item.kind === 'sale' ? 'sales' : 'truck'} size={19}/>
              </span>
              <div>
                <strong>{item.label}</strong>
                <small>{tenant.name} / {item.kind === 'sale' ? 'Cashier invoice' : 'Goods receipt'} · Local pilot</small>
              </div>
              {item.dirty && <span className="work-unsaved" title="Unposted draft">Unposted</span>}
            </div>
            <div className="work-window-actions">
              <button type="button" className="work-new" onClick={() => open(item.kind)}
                aria-label={'Open another ' + item.kind}>
                <AppIcon name="package" size={16}/> New {item.kind === 'sale' ? 'sale' : 'purchase'}
              </button>
              <button type="button" className="work-control" onClick={minimize}
                title="Minimize to bottom dock" aria-label="Minimize window">—</button>
              <button type="button" className="work-control work-danger" onClick={() => close(item.id)}
                title="Close this window" aria-label="Close window">×</button>
            </div>
          </header>
          <div className="work-window-body">
            <WindowContent kind={item.kind} tenant={tenant}
              onDirtyChange={dirty => markDirty(item.id, dirty)}/>
          </div>
          <footer className="work-window-status">
            <span><span className="release-pulse"/> <strong>Connected</strong> · Server validates stock, prices and totals</span>
            <div>{shortcuts.map(s => <span key={s.name}><kbd>{s.key}</kbd> {s.name}</span>)}</div>
          </footer>
        </section>
      </div>
    ))}
    {windows.length > 0 && <nav className="work-dock" aria-label="Open sales and purchase windows">
      <span className="work-dock-label"><AppIcon name="menu" size={15} /> WINDOWS <b>{windows.length}</b></span>
      <div className="work-dock-tabs">
        {windows.map(item => <button type="button" key={item.id}
          className={'work-dock-tab ' + (item.id === activeId ? 'dock-active' : '')}
          onClick={() => item.id === activeId ? minimize() : activate(item.id)}>
          <AppIcon name={item.kind === 'sale' ? 'sales' : 'truck'} size={16}/>
          <span>{item.label}</span>
          {item.dirty && <i title="Unsaved invoice"/>}
        </button>)}
      </div>
      <button type="button" className="dock-add" onClick={() => open('sale')} title="New sale (F2)">
        + Sale
      </button>
      <button type="button" className="dock-add" onClick={() => open('purchase')} title="New purchase (Shift+F2)">
        + Purchase
      </button>
    </nav>}
  </>;
}

export function TransactionHome({ kind, windows, open, activate }: {
  kind: WorkKind; windows: WorkWindow[]; open: (kind: WorkKind) => void;
  activate: (id: string) => void;
}) {
  const matching = windows.filter(window => window.kind === kind);
  const icon = kind === 'sale' ? 'sales' : 'truck';
  return <section className="transaction-launcher">
    <div className="launch-main">
      <span className="launch-overline">AH POS · DESKTOP OPERATIONS</span>
      <div className="launch-symbol"><AppIcon name={icon} size={42}/></div>
      <h2>{kind === 'sale' ? 'Sales Invoice Workspace' : 'Purchase Invoice Workspace'}</h2>
      <p>Work on multiple {kind === 'sale' ? 'customer bills' : 'supplier purchases'} without losing the
        other drafts. Open another window, minimize an invoice, or switch directly using the bottom task dock.</p>
      <button type="button" className="launch-primary" onClick={() => open(kind)}>
        <AppIcon name={icon} size={21}/> Open new {kind === 'sale' ? 'sale' : 'purchase'} window
        <kbd>{kind === 'sale' ? 'F2' : 'Shift+F2'}</kbd>
      </button>
      <div className="launch-controls">
        <span><AppIcon name="check" size={16}/> Independent cart per window</span>
        <span><AppIcon name="check" size={16}/> Switch without clearing another cart</span>
        <span><AppIcon name="check" size={16}/> Server-authoritative posting</span>
      </div>
    </div>
    <div className="launch-side">
      <div className="panel-heading">
        <div><span className="small-overline">OPEN DOCUMENTS</span>
          <h2>Current {kind === 'sale' ? 'sales' : 'purchases'}</h2></div>
        <span className="count-pill">{matching.length} open</span>
      </div>
      {matching.length ? matching.map(item => <button type="button" key={item.id}
        className="launch-existing" onClick={() => activate(item.id)}>
        <AppIcon name={icon} size={20}/>
        <span><strong>{item.label}</strong>
          <small>{item.dirty ? 'Unposted draft' : 'Ready for entry'} · Click to restore</small></span>
        <AppIcon name="arrow" size={17}/>
      </button>) : <p className="empty-copy">No open {kind} windows. Start a new document above.</p>}
      <p className="launch-caution">Minimized drafts remain in this browser tab. Closing the tab or refreshing
        currently discards unposted drafts. Durable held invoices are a separate server-backed feature.</p>
    </div>
  </section>;
}
