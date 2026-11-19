import { useEffect, useState } from 'react';
import { AppIcon } from './AppIcon';
import { PosPanel } from './PosPanel';
import { PurchasingPanel } from './PurchasingPanel';
import { discardSaleHold, listSaleHolds, type SaleHold, type TenantChoice } from './api';

export type WorkKind = 'sale' | 'purchase';
export type WorkWindow = {
  id: string;
  kind: WorkKind;
  label: string;
  number: number;
  dirty: boolean;
  initialHold?: SaleHold;
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
  onHoldsChanged: () => void;
};

function WindowContent({ kind, tenant, onDirtyChange, active, initialHold, windowLabel, onHoldsChanged, onMinimize }: {
  kind: WorkKind;
  tenant: TenantChoice;
  onDirtyChange: (dirty: boolean) => void;
  active: boolean;
  initialHold?: SaleHold;
  windowLabel: string;
  onHoldsChanged: () => void;
  onMinimize: () => void;
}) {
  return kind === 'sale'
    ? <PosPanel tenant={tenant} onDraftChange={onDirtyChange} active={active}
        initialHold={initialHold} windowLabel={windowLabel}
        onHoldSaved={onHoldsChanged} onMinimize={onMinimize} />
    : <PurchasingPanel tenant={tenant} onDraftChange={onDirtyChange} active={active} />;
}

export function TransactionWorkbench({
  tenant, windows, activeId, open, activate, minimize, close, markDirty, onHoldsChanged,
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
            <WindowContent kind={item.kind} tenant={tenant} active={item.id === activeId}
              initialHold={item.initialHold} windowLabel={item.label}
              onHoldsChanged={onHoldsChanged} onMinimize={minimize}
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

export function TransactionHome({
  kind, tenant, windows, open, activate, restoreHold, holdsVersion,
}: {
  kind: WorkKind; tenant: TenantChoice; windows: WorkWindow[];
  open: (kind: WorkKind) => void; activate: (id: string) => void;
  restoreHold: (hold: SaleHold) => void; holdsVersion: number;
}) {
  const [holds, setHolds] = useState<SaleHold[]>([]);
  const [holdError, setHoldError] = useState('');
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (kind !== 'sale') return;
    let active = true;
    void listSaleHolds(tenant.ulid).then(data => {
      if (active) { setHolds(data); setHoldError(''); }
    }).catch(() => {
      if (active) setHoldError('Unable to load saved held bills. Check connection and permissions.');
    });
    return () => { active = false; };
  }, [tenant.ulid, kind, holdsVersion]);
  const matching = windows.filter(window => window.kind === kind);
  const icon = kind === 'sale' ? 'sales' : 'truck';

  async function discard(hold: SaleHold) {
    if (working || !window.confirm('Discard saved hold "' + hold.title + '"? This cannot be undone.')) return;
    setWorking(true);
    try {
      await discardSaleHold(tenant.ulid, hold.ulid);
      setHolds(items => items.filter(item => item.ulid !== hold.ulid));
      setHoldError('');
    } catch { setHoldError('Unable to discard held bill. It may have been posted already.'); }
    finally { setWorking(false); }
  }

  return <section className="transaction-launcher">
    <div className="launch-main">
      <span className="launch-overline">AH POS · DESKTOP OPERATIONS</span>
      <div className="launch-symbol"><AppIcon name={icon} size={42}/></div>
      <h2>{kind === 'sale' ? 'Sales Invoice Workspace' : 'Purchase Invoice Workspace'}</h2>
      <p>Work on multiple {kind === 'sale' ? 'customer bills' : 'supplier purchases'} without losing
        other drafts. Each invoice is independent; minimize and switch using the bottom task dock.</p>
      <button type="button" className="launch-primary" onClick={() => open(kind)}>
        <AppIcon name={icon} size={21}/> New {kind === 'sale' ? 'sale' : 'purchase'} window
        <kbd>{kind === 'sale' ? 'F2' : 'Shift+F2'}</kbd>
      </button>
      <div className="launch-controls">
        <span><AppIcon name="check" size={16}/> Independent invoice per window</span>
        <span><AppIcon name="check" size={16}/> Rapid switching across customers</span>
        <span><AppIcon name="check" size={16}/> Tenant-scoped transactions</span>
      </div>
    </div>
    <div className="launch-side">
      <div className="panel-heading">
        <div><span className="small-overline">LIVE WINDOWS</span>
          <h2>Open {kind === 'sale' ? 'sales' : 'purchases'}</h2></div>
        <span className="count-pill">{matching.length}</span>
      </div>
      {matching.length ? matching.map(item => <button type="button" key={item.id}
        className="launch-existing" onClick={() => activate(item.id)}>
        <AppIcon name={icon} size={20}/>
        <span><strong>{item.label}</strong>
          <small>{item.initialHold ? 'Restored held invoice' : item.dirty ? 'Unposted draft' : 'Ready for entry'} · Switch to window</small></span>
        <AppIcon name="arrow" size={17}/>
      </button>) : <p className="empty-copy">No open windows. Start a new document.</p>}
      {kind === 'sale' && <>
        <div className="panel-heading held-section-heading">
          <div><span className="small-overline">ON HOLD / GET</span>
            <h2>Saved customer bills</h2></div>
          <span className="count-pill">{holds.length}</span>
        </div>
        {holds.map(hold => <div className="held-document" key={hold.ulid}>
          <div className="held-document-details">
            <strong>{hold.title}</strong>
            <small>{hold.customer_name || 'Walk-in'} · {hold.lines.length} product lines</small>
            <small>Saved {new Date(hold.updated_at).toLocaleString()}</small>
          </div>
          <div className="held-document-actions">
            <button type="button" className="held-restore" onClick={() => restoreHold(hold)}
              disabled={hold.lines.some(line => !line.product)} title="Restore saved cart">Get</button>
            <button type="button" className="held-discard" onClick={() => void discard(hold)}
              disabled={working} title="Discard saved held bill">×</button>
          </div>
        </div>)}
        {holds.length === 0 && <p className="empty-copy">No held sales. Use “Hold bill & switch” inside an open sale window.</p>}
        {holdError && <p className="inline-alert">{holdError}</p>}
        <p className="launch-caution">Saved held bills persist in the local test database and do not reserve stock.
          Original prices and availability are checked again at checkout.</p>
      </>}
      {kind === 'purchase' && <p className="launch-caution">
        Purchase windows keep independent drafts until you close or refresh the browser tab.
        Server-persisted purchase holds are not implemented yet.</p>}
    </div>
  </section>;
}
