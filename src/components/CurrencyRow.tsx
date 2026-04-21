import { useEffect, useRef } from 'react';
import type { Currency } from '../data/currencies';
import { Flag } from './Flag';
import { formatWithSymbol, parseAmount } from '../utils/format';
import { getCurrencyName, useT } from '../i18n';

type Props = {
  currency: Currency;
  amount: number;
  isActive: boolean;
  editing: boolean;
  onActivate: () => void;
  onChangeAmount: (next: number) => void;
  onRemove?: () => void;
};

export function CurrencyRow({
  currency,
  amount,
  isActive,
  editing,
  onActivate,
  onChangeAmount,
  onRemove,
}: Props) {
  const { lang } = useT();
  const name = getCurrencyName(currency, lang);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current && !editing) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive, editing]);

  const formatted = formatWithSymbol(amount, currency, lang);

  return (
    <div
      className={`row ${isActive ? 'is-active' : ''} ${editing ? 'is-editing' : ''}`}
      onClick={() => {
        if (!editing) onActivate();
      }}
      role="button"
      tabIndex={0}
    >
      {editing && onRemove ? (
        <button
          className="remove-btn"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <span />
        </button>
      ) : null}

      <Flag code={currency.flagCode} size={42} />

      <div className="row-meta">
        <div className="row-name">{name}</div>
        <div className="row-code">{currency.iso}</div>
      </div>

      <div className={`pill ${isActive ? 'pill-active' : ''}`}>
        {isActive && !editing ? (
          <>
            <span className="pill-sym">{currency.symbol}</span>
            <input
              ref={inputRef}
              className="pill-input"
              type="text"
              inputMode="decimal"
              value={formatAmountForInput(amount, currency.decimals ?? 2)}
              onChange={(e) => onChangeAmount(parseAmount(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              aria-label={`${name} amount`}
            />
          </>
        ) : (
          <span className="pill-value">{formatted}</span>
        )}
      </div>
    </div>
  );
}

function formatAmountForInput(amount: number, decimals: number): string {
  if (!isFinite(amount)) return '0';
  if (amount === 0) return '';
  const fixed = decimals === 0 ? Math.round(amount).toString() : amount.toString();
  return fixed;
}
