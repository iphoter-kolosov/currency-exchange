import { useStore } from '../state/store';
import { useT } from '../i18n';

export function BottomNav() {
  const { t } = useT();
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  return (
    <nav className="bottom-nav" aria-label="Main">
      <button
        className={`nav-btn ${view === 'convert' ? 'is-active' : ''}`}
        onClick={() => setView('convert')}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h12l-3-3" />
          <path d="M17 17H5l3 3" />
        </svg>
        <span>{t.convert}</span>
      </button>
      <button
        className={`nav-btn ${view === 'chart' ? 'is-active' : ''}`}
        onClick={() => setView('chart')}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-6 4 4 5-7 4 5" />
        </svg>
        <span>{t.chart}</span>
      </button>
    </nav>
  );
}
