import { useState } from 'react';
import { api } from '../api';
import type { State } from '../types';
import { LANGUAGES, type SupportedLang } from '../i18nMeta';

type Toast = { kind: 'success' | 'error' | 'info'; text: string };
type Props = { state: State; onResult: (t: Toast) => void; onChange: () => void };

function LangIdRow(props: {
  lang: { id: SupportedLang; flag: string; native: string };
  current: number | null;
  busy: boolean;
  onSave: (id: number | null) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const placeholder = props.current !== null ? String(props.current) : '— not set —';

  async function save() {
    if (value.trim() === '') return;
    const id = Number(value);
    if (!Number.isFinite(id) || id === 0) return;
    await props.onSave(id);
    setValue('');
  }
  async function clear() {
    if (!confirm(`Remove ${props.lang.native} ID?`)) return;
    await props.onSave(null);
  }

  return (
    <div className="lang-id-row">
      <span className="lang-id-label">
        <span className="lang-id-flag">{props.lang.flag}</span>
        {props.lang.native}
      </span>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn" disabled={props.busy || !value.trim()} onClick={save}>
        Save
      </button>
      {props.current !== null && (
        <button className="btn btn-danger" disabled={props.busy} onClick={clear} title="Clear">
          ×
        </button>
      )}
    </div>
  );
}

export function Config({ state, onResult, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function run<T>(label: string, fn: () => Promise<T>) {
    setBusy(true);
    try {
      await fn();
      onResult({ kind: 'success', text: label });
      await onChange();
    } catch (e) {
      onResult({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="card-title">News channels (one per language)</div>
        <div className="lang-id-list">
          {LANGUAGES.map((lang) => (
            <LangIdRow
              key={lang.id}
              lang={lang}
              current={state.config.channels[lang.id]}
              busy={busy}
              onSave={(id) =>
                run(
                  `${lang.flag} channel ${id === null ? 'cleared' : 'updated'}`,
                  () => api.setChannel(lang.id, id),
                )
              }
            />
          ))}
        </div>
        <div className="html-hint" style={{ marginTop: 12 }}>
          IDs look like <code>-1001234567890</code>. Forward a message from the
          channel to <i>@userinfobot</i> to find the ID.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Discussion groups (one per language)</div>
        <div className="lang-id-list">
          {LANGUAGES.map((lang) => (
            <LangIdRow
              key={lang.id}
              lang={lang}
              current={state.config.groups[lang.id]}
              busy={busy}
              onSave={(id) =>
                run(
                  `${lang.flag} group ${id === null ? 'cleared' : 'updated'}`,
                  () => api.setGroup(lang.id, id),
                )
              }
            />
          ))}
        </div>
        <div className="html-hint" style={{ marginTop: 12 }}>
          The cheerleader replies in the group's configured language —
          a Russian group always gets Russian reactions.
        </div>
      </div>

      <div className="card">
        <div className="card-title">AI cheerleader</div>
        <div className="toggle">
          <div className="toggle-label">
            <span className="name">Enabled</span>
            <span className="hint">Master switch — when off, the AI never speaks.</span>
          </div>
          <button
            className={`toggle-state ${state.config.aiOn ? 'on' : 'off'}`}
            disabled={busy}
            onClick={() => run('AI toggled', () => api.aiToggle())}
          >
            {state.config.aiOn ? '🟢 ON' : '🔴 OFF'}
          </button>
        </div>
        <div className="toggle">
          <div className="toggle-label">
            <span className="name">Audience</span>
            <span className="hint">
              Beta-only: replies only to admin + testers. Public: everyone.
            </span>
          </div>
          <button
            className={`toggle-state ${state.config.aiPublic ? 'on' : 'beta'}`}
            disabled={busy}
            onClick={() => run('Audience toggled', () => api.aiPublic())}
          >
            {state.config.aiPublic ? '🌍 PUBLIC' : '🧪 BETA'}
          </button>
        </div>
      </div>
    </>
  );
}
