import { useState } from 'react';
import { api } from '../api';
import type { State } from '../types';

type Toast = { kind: 'success' | 'error' | 'info'; text: string };
type Props = { state: State; onResult: (t: Toast) => void; onChange: () => void };

export function Config({ state, onResult, onChange }: Props) {
  const [channelInput, setChannelInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
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
        <div className="card-title">News channel</div>
        <div className="kv-grid" style={{ marginBottom: 12 }}>
          <span className="k">Current</span>
          <span className="v">{state.config.channelId ?? '—'}</span>
        </div>
        <label className="label">Set new channel ID</label>
        <div className="row">
          <input
            className="input"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder="-1001234567890"
          />
          <button
            className="btn"
            disabled={busy || !channelInput}
            onClick={() => {
              const id = Number(channelInput);
              if (!Number.isFinite(id)) {
                onResult({ kind: 'error', text: 'Not a valid number' });
                return;
              }
              run('Channel updated', async () => {
                await api.setChannel(id);
                setChannelInput('');
              });
            }}
          >
            Save
          </button>
        </div>
        <div className="html-hint" style={{ marginTop: 6 }}>
          Forward any message from the channel to <i>@userinfobot</i> to find its ID,
          or use Telegram's channel info screen.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Discussion group</div>
        <div className="kv-grid" style={{ marginBottom: 12 }}>
          <span className="k">Current</span>
          <span className="v">{state.config.groupId ?? '—'}</span>
        </div>
        <label className="label">Set new group ID</label>
        <div className="row">
          <input
            className="input"
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            placeholder="-1009876543210"
          />
          <button
            className="btn"
            disabled={busy || !groupInput}
            onClick={() => {
              const id = Number(groupInput);
              if (!Number.isFinite(id)) {
                onResult({ kind: 'error', text: 'Not a valid number' });
                return;
              }
              run('Group updated', async () => {
                await api.setGroup(id);
                setGroupInput('');
              });
            }}
          >
            Save
          </button>
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
              Beta-only: replies only to admin + testers. Public: everyone in the group.
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
