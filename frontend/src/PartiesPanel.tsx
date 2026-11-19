import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, createParty, listParties, type Party, type PartyType, type TenantChoice } from './api';

export function PartiesPanel({ tenant, initialType }: { tenant: TenantChoice; initialType: PartyType }) {
  const kind = initialType;
  const [records, setRecords] = useState<Party[]>([]);
  const [query, setQuery] = useState('');
  const [input, setInput] = useState({ name: '', phone: '', email: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const page = await listParties(tenant.ulid, kind, search);
      setRecords(page.data);
      setTotal(page.total);
      setAllowed(true);
    } catch (error) {
      setRecords([]);
      setAllowed(!(error instanceof ApiError && error.status === 403));
      setMessage(error instanceof ApiError && error.status === 403
        ? 'Directory access not assigned. Run local catalog grant again to add party permissions.'
        : 'Could not load customer/supplier directory.');
    } finally {
      setLoading(false);
    }
  }, [kind, tenant.ulid]);

  useEffect(() => {
    setQuery('');
    setMessage('');
    void refresh('');
  }, [refresh]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const item = await createParty(tenant.ulid, { type: kind, ...input });
      setInput({ name: '', phone: '', email: '', address: '' });
      await refresh(query);
      setMessage(`${kind === 'customer' ? 'Customer' : 'Supplier'} "${item.name}" saved successfully.`);
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 403
        ? 'You do not have permission to create customers or suppliers.'
        : error instanceof ApiError && error.status === 422
          ? 'Please check name, phone, email and address fields.'
          : 'Unable to save this record.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section catalog" aria-labelledby="parties-title">
      <div className="between">
        <div>
          <h2 id="parties-title">{kind === 'customer' ? 'Customers' : 'Suppliers'} — {tenant.name}</h2>
          <p>Contact directory. Credit ledger and opening balances are not implemented yet.</p>
        </div>
        <span className="catalog-count">{total} {kind === 'customer' ? 'customers' : 'suppliers'}</span>
      </div>
      {allowed && <>
        <form className="catalog-form" onSubmit={e => { void save(e); }}>
          <h3>Add {kind}</h3>
          <div className="catalog-fields">
            <label>Name<input required maxLength={180} value={input.name}
              onChange={e => setInput(v => ({ ...v, name: e.target.value }))} placeholder="Full name / business" /></label>
            <label>Phone<input maxLength={40} type="tel" value={input.phone}
              onChange={e => setInput(v => ({ ...v, phone: e.target.value }))} placeholder="Phone number" /></label>
            <label>Email<input type="email" maxLength={255} value={input.email}
              onChange={e => setInput(v => ({ ...v, email: e.target.value }))} placeholder="Optional email" /></label>
            <label>Address<input maxLength={2000} value={input.address}
              onChange={e => setInput(v => ({ ...v, address: e.target.value }))} placeholder="Optional address" /></label>
          </div>
          <button disabled={busy} type="submit">{busy ? 'Saving…' : `Save ${kind}`}</button>
        </form>
        <form className="catalog-search" onSubmit={e => { e.preventDefault(); void refresh(query); }}>
          <label htmlFor="party-search">Search {kind}s</label>
          <div className="catalog-search-row">
            <input id="party-search" maxLength={120} placeholder="Name, phone or email" value={query}
              onChange={e => setQuery(e.target.value)} />
            <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
          </div>
        </form>
        <div className="catalog-table-wrap">
          <table className="catalog-table">
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Status</th></tr></thead>
            <tbody>{records.map(record => <tr key={record.ulid}>
              <td>{record.name}</td><td>{record.phone || '—'}</td><td>{record.email || '—'}</td>
              <td>{record.address || '—'}</td><td>{record.is_active ? 'Active' : 'Inactive'}</td>
            </tr>)}</tbody>
          </table>
          {records.length === 0 && <p>{loading ? 'Loading…' : 'No records found.'}</p>}
          {total > 30 && <p>Showing first 30. Pagination controls pending.</p>}
        </div>
      </>}
      {message && <p role="status" className="notice">{message}</p>}
    </section>
  );
}
