import { useEffect, useState, type FormEvent } from 'react';
import {
  ApiError, login, logout, me, myTenants, tenantContext,
  type Profile, type TenantChoice,
} from './api';

type Screen = 'loading' | 'guest' | 'authenticated' | 'unavailable';

export function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenants, setTenants] = useState<TenantChoice[]>([]);
  const [selected, setSelected] = useState<TenantChoice | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    void me().then(async (user) => {
      const choices = await myTenants();
      if (!cancelled) {
        setProfile(user);
        setTenants(choices);
        setScreen('authenticated');
      }
    }).catch((error: unknown) => {
      if (cancelled) return;
      setScreen(error instanceof ApiError && error.status === 401 ? 'guest' : 'unavailable');
      if (!(error instanceof ApiError && error.status === 401)) {
        setMessage('Backend connection unavailable. Start Laravel on port 8000, then retry.');
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const user = await login(email.trim(), password);
      const choices = await myTenants();
      setProfile(user);
      setTenants(choices);
      setSelected(null);
      setPassword('');
      setScreen('authenticated');
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 401
        ? 'Invalid email or password.'
        : error instanceof ApiError && error.status === 419
          ? 'Session expired. Please try again.'
          : 'Unable to log in. Check that Laravel is running.');
    } finally {
      setBusy(false);
    }
  }

  async function chooseTenant(choice: TenantChoice) {
    setBusy(true);
    setMessage('');
    try {
      const verified = await tenantContext(choice.ulid);
      setSelected(verified);
    } catch {
      setSelected(null);
      setMessage('Tenant access was denied or your session expired. Refresh and sign in again.');
    } finally {
      setBusy(false);
    }
  }

  async function submitLogout() {
    setBusy(true);
    setMessage('');
    try {
      await logout();
      setProfile(null);
      setTenants([]);
      setSelected(null);
      setScreen('guest');
    } catch {
      setMessage('Logout could not be confirmed. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <span className="eyebrow">AH-POS / DEVELOPMENT</span>
        <h1>Secure workspace</h1>
        <p>Temporary engineering interface for authentication and tenant access testing. Not the approved production design.</p>
      </header>

      {screen === 'loading' && <section className="section" role="status">Checking your session…</section>}

      {(screen === 'guest' || screen === 'unavailable') && (
        <section className="section auth-panel" aria-labelledby="login-title">
          <h2 id="login-title">Sign in</h2>
          <p>Use an existing authorized test account. Public registration is disabled.</p>
          {screen === 'unavailable' ? (
            <button type="button" onClick={() => window.location.reload()}>Retry connection</button>
          ) : (
            <form onSubmit={(event) => void submitLogin(event)}>
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={255} />
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
          )}
        </section>
      )}

      {screen === 'authenticated' && profile && (
        <>
          <section className="section">
            <div className="between">
              <div>
                <h2>Signed in</h2>
                <p><strong>{profile.name}</strong> — {profile.email}</p>
              </div>
              <button type="button" disabled={busy} onClick={() => void submitLogout()}>Log out</button>
            </div>
          </section>
          <section className="section" aria-labelledby="tenants-title">
            <h2 id="tenants-title">Authorized tenants</h2>
            {tenants.length === 0 ? (
              <p>No active tenant memberships assigned. Contact a platform administrator.</p>
            ) : (
              <ul className="modules">
                {tenants.map((tenant) => (
                  <li key={tenant.ulid}>
                    <span>{tenant.name}</span>
                    <button type="button" disabled={busy} onClick={() => void chooseTenant(tenant)}>
                      {selected?.ulid === tenant.ulid ? 'Selected' : 'Select'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selected && <p role="status">Authorized context: <strong>{selected.name}</strong>. Business modules are not implemented yet.</p>}
          </section>
        </>
      )}

      {message && <p className="notice" role="alert">{message}</p>}
      <footer>Local test environment. No production tenant access, sales posting, or financial operations are available.</footer>
    </main>
  );
}
