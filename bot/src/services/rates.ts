import { CURRENCY_BY_CODE } from '../data/currencies.ts';

export type RateMap = Record<string, number>;
export type Payload = { date: string; rates: RateMap };

const memoryCache = new Map<string, { at: number; payload: Payload }>();
const LATEST_TTL_MS = 15 * 60 * 1000;

function buildUrls(base: string, datePath: 'latest' | string): string[] {
  const version = datePath;
  const pagesHost = datePath === 'latest' ? 'latest.currency-api.pages.dev' : `${datePath}.currency-api.pages.dev`;
  return [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${version}/v1/currencies/${base}.json`,
    `https://${pagesHost}/v1/currencies/${base}.json`,
  ];
}

async function fetchWithFallback(urls: string[], retries = 1): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          lastErr = new Error(`HTTP ${res.status} for ${url}`);
          continue;
        }
        return await res.json();
      } catch (e) {
        lastErr = e;
      }
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

function parse(base: string, raw: unknown): Payload {
  const data = raw as Record<string, unknown>;
  const date = String(data.date ?? new Date().toISOString().slice(0, 10));
  const rates = data[base] as RateMap | undefined;
  if (!rates) throw new Error(`No rates for base ${base}`);
  return { date, rates };
}

export async function getLatestRates(base = 'usd'): Promise<Payload> {
  if (!CURRENCY_BY_CODE[base]) {
    throw new Error(`Unknown currency: ${base}`);
  }
  const key = `latest:${base}`;
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.at < LATEST_TTL_MS) {
    return cached.payload;
  }
  const raw = await fetchWithFallback(buildUrls(base, 'latest'));
  const payload = parse(base, raw);
  memoryCache.set(key, { at: Date.now(), payload });
  return payload;
}

export async function getRateForDate(base: string, date: string): Promise<Payload> {
  if (!CURRENCY_BY_CODE[base]) {
    throw new Error(`Unknown currency: ${base}`);
  }
  const key = `${date}:${base}`;
  const cached = memoryCache.get(key);
  if (cached) return cached.payload;
  const raw = await fetchWithFallback(buildUrls(base, date));
  const payload = parse(base, raw);
  memoryCache.set(key, { at: Date.now(), payload });
  return payload;
}

export async function convert(
  amount: number,
  from: string,
  to: string,
): Promise<{ value: number; rate: number; date: string }> {
  const payload = await getLatestRates(from);
  const rate = to === from ? 1 : payload.rates[to];
  if (typeof rate !== 'number') {
    throw new Error(`No rate for ${from} → ${to}`);
  }
  return { value: amount * rate, rate, date: payload.date };
}
