import { useMemo, useState } from 'react';
import { api } from '../api';
import type { State } from '../types';
import { LANGUAGES, type SupportedLang } from '../i18nMeta';

type Toast = { kind: 'success' | 'error' | 'info'; text: string };
type Props = { state: State; onResult: (t: Toast) => void };

type Drafts = Record<SupportedLang, string>;

const EMPTY_DRAFTS: Drafts = { en: '', ru: '', es: '', zh: '', ar: '' };

export function Posts({ state, onResult }: Props) {
  const [drafts, setDrafts] = useState<Drafts>(EMPTY_DRAFTS);
  const [enabled, setEnabled] = useState<Record<SupportedLang, boolean>>({
    en: true, ru: true, es: true, zh: true, ar: true,
  });
  const [activeTab, setActiveTab] = useState<SupportedLang>('en');
  const [sponsor, setSponsor] = useState('');
  const [translating, setTranslating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const channelMissing = useMemo(() => {
    const missing: SupportedLang[] = [];
    for (const l of LANGUAGES) {
      if (enabled[l.id] && drafts[l.id].trim() && state.config.channels[l.id] === null) {
        missing.push(l.id);
      }
    }
    return missing;
  }, [drafts, enabled, state.config.channels]);

  const readyCount = useMemo(
    () => LANGUAGES.filter((l) => enabled[l.id] && drafts[l.id].trim()).length,
    [drafts, enabled],
  );

  function setDraft(lang: SupportedLang, value: string) {
    setDrafts((d) => ({ ...d, [lang]: value }));
  }

  async function autoTranslate() {
    const source = drafts[activeTab].trim();
    if (!source) {
      onResult({ kind: 'error', text: `Write the ${activeTab.toUpperCase()} version first` });
      return;
    }
    const targets = LANGUAGES.map((l) => l.id).filter(
      (id) => id !== activeTab && enabled[id] && !drafts[id].trim(),
    );
    if (targets.length === 0) {
      onResult({ kind: 'info', text: 'Nothing to translate — other tabs already filled or disabled' });
      return;
    }
    setTranslating(true);
    try {
      const r = await api.translate(activeTab, source, targets);
      const next = { ...drafts };
      let filled = 0;
      for (const lang of targets) {
        const t = r.translations[lang];
        if (t) {
          next[lang] = t;
          filled++;
        }
      }
      setDrafts(next);
      onResult({
        kind: filled === targets.length ? 'success' : 'info',
        text: `Translated ${filled} of ${targets.length} target(s)`,
      });
    } catch (e) {
      onResult({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setTranslating(false);
    }
  }

  async function publish() {
    const posts = LANGUAGES
      .filter((l) => enabled[l.id] && drafts[l.id].trim())
      .map((l) => ({ lang: l.id, body: drafts[l.id] }));
    if (posts.length === 0) {
      onResult({ kind: 'error', text: 'Nothing to publish — all enabled tabs are empty' });
      return;
    }
    const sp = sponsor.trim();
    const what = sp ? `sponsored post for "${sp}"` : 'organic post';
    if (!confirm(`Publish ${what} to ${posts.length} channel(s)?`)) return;
    setPublishing(true);
    try {
      const r = await api.post(posts, sp || undefined);
      const okCount = r.results.filter((x) => x.ok).length;
      const errs = r.results.filter((x) => !x.ok);
      if (errs.length === 0) {
        onResult({ kind: 'success', text: `Published to ${okCount} channel(s)` });
        setDrafts(EMPTY_DRAFTS);
        setSponsor('');
      } else {
        const lines = errs.map((e) => `${e.lang.toUpperCase()}: ${e.error}`).join('; ');
        onResult({ kind: 'error', text: `Sent ${okCount}, failed ${errs.length} (${lines})` });
      }
    } catch (e) {
      onResult({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="card-title">Sponsor (optional)</div>
        <input
          className="input"
          placeholder="Leave empty for organic. Type a name for sponsored post."
          value={sponsor}
          onChange={(e) => setSponsor(e.target.value)}
        />
        {sponsor && (
          <div className="html-hint" style={{ marginTop: 6 }}>
            A <code>📢 Sponsored · {sponsor}</code> header will be added automatically.
            AI cheerleader stays silent in those threads.
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Post text per language</div>

        <div className="lang-tabs">
          {LANGUAGES.map((lang) => {
            const filled = drafts[lang.id].trim().length > 0;
            const off = !enabled[lang.id];
            return (
              <button
                key={lang.id}
                type="button"
                className={`lang-tab ${activeTab === lang.id ? 'active' : ''} ${
                  off ? 'disabled' : ''
                } ${filled ? 'filled' : ''}`}
                onClick={() => setActiveTab(lang.id)}
              >
                <span className="lang-tab-flag">{lang.flag}</span>
                <span className="lang-tab-id">{lang.id.toUpperCase()}</span>
                {filled && <span className="lang-tab-dot" />}
              </button>
            );
          })}
        </div>

        <div className="lang-toggle-row">
          <label className="lang-toggle">
            <input
              type="checkbox"
              checked={enabled[activeTab]}
              onChange={(e) =>
                setEnabled((s) => ({ ...s, [activeTab]: e.target.checked }))
              }
            />
            Publish this language
          </label>
          {state.config.channels[activeTab] === null && enabled[activeTab] && (
            <span className="lang-warn">⚠ no channel set</span>
          )}
        </div>

        <textarea
          className="textarea"
          value={drafts[activeTab]}
          onChange={(e) => setDraft(activeTab, e.target.value)}
          placeholder={`Write in ${LANGUAGES.find((l) => l.id === activeTab)?.native}. Telegram HTML supported.`}
          disabled={!enabled[activeTab]}
        />

        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <button
            className="btn btn-secondary"
            disabled={translating || !drafts[activeTab].trim()}
            onClick={autoTranslate}
          >
            {translating
              ? '…'
              : `🪄 Translate from ${activeTab.toUpperCase()}`}
          </button>
        </div>

        <div className="html-hint" style={{ marginTop: 6 }}>
          HTML: <code>&lt;b&gt;</code> <code>&lt;i&gt;</code>{' '}
          <code>&lt;a href=…&gt;</code> <code>&lt;code&gt;</code>
        </div>
      </div>

      {channelMissing.length > 0 && (
        <div className="error-card" style={{ fontSize: 13 }}>
          <b>Missing channel for:</b> {channelMissing.map((l) => l.toUpperCase()).join(', ')}
          . Set them in Config or uncheck the language above.
        </div>
      )}

      <button
        className="btn btn-block"
        style={{
          marginTop: 12,
          background: sponsor.trim() ? 'var(--yellow)' : 'var(--accent)',
        }}
        disabled={publishing || readyCount === 0}
        onClick={publish}
      >
        {publishing
          ? 'Publishing…'
          : sponsor.trim()
          ? `📢 Publish sponsored to ${readyCount} channel${readyCount > 1 ? 's' : ''}`
          : `📤 Publish to ${readyCount} channel${readyCount > 1 ? 's' : ''}`}
      </button>
    </>
  );
}
