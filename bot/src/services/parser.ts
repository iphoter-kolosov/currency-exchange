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

export type ParsedHistorical = {
  kind: 'historical';
  from: Currency;
  to: Currency;
  date: string;
};

export type ParsedWatch = {
  kind: 'watch';
  base: Currency;
  date?: string;
};

export type ParseResult =
  | ParsedConvert
  | ParsedRate
  | ParsedHistorical
  | ParsedWatch
  | { kind: 'unknown'; missing?: string };

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

const ARROW_CONNECTORS = /(→|->|=)/g;

const TOKEN_CLEAN_RE = new RegExp(`[^a-zA-Zа-яА-ЯёЁ${SYMBOL_CHARSET}]`, 'g');

/** Words people say around their actual currency query. The parser
 * silently drops them so a phrase like "покажи курс форинта за вчера"
 * resolves to "форинта вчера". Strict garbage detection still catches
 * unrelated input — only words on this list are skipped.
 *
 * Includes prepositions/connectors (в/на/за/to/in/at). Listing them
 * here instead of using a regex sidesteps the JS \b problem with
 * cyrillic letters. */
const NOISE_WORDS = new Set([
  // RU connectors
  'в', 'во', 'на', 'за', 'по', 'от', 'с', 'со', 'к', 'ко', 'и', 'а', 'или',
  'против', 'между', 'через',
  // RU verbs/articles
  'курс', 'курса', 'курсе', 'курсу', 'курсом', 'курсы', 'курсов',
  'цена', 'цены', 'стоимость', 'стоит',
  'покажи', 'покажите', 'дай', 'дайте', 'скажи', 'выведи', 'отобрази',
  'хочу', 'хочется', 'нужен', 'нужна', 'нужно', 'надо',
  'сколько', 'почем', 'почём', 'каков', 'какова',
  'мне', 'нам', 'пожалуйста', 'плиз',
  'конвертируй', 'переведи', 'обменяй', 'обмен',
  'какой', 'какая', 'какие', 'какого', 'какому',
  'есть', 'был', 'была', 'было', 'были', 'будет',
  // EN connectors
  'to', 'in', 'at', 'on', 'into', 'from', 'of', 'for', 'vs', 'versus',
  'between', 'against', 'and', 'or',
  // EN verbs/articles
  'rate', 'rates', 'price', 'prices', 'cost',
  'show', 'tell', 'give', 'display', 'see', 'view',
  'me', 'us', 'please', 'pls', 'plz',
  'convert', 'exchange',
  'how', 'much', 'many', 'whats', "what's", 'what',
  'is', 'was', 'were', 'are', 'be',
  'the', 'a', 'an',
]);

/** Date keywords resolve relative to "today". The actual offset gets
 * applied in dateKeywordOffset(). Handler caller turns the offset into
 * an ISO date string using the user's timezone. */
const DATE_KEYWORDS: Record<string, number> = {
  // RU
  'вчера': -1, 'вчерашний': -1, 'вчерашняя': -1, 'вчерашнее': -1, 'вчерашние': -1,
  'позавчера': -2,
  'сегодня': 0, 'сегодняшний': 0, 'сегодняшняя': 0, 'сегодняшнее': 0,
  // EN
  'yesterday': -1, 'yday': -1,
  'today': 0,
};

function resolveToken(tok: string): Currency | null {
  const clean = tok.replace(TOKEN_CLEAN_RE, '').toLowerCase();
  if (!clean) return null;
  if (SYMBOL_TO_CODE[clean]) return findCurrency(SYMBOL_TO_CODE[clean]);
  return findCurrency(clean);
}

function todayInTz(tz: string): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.format(new Date()).split('-').map((n) => parseInt(n, 10));
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

function shiftDays(base: Date, days: number): string {
  const d = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_DATE_RE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/;

function tryParseExplicitDate(tok: string): string | null {
  const iso = tok.match(ISO_DATE_RE);
  if (iso) {
    const y = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10);
    const d = parseInt(iso[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }
  const dmy = tok.match(DMY_DATE_RE);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    let m = parseInt(dmy[2], 10);
    let y = parseInt(dmy[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    if (y < 100) y += 2000;
    return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }
  return null;
}

export type ParseOptions = { tz?: string; defaultBase?: Currency | null };

export function parseInput(raw: string, opts: ParseOptions = {}): ParseResult {
  if (!raw) return { kind: 'unknown' };
  const tz = opts.tz ?? 'UTC';
  let text = raw.trim().toLowerCase();
  text = text.replace(ARROW_CONNECTORS, ' ');

  const symRe = new RegExp(`(${SYMBOL_RE})`, 'g');
  text = text.replace(symRe, ' $1 ').replace(/\s+/g, ' ').trim();

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { kind: 'unknown' };

  let amount: number | null = null;
  let date: string | null = null;
  const tokens: string[] = [];

  for (const p of parts) {
    if (NOISE_WORDS.has(p)) continue;
    if (date === null && DATE_KEYWORDS[p] !== undefined) {
      date = shiftDays(todayInTz(tz), DATE_KEYWORDS[p]);
      continue;
    }
    if (date === null) {
      const explicit = tryParseExplicitDate(p);
      if (explicit) {
        date = explicit;
        continue;
      }
    }
    const num = p.replace(',', '.');
    if (/^-?\d+(\.\d+)?$/.test(num) && amount === null) {
      amount = Number(num);
      continue;
    }
    tokens.push(p);
  }

  // Strict mode: every leftover token must resolve to a currency. Garbage
  // ("ежедневная", "утром") still fails fast so it falls through to LLM.
  const resolved = tokens.map((tok) => resolveToken(tok));
  if (resolved.some((c) => c === null)) return { kind: 'unknown' };

  const currencies: Currency[] = [];
  for (const c of resolved) {
    if (c && !currencies.find((x) => x.code === c.code)) {
      currencies.push(c);
      if (currencies.length === 2) break;
    }
  }

  if (currencies.length === 2 && amount !== null && date === null) {
    return { kind: 'convert', amount, from: currencies[0], to: currencies[1] };
  }
  if (currencies.length === 2 && date !== null) {
    return { kind: 'historical', from: currencies[0], to: currencies[1], date };
  }
  if (currencies.length === 2) {
    return { kind: 'rate', from: currencies[0], to: currencies[1] };
  }
  if (currencies.length === 1 && date !== null) {
    // "курс huf за вчера" — pair the lone currency with the user's
    // default base (or USD if unset) so we can answer with one rate.
    const counterpart = opts.defaultBase && opts.defaultBase.code !== currencies[0].code
      ? opts.defaultBase
      : findCurrency(currencies[0].code === 'usd' ? 'eur' : 'usd');
    if (counterpart) {
      return { kind: 'historical', from: currencies[0], to: counterpart, date };
    }
  }
  if (currencies.length === 1) {
    return { kind: 'watch', base: currencies[0] };
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
