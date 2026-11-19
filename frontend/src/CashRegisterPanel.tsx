import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ApiError, closeCashShift, listCashShifts, listWarehouses, openCashShift,
  type CashClosure, type CashShift, type TenantChoice, type Warehouse,
} from './api';
import { AppIcon } from './AppIcon';

function money(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR',
    minimumFractionDigits: 2 }).format(Number(value || 0));
}

export function CashRegisterPanel({ tenant }: { tenant: TenantChoice }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [warehouse, setWarehouse] = useState('');
  const [openingCash, setOpeningCash] = useState('0.0000');
  const [openingNote, setOpeningNote] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [closing, setClosing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [lastClose, setLastClose] = useState<CashClosure | null>(null);

  const load = useCallback(async () => {
    try {
      const [places, sessions] = await Promise.all([
        listWarehouses(tenant.ulid), listCashShifts(tenant.ulid),
      ]);
      setWarehouses(places.filter(place => place.is_active));
      setShifts(sessions);
      setWarehouse(value => value || places.find(place => place.is_active)?.ulid || '');
    } catch (ex) {
      setError(true);
      setMessage(ex instanceof ApiError ? ex.message : 'Unable to load cash register records.');
    }
  }, [tenant.ulid]);

  useEffect(() => { void load(); }, [load]);

  async function openShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(''); setError(false); setLastClose(null);
    try {
      await openCashShift(tenant.ulid, {
        warehouse_ulid: warehouse, opening_cash: openingCash, opening_note: openingNote,
      });
      setOpeningNote('');
      setMessage('Cashier shift opened. New cash sales and cash refunds will be linked to this shift.');
      await load();
    } catch (ex) {
      setError(true);
      setMessage(ex instanceof ApiError ? ex.message : 'Unable to open shift.');
    } finally { setBusy(false); }
  }

  async function closeShift(shift: CashShift) {
    setBusy(true); setMessage(''); setError(false);
    try {
      const closed = await closeCashShift(tenant.ulid, shift.ulid, {
        counted_cash: closingCash, closing_note: closingNote,
      });
      setLastClose(closed);
      setClosing(null); setClosingCash(''); setClosingNote('');
      setMessage('Cash shift closed. Reconciliation snapshot is saved and immutable.');
      await load();
    } catch (ex) {
      setError(true);
      setMessage(ex instanceof ApiError ? ex.message : 'Unable to close shift.');
    } finally { setBusy(false); }
  }

  const open = shifts.filter(shift => shift.is_open);
  const history = shifts.filter(shift => !shift.is_open);

  return <div className="cash-register-layout">
    <section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">CASHIER OPERATIONS</span>
        <h2>Open a cash shift</h2></div><span className="status-tag">Local pilot</span></div>
      <p className="muted">Each cashier can open one shift per warehouse. A cash shift starts with a counted opening float. Only sales and refunds made while it is open are linked to it.</p>
      <form className="compact-form" onSubmit={e => { void openShift(e); }}>
        <div className="field-row">
          <label>Warehouse<select required value={warehouse} onChange={e => setWarehouse(e.target.value)}>
            <option value="">Choose warehouse</option>
            {warehouses.map(place => <option key={place.ulid} value={place.ulid}>{place.name}</option>)}
          </select></label>
          <label>Opening cash (PKR)<input required inputMode="decimal"
            value={openingCash} onChange={e => setOpeningCash(e.target.value)}/></label>
        </div>
        <label>Opening note<input maxLength={500} placeholder="Optional opening float reference"
          value={openingNote} onChange={e => setOpeningNote(e.target.value)}/></label>
        <button type="submit" className="primary-post" style={{marginTop:16}} disabled={busy || !warehouse}>
          <AppIcon name="check" size={18}/>{busy ? 'Working…' : 'Open cashier shift'}
        </button>
      </form>
      <p className="pos-warning">Opening cash and calculated close totals are local operational controls, not accounting ledger or verified physical cash movement.</p>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">LIVE CASH SESSIONS</span>
        <h2>Current shifts</h2></div>
        <button className="btn-ghost" type="button" onClick={() => void load()}>Refresh</button></div>
      {open.map(shift => <div className="cash-shift-card" key={shift.ulid}>
        <div className="cash-shift-title"><span className="status-tag"><span className="release-pulse"/> Open</span>
          <strong>{shift.warehouse_name}</strong><small>{new Date(shift.created_at).toLocaleString()}</small></div>
        <div className="cash-kpis">
          <div><span>Opening float</span><strong>{money(shift.opening_cash)}</strong></div>
          <div><span>Linked cash sales</span><strong>{money(shift.cash_sales)}</strong></div>
          <div><span>Linked cash refunds</span><strong>{money(shift.cash_refunds)}</strong></div>
          <div className="cash-expected"><span>Expected cash</span><strong>{money(shift.expected_cash)}</strong></div>
        </div>
        {closing === shift.ulid ? <div className="cash-close-form">
          <div className="inline-alert">Verify physical cash before recording closure. This snapshot cannot be edited.</div>
          <label>Counted physical cash (PKR)
            <input required inputMode="decimal" value={closingCash} onChange={e => setClosingCash(e.target.value)} placeholder="0.0000"/>
          </label>
          <label>Closing note<input maxLength={500} value={closingNote}
            onChange={e => setClosingNote(e.target.value)} placeholder="Optional discrepancy explanation"/></label>
          <p className="muted">Estimated variance: {closingCash === '' ? '—' : money(Number(closingCash) - Number(shift.expected_cash))}</p>
          <div className="cash-close-actions">
            <button type="button" className="btn-ghost" onClick={() => setClosing(null)}>Cancel</button>
            <button type="button" className="primary-post" disabled={busy || closingCash === ''}
              onClick={() => void closeShift(shift)}>{busy ? 'Closing…' : 'Confirm and close shift'}</button>
          </div>
        </div> : <button type="button" className="btn-ghost cash-close-trigger"
          onClick={() => { setClosing(shift.ulid); setClosingCash(''); setClosingNote(''); }}>
          Close & reconcile <AppIcon name="arrow" size={16}/>
        </button>}
      </div>)}
      {open.length === 0 && <div className="empty-transaction"><AppIcon name="warehouse" size={29}/>
        <strong>No active shifts</strong><span>Open a cashier shift to track linked cash transactions.</span></div>}
    </section>

    <section className="panel-card cash-history">
      <div className="panel-heading"><div><span className="small-overline">CASH CLOSE REGISTER</span>
        <h2>Previous reconciliations</h2></div><span className="count-pill">Last 30</span></div>
      <div className="table-scroll"><table className="data-table">
        <thead><tr><th>Warehouse</th><th>Opened</th><th>Closed</th><th className="num">Expected</th>
          <th className="num">Counted</th><th className="num">Variance</th></tr></thead>
        <tbody>{history.map(shift => <tr key={shift.ulid}>
          <td>{shift.warehouse_name}<small className="cash-history-id">{shift.ulid.slice(-9)}</small></td>
          <td>{new Date(shift.created_at).toLocaleString()}</td>
          <td>{shift.closed_at ? new Date(shift.closed_at).toLocaleString() : '—'}</td>
          <td className="num">{money(shift.expected_cash)}</td>
          <td className="num">{money(shift.counted_cash)}</td>
          <td className={'num '+(Number(shift.difference)===0 ? 'reconciled' : 'variance')}>
            {money(shift.difference)}</td>
        </tr>)}</tbody>
      </table></div>
      {history.length === 0 && <p className="empty-copy">No cash closures recorded yet.</p>}
    </section>
    {lastClose && <p className="inline-success">Closed: expected {money(lastClose.expected_cash)} · counted {money(lastClose.counted_cash)} · difference {money(lastClose.difference)}</p>}
    {message && <p role="status" className={error ? 'inline-alert' : 'inline-success'}>{message}</p>}
  </div>;
}
