import { findCurrency, type Currency } from '../data/currencies.ts';

export type ParsedConvert = {
  kind: 'convert';
  amount: number;
  from: Currency;
  to: Currency;
};

export type ParsedRate = {
  kind: 'rate';
  from: Currency;
  to: Currency;
};

export type ParseResult = ParsedConvert | ParsedRate | { kind: 'unknown'; missing?: string };

const SYMBOL_TO_CODE: Record<string, string> = {
  '$': 'usd',
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
  'Ξ': 'eth',
  'ξ': 'eth',
};

const SYMBOLS = Object.keys(SYMBOL_TO_CODE);
const SYMBOL_CHARSET = SYMBOLS.join('');
const SYMBOL_RE = SYMBOLS
  .map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
  .join('|');

const CONNECTORS = /\b(to|in|в|на|→|->|=)\b/gi;

const TOKEN_CLEAN_RE = new RegExp(`[^a-zA-Zа-яА-ЯёЁ${SYMBOL_CHARSET}]`, 'g');

function resolveToken(tok: string): Currency | null {
  const clean = tok.replace(TOKEN_CLEAN_RE, '').toLowerCase();
  if (!clean) return null;
  if (SYMBOL_TO_CODE[clean]) return findCurrency(SYMBOL_TO_CODE[clean]);
  return findCurrency(clean);
}

export function parseInput(raw: string): ParseResult {
  if (!raw) return { kind: 'unknown' };
  let text = raw.trim().toLowerCase();
  text = text.replace(CONNECTORS, ' ');

  const symRe = new RegExp(`(${SYMBOL_RE})`, 'g');
  text = text.replace(symRe, ' $1 ').replace(/\s+/g, ' ').trim();

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { kind: 'unknown' };

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

  // Strict mode: every token must resolve to a currency. Garbage words like
  // "ежедневная", "утром", "сводка" would otherwise be silently dropped and
  // a stray "eur huf" at the end of a long instruction would parse as a rate
  // request, hijacking messages meant for the LLM.
  const resolved = tokens.map((tok) => resolveToken(tok));
  if (resolved.some((c) => c === null)) return { kind: 'unknown' };

  const currencies: Currency[] = [];
  for (const c of resolved) {
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
  return { kind: 'unknown' };
}

export function parseChartCommand(args: string): { base: Currency; target: Currency; tf: string } | null {
  const parts = args.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const base = findCurrency(parts[0]);
  const target = findCurrency(parts[1]);
  const tfRaw = (parts[2] ?? '1m').toUpperCase();
  const valid = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y'];
  const tf = valid.includes(tfRaw) ? tfRaw : '1M';
  if (!base || !target) return null;
  return { base, target, tf };
}
