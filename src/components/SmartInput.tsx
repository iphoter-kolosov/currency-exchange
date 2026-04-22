import { useState } from 'react';
import { useT } from '../i18n';
import { parseInput } from '../services/parser';
import { resolveIntent, type Intent } from '../services/ai';

type Props = {
  onIntent: (intent: Intent) => void;
  onChat: (message: string) => void;
};

export function SmartInput({ onIntent, onChat }: Props) {
  const { t, lang } = useT();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = value.trim();
    if (!text || busy) return;

    const local = parseInput(text);
    if (local.kind === 'convert') {
      onIntent({
        action: 'convert',
        amount: local.amount,
        from: local.from.iso,
        to: local.to.iso,
      });
      setValue('');
      return;
    }
    if (local.kind === 'rate') {
      onIntent({ action: 'rate', from: local.from.iso, to: local.to.iso });
      setValue('');
      return;
    }
    if (local.kind === 'single') {
      onIntent({ action: 'watch', base: local.currency.iso });
      setValue('');
      return;
    }

    setBusy(true);
    try {
      const intent = await resolveIntent(text, lang);
      if (intent) {
        if (intent.action === 'chat') onChat(intent.reply);
        else onIntent(intent);
        setValue('');
      } else {
        onChat(t.smart.unknown);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`smart-input ${busy ? 'is-busy' : ''}`}>
      <input
        type="text"
        value={value}
        placeholder={t.smart.placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit();
        }}
        disabled={busy}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <button
        className="smart-send"
        onClick={() => void submit()}
        disabled={busy || !value.trim()}
        aria-label={t.smart.send}
      >
        {busy ? (
          <span className="smart-spinner" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h16M14 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </div>
  );
}
