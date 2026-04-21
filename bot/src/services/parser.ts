import { CURRENCIES, findCurrency, type Currency } from '../data/currencies.ts';

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

const SYMBOL_TO_CODE: Record<string, string> = {};
for (const c of CURRENCIES) {
  const s = c.symbol.toLowerCase();
  if (!SYMBOL_TO_CODE[s]) SYMBOL_TO_CODE[s] = c.code;
}
SYMBOL_TO_CODE['$'] = 'usd';
SYMBOL_TO_CODE['€'] = 'eur';
SYMBOL_TO_CODE['£'] = 'gbp';
SYMBOL_TO_CODE['¥'] = 'jpy';
SYMBOL_TO_CODE['₽'] = 'rub';
SYMBOL_TO_CODE['₴'] = 'uah';
SYMBOL_TO_CODE['₺'] = 'try';
SYMBOL_TO_CODE['₹'] = 'inr';
SYMBOL_TO_CODE['₩'] = 'krw';
SYMBOL_TO_CODE['₪'] = 'ils';

const SYMBOL_RE = Object.keys(SYMBOL_TO_CODE)
  .sort((a, b) => b.length - a.length)
  .map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
  .join('|');

const CONNECTORS = /\b(to|in|в|на|→|->|=)\b/gi;

function resolveToken(tok: string): Currency | null {
  const clean = tok.replace(/[^a-zA-Zа-яА-ЯёЁ₽$€£¥₴₺₹₩₪₸₼₦]/g, '').toLowerCase();
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
  if (currencies.length === 1 && amount !== null) {
    return { kind: 'unknown', missing: 'to' };
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
