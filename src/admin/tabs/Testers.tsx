import { useState } from 'react';
import { api } from '../api';
import type { State } from '../types';

type Toast = { kind: 'success' | 'error' | 'info'; text: string };
type Props = { state: State; onResult: (t: Toast) => void; onChange: () => void };

export function Testers({ state, onResult, onChange }: Props) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    const id = Number(input);
    if (!Number.isFinite(id) || id <= 0) {
      onResult({ kind: 'error', text: 'Not a valid user ID' });
      return;
    }
    setBusy(true);
    try {
      await api.addTester(id);
      setInput('');
      onResult({ kind: 'success', text: `Added ${id}` });
      await onChange();
    } catch (e) {
      onResult({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(`Remove tester ${id}?`)) return;
    setBusy(true);
    try {
      await api.removeTester(id);
      onResult({ kind: 'success', text: `Removed ${id}` });
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
        <div className="card-title">Add tester</div>
        <label className="label">User ID</label>
        <div className="row">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="437010992"
            inputMode="numeric"
          />
          <button className="btn" disabled={busy || !input} onClick={add}>
            Add
          </button>
        </div>
        <div className="html-hint" style={{ marginTop: 6 }}>
          Find a user ID by asking <b>@userinfobot</b> on Telegram.
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Beta testers ({state.config.testers.length})
        </div>
        {state.config.testers.length === 0 ? (
          <div className="empty">
            No beta testers yet. Admin always counts as one — you can rehearse alone.
          </div>
        ) : (
          <div className="list">
            {state.config.testers.map((id) => (
              <div className="list-item" key={id}>
                <code>{id}</code>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                  disabled={busy}
                  onClick={() => remove(id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
