import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { State } from './types';
import { Dashboard } from './tabs/Dashboard';
import { Posts } from './tabs/Posts';
import { Config } from './tabs/Config';
import { Testers } from './tabs/Testers';

type Tab = 'dashboard' | 'posts' | 'config' | 'testers';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'posts', label: '✍️ Posts' },
  { id: 'config', label: '⚙️ Config' },
  { id: 'testers', label: '🧪 Testers' },
];

type Toast = { kind: 'success' | 'error' | 'info'; text: string };

export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const me = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const initData = window.Telegram?.WebApp?.initData ?? '';

  const refresh = useCallback(async () => {
    try {
      const next = await api.state();
      setState(next);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (t.kind === 'error') window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    if (t.kind === 'success') window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!initData) {
    return (
      <div className="app">
        <div className="error-card">
          <b>Open this page from inside Telegram.</b>
          <p style={{ margin: '8px 0 0' }}>
            The admin panel only runs as a Telegram Mini App, where it can verify your identity automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>BigRate Admin</h1>
        {me && <div className="me">@{me.first_name ?? me.id}</div>}
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="error-card">
          <b>Couldn't load admin data.</b>
          <p style={{ margin: '8px 0 0' }}>{error}</p>
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {!state && !error && <div className="empty">Loading…</div>}

      {state && tab === 'dashboard' && <Dashboard state={state} onRefresh={refresh} />}
      {state && tab === 'posts' && <Posts onResult={showToast} state={state} />}
      {state && tab === 'config' && (
        <Config state={state} onResult={showToast} onChange={refresh} />
      )}
      {state && tab === 'testers' && (
        <Testers state={state} onResult={showToast} onChange={refresh} />
      )}

      {toast && <div className={`toast ${toast.kind}`}>{toast.text}</div>}
    </div>
  );
}
