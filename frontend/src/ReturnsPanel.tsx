import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError, getSaleReceipt, listSaleReturns, listSales, postSaleReturn,
  type SaleReceipt, type SaleRecord, type SaleReturnRecord, type TenantChoice,
} from './api';
import { AppIcon } from './AppIcon';

const displayMoney = (amount: string | number) => new Intl.NumberFormat('en-PK', {
  style: 'currency', currency: 'PKR', minimumFractionDigits: 2,
}).format(Number(amount));

export function ReturnsPanel({ tenant }: { tenant: TenantChoice }) {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [returns, setReturns] = useState<SaleReturnRecord[]>([]);
  const [saleUlid, setSaleUlid] = useState('');
  const [sale, setSale] = useState<SaleReceipt | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [last, setLast] = useState<SaleReturnRecord | null>(null);
  const operationKey = useRef(crypto.randomUUID());

  const refresh = useCallback(async () => {
    try {
      const [sold, refunded] = await Promise.all([
        listSales(tenant.ulid), listSaleReturns(tenant.ulid),
      ]);
      setSales(sold);
      setReturns(refunded);
    } catch {
      setError(true); setMessage('Could not load sales and returns. Check permissions and backend.');
    }
  }, [tenant.ulid]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function selectSale(ulid: string) {
    setSaleUlid(ulid); setSale(null); setQuantities({});
    setLast(null); setMessage(''); setError(false);
    if (!ulid) return;
    try {
      const details = await getSaleReceipt(tenant.ulid, ulid);
      setSale(details);
    } catch {
      setError(true); setMessage('Selected sale is unavailable.');
    }
  }

  const selectedLines = sale?.lines.filter(line => Number(quantities[line.ulid] || '0') > 0) || [];
  const estimate = selectedLines.reduce((total, line) =>
    total + Number(quantities[line.ulid]) * Number(line.unit_price), 0);

  async function submit() {
    if (!sale || busy || selectedLines.length === 0 || reason.trim().length < 3) return;
    setBusy(true); setError(false); setMessage('');
    try {
      const result = await postSaleReturn(tenant.ulid, {
        sale_ulid: sale.sale.ulid,
        idempotency_key: operationKey.current,
        reason: reason.trim(),
        lines: selectedLines.map(line => ({
          sale_line_ulid: line.ulid, quantity: quantities[line.ulid],
        })),
      });
      operationKey.current = crypto.randomUUID();
      setLast({
        ulid: result.ulid, sale_ulid: result.sale_ulid,
        reason: reason.trim(), refund_total: result.refund_total,
        refund_method: 'cash', status: 'posted', created_at: new Date().toISOString(),
      });
      setQuantities({}); setReason('');
      setMessage(result.replayed ? 'Existing return confirmed. Stock was not added twice.'
        : 'Cash refund recorded. Returned stock restored to the original warehouse.');
      await refresh();
    } catch (e) {
      setError(true);
      setMessage(e instanceof ApiError ? e.message : 'Refund failed. Review this sale and retry.');
    } finally { setBusy(false); }
  }

  return <div className="returns-layout">
    <section className="panel-card">
      <div className="panel-heading">
        <div><span className="small-overline">REVERSAL WORKFLOW</span><h2>Return a cash sale</h2></div>
        <span className="status-tag">Local pilot</span>
      </div>
      <p className="muted">Refunds never edit the original invoice. Return records and incoming stock movements are permanently linked to the source sale.</p>
      <label>Original sale
        <select value={saleUlid} onChange={e => void selectSale(e.target.value)}>
          <option value="">Choose a posted cash sale</option>
          {sales.map(item => <option value={item.ulid} key={item.ulid}>
            #{item.ulid.slice(-10)} · {item.customer_name || 'Walk-in'} · {displayMoney(item.total)}
          </option>)}
        </select>
      </label>
      {sale && <>
        <div className="return-sale-summary">
          <div><span>Original invoice</span><strong>#{sale.sale.ulid.slice(-10)}</strong></div>
          <div><span>Original total</span><strong>{displayMoney(sale.sale.total)}</strong></div>
          <div><span>Warehouse</span><strong>{sale.sale.warehouse_name}</strong></div>
        </div>
        <div className="table-scroll"><table className="data-table return-lines"><thead>
          <tr><th>Sold product</th><th>Sold qty</th><th>Unit price</th><th>Return qty</th></tr>
        </thead><tbody>{sale.lines.map(line => <tr key={line.ulid}>
          <td><strong>{line.product_name}</strong><small>{line.sku}</small></td>
          <td>{line.quantity}</td><td>{displayMoney(line.unit_price)}</td>
          <td><input aria-label={'Return quantity for '+line.product_name}
            inputMode="decimal" placeholder="0" value={quantities[line.ulid] || ''}
            onChange={e => setQuantities(q => ({ ...q, [line.ulid]: e.target.value }))}/></td>
        </tr>)}</tbody></table></div>
        <p className="muted">Enter quantity to return for each item. Server verifies previously returned quantities and rejects over-refunds.</p>
        <label>Reason for return
          <textarea required minLength={3} maxLength={500} rows={3}
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer returned item in original condition"/>
        </label>
        <div className="refund-summary">
          <div><span>Estimated cash refund</span><strong>{displayMoney(estimate)}</strong></div>
          <small>Authoritative refund is calculated from original sale prices on the server.</small>
        </div>
        <button type="button" className="primary-post" disabled={busy || selectedLines.length === 0 || reason.trim().length < 3}
          onClick={() => void submit()}>
          <AppIcon name="check" size={18}/>{busy ? 'Posting return…' : 'Record refund & restore stock'}
        </button>
      </>}
      {!sale && <div className="empty-transaction"><AppIcon name="sales" size={28}/>
        <strong>Select a sale</strong><span>Find a recent receipt to start a partial or full return.</span></div>}
      {last && <div className="receipt-success"><strong>Recorded refund: {displayMoney(last.refund_total)}</strong>
        <span>Return ULID: {last.ulid}</span></div>}
      {message && <p role="status" className={error ? 'inline-alert' : 'inline-success'}>{message}</p>}
      <p className="pos-warning">Cash refund is recorded in AH POS; actual cash handover must be handled by the cashier. Drawer reconciliation, accounting, tax reversals and fiscal refund notes remain pending.</p>
    </section>

    <section className="panel-card">
      <div className="panel-heading"><div><span className="small-overline">REFUND REGISTER</span><h2>Recent cash returns</h2></div>
        <button className="btn-ghost" type="button" onClick={() => void refresh()}>Refresh</button></div>
      {returns.map(item => <div className="history-entry" key={item.ulid}>
        <div><strong>#{item.ulid.slice(-10)}</strong>
          <span>Sale #{item.sale_ulid.slice(-10)}</span>
          <small>{item.reason} · {new Date(item.created_at).toLocaleString()}</small></div>
        <b>{displayMoney(item.refund_total)}</b>
      </div>)}
      {returns.length === 0 && <p className="empty-copy">No cash refunds recorded yet.</p>}
    </section>
  </div>;
}
