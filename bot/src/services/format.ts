import type { Currency } from '../data/currencies.ts';
import type { Lang } from './storage.ts';

const LOCALE: Record<Lang, string> = { en: 'en-US', ru: 'ru-RU' };

export function formatAmount(amount: number, currency: Currency, lang: Lang): string {
  const decimals = currency.decimals ?? 2;
  if (!isFinite(amount)) return '—';
  const abs = Math.abs(amount);
  const effectiveDecimals = abs >= 1000 ? Math.min(decimals, 2) : abs >= 1 ? decimals : Math.max(decimals, 4);
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: 0,
    maximumFractionDigits: effectiveDecimals,
  }).format(amount);
}

export function formatMoney(amount: number, currency: Currency, lang: Lang): string {
  return `${formatAmount(amount, currency, lang)} ${currency.symbol}`.trim();
}

export function formatRate(rate: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: rate < 1 ? 6 : 4,
  }).format(rate);
}

export function formatPercent(delta: number, lang: Lang): string {
  const sign = delta > 0 ? '📈 +' : delta < 0 ? '📉 ' : '';
  return `${sign}${new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(delta)}%`;
}
