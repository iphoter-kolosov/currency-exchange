import { CURRENCIES, CURRENCY_BY_CODE, type Currency } from '../data/currencies';

export type ParseResult =
  | { kind: 'convert'; amount: number; from: Currency; to: Currency }
  | { kind: 'rate'; from: Currency; to: Currency }
  | { kind: 'single'; currency: Currency }
  | { kind: 'unknown' };

const SYMBOL_TO_CODE: Record<string, string> = {
  $: 'usd',
  '€': 'eur',
  '£': 'gbp',
  '¥': 'jpy',
  '₽': 'rub',
  '₴': 'uah',
  '₺': 'try',
  '₹': 'inr',
  '₩': 'krw',
  '₪': 'ils',
  '₸': 'kzt',
  '₼': 'azn',
  '₾': 'gel',
  '֏': 'amd',
  '฿': 'thb',
  '₫': 'vnd',
  '₱': 'php',
  '₦': 'ngn',
  '₿': 'btc',
  Ξ: 'eth',
  ξ: 'eth',
};

const SYMBOL_CHARSET = Object.keys(SYMBOL_TO_CODE).join('');
const SYMBOL_RE = Object.keys(SYMBOL_TO_CODE)
  .map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
  .join('|');
const CONNECTORS = /\b(to|in|в|на|→|->|=)\b/gi;
const TOKEN_CLEAN_RE = new RegExp(`[^a-zA-Zа-яА-ЯёЁ${SYMBOL_CHARSET}]`, 'g');

export function findCurrency(query: string): Currency | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    CURRENCY_BY_CODE[q] ||
    CURRENCIES.find((c) => c.iso.toLowerCase() === q) ||
    CURRENCIES.find((c) => c.name_en.toLowerCase() === q) ||
    CURRENCIES.find((c) => c.name_ru.toLowerCase() === q) ||
    null
  );
}

function resolveToken(tok: string): Currency | null {
  const clean = tok.replace(TOKEN_CLEAN_RE, '').toLowerCase();
  if (!clean) return null;
  if (SYMBOL_TO_CODE[clean]) return CURRENCY_BY_CODE[SYMBOL_TO_CODE[clean]];
  return findCurrency(clean);
}

export function parseInput(raw: string): ParseResult {
  if (!raw) return { kind: 'unknown' };
  let text = raw.trim().toLowerCase();
  text = text.replace(CONNECTORS, ' ');

  const symRe = new RegExp(`(${SYMBOL_RE})`, 'g');
  text = text.replace(symRe, ' $1 ').replace(/\s+/g, ' ').trim();

  const parts = text.split(/\s+/).filter(Boolean);

  let amount: number | null = null;
  const tokens: string[] = [];

  for (const p of parts) {
    const num = p.replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(num) && amount === null) {
      amount = Number(num);
    } else {
      tokens.push(p);
    }
  }

  const currencies: Currency[] = [];
  for (const tok of tokens) {
    const c = resolveToken(tok);
    if (c && !currencies.find((x) => x.code === c.code)) {
      currencies.push(c);
      if (currencies.length === 2) break;
    }
  }

  if (currencies.length === 2 && amount !== null) {
    return { kind: 'convert', amount, from: currencies[0], to: currencies[1] };
  }
  if (currencies.length === 2) {
    return { kind: 'rate', from: currencies[0], to: currencies[1] };
  }
  if (currencies.length === 1 && amount === null) {
    return { kind: 'single', currency: currencies[0] };
  }
  return { kind: 'unknown' };
}
