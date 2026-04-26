import { useState } from 'react';
import { api } from '../api';
import type { State } from '../types';

type Toast = { kind: 'success' | 'error' | 'info'; text: string };
type Props = { state: State; onResult: (t: Toast) => void };

export function Posts({ state, onResult }: Props) {
  const [body, setBody] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [sponsoredBody, setSponsoredBody] = useState('');
  const [sending, setSending] = useState(false);

  const noChannel = state.config.channelId === null;

  async function postOrganic() {
    if (!body.trim()) return;
    if (!confirm('Publish this post to the channel?')) return;
    setSending(true);
    try {
      const r = await api.post(body);
      onResult({ kind: 'success', text: `Posted (msg ${r.messageId})` });
      setBody('');
    } catch (e) {
      onResult({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  }

  async function postSponsored() {
    if (!sponsor.trim() || !sponsoredBody.trim()) return;
    if (!confirm(`Publish sponsored post for "${sponsor}"?`)) return;
    setSending(true);
    try {
      const r = await api.postSponsored(sponsor, sponsoredBody);
      onResult({ kind: 'success', text: `Sponsored post sent (msg ${r.messageId})` });
      setSponsor('');
      setSponsoredBody('');
    } catch (e) {
      onResult({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {noChannel && (
        <div className="error-card">
          No news channel configured. Set one in <b>Config</b> first.
        </div>
      )}

      <div className="card">
        <div className="card-title">Organic post</div>
        <textarea
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's the news? Telegram HTML supported."
        />
        <div className="html-hint">
          HTML: <code>&lt;b&gt;</code> <code>&lt;i&gt;</code>{' '}
          <code>&lt;a href="…"&gt;</code> <code>&lt;code&gt;</code>{' '}
          <code>&lt;blockquote&gt;</code>
        </div>
        <button
          className="btn btn-block"
          style={{ marginTop: 12 }}
          disabled={sending || noChannel || !body.trim()}
          onClick={postOrganic}
        >
          📤 Publish
        </button>
      </div>

      <div className="card">
        <div className="card-title">Sponsored post</div>
        <label className="label">Sponsor name</label>
        <input
          className="input"
          value={sponsor}
          onChange={(e) => setSponsor(e.target.value)}
          placeholder="e.g. Wise, Revolut, Binance"
        />
        <label className="label">Body</label>
        <textarea
          className="textarea"
          value={sponsoredBody}
          onChange={(e) => setSponsoredBody(e.target.value)}
          placeholder="Sponsor-supplied copy. Disclosure header is added automatically."
        />
        <div className="html-hint">
          A <code>📢 Партнёрский материал · {sponsor || 'Sponsor'}</code> header
          is prepended automatically. AI cheerleader stays silent in this thread.
        </div>
        <button
          className="btn btn-block"
          style={{ marginTop: 12, background: 'var(--yellow)' }}
          disabled={sending || noChannel || !sponsor.trim() || !sponsoredBody.trim()}
          onClick={postSponsored}
        >
          📢 Publish sponsored
        </button>
      </div>
    </>
  );
}
