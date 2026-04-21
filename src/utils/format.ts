import type { Currency } from '../data/currencies';
import { getLocale, type Language } from '../i18n';

export function formatAmount(
  amount: number,
  currency: Currency,
  lang: Language,
  opts?: { maxFractionDigits?: number },
): string {
  const locale = getLocale(lang);
  const decimals = currency.decimals ?? 2;
  const max = opts?.maxFractionDigits ?? decimals;
  if (!isFinite(amount)) return '—';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  }).format(amount);
}

export function formatWithSymbol(
  amount: number,
  currency: Currency,
  lang: Language,
): string {
  const left = ['$', '£', '€', '¥', '₹', '₴', '₽', '₺', '₦', '₸', '₩', '₱', '₪', '֏', '₼', '₾', 'R', 'E£', 'R$', 'C$', 'A$', 'NZ$', 'S$', 'HK$', 'MX$'];
  const sym = currency.symbol;
  const num = formatAmount(amount, currency, lang);
  if (left.includes(sym)) return `${sym}${num}`;
  return `${sym} ${num}`;
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[\s ]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatPercent(delta: number, lang: Language): string {
  const locale = getLocale(lang);
  const sign = delta > 0 ? '↑' : delta < 0 ? '↓' : '';
  const abs = Math.abs(delta);
  const num = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign} ${num}%`;
}

export function formatDateShort(date: Date, lang: Language): string {
  const locale = getLocale(lang);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
