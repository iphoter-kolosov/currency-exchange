import { useMemo, useState } from 'react';
import { CURRENCIES, type Currency } from '../data/currencies';
import { Flag } from './Flag';
import { getCurrencyName, useT } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (code: string) => void;
  excludeCodes?: string[];
};

export function CurrencyPicker({ open, onClose, onPick, excludeCodes = [] }: Props) {
  const { t, lang } = useT();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const set = new Set(excludeCodes);
    const list: Currency[] = CURRENCIES.filter((c) => !set.has(c.code));
    if (!q) return list;
    return list.filter((c) => {
      return (
        c.iso.toLowerCase().includes(q) ||
        c.name_en.toLowerCase().includes(q) ||
        c.name_ru.toLowerCase().includes(q)
      );
    });
  }, [query, excludeCodes]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t.addCurrency}
      >
        <div className="sheet-header">
          <button className="text-btn" onClick={onClose}>{t.close}</button>
          <div className="sheet-title">{t.addCurrency}</div>
          <div style={{ width: 64 }} />
        </div>

        <div className="search-wrap">
          <input
            className="search-input"
            type="search"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="picker-list">
          {filtered.map((c) => (
            <button
              key={c.code}
              className="picker-row"
              onClick={() => {
                onPick(c.code);
                onClose();
              }}
            >
              <Flag code={c.flagCode} size={36} />
              <div className="picker-meta">
                <div className="picker-name">{getCurrencyName(c, lang)}</div>
                <div className="picker-code">{c.iso}</div>
              </div>
              <span className="picker-sym">{c.symbol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
