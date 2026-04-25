import { useState } from 'react';
import { useStore } from '../state/store';
import { useT } from '../i18n';
import { LANGUAGES } from '../i18n/languages';

type Props = {
  title: string;
  onAdd?: () => void;
};

export function TopBar({ title, onAdd }: Props) {
  const { t } = useT();
  const view = useStore((s) => s.view);
  const editing = useStore((s) => s.editing);
  const setEditing = useStore((s) => s.setEditing);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const [menuOpen, setMenuOpen] = useState(false);

  const showEdit = view === 'convert';

  return (
    <header className="topbar">
      <div className="topbar-side">
        {showEdit && editing ? (
          <button className="text-btn" onClick={() => setEditing(false)}>
            {t.done}
          </button>
        ) : null}
      </div>

      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-side topbar-actions">
        {onAdd && !editing ? (
          <button className="icon-btn" onClick={onAdd} aria-label={t.addCurrency}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        ) : null}
        <button
          className="icon-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t.settings}
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        {menuOpen ? (
          <>
            <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="menu-popover" role="menu">
              {showEdit ? (
                <button
                  className="menu-item"
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  {t.edit}
                </button>
              ) : null}
              <div className="menu-section">{t.language}</div>
              {LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  className={`menu-item menu-lang ${language === l.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setLanguage(l.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className={`fi fi-${l.flagCode}`} />
                  <span>{l.native}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
