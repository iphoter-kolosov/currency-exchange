import { get as idbGet, set as idbSet } from 'idb-keyval';
import {
  enumerateDates,
  rangeForCustom,
  rangeForTimeframe,
  toISODate,
  type Timeframe,
} from '../utils/dates';

export type RateMap = Record<string, number>;

type Payload = {
  date: string;
  rates: RateMap;
};

const memoryCache = new Map<string, Payload>();

const LATEST_LS_KEY = (base: string) => `rates:latest:${base}`;
const LATEST_TTL_MS = 60 * 60 * 1000;

function buildUrls(base: string, datePath: 'latest' | string): string[] {
  const isLatest = datePath === 'latest';
  const pkgVersion = isLatest ? 'latest' : datePath;
  const pagesHost = isLatest ? 'latest.currency-api.pages.dev' : `${datePath}.currency-api.pages.dev`;
  return [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${pkgVersion}/v1/currencies/${base}.json`,
    `https://${pagesHost}/v1/currencies/${base}.json`,
  ];
}

async function fetchWithFallback(urls: string[], retries = 2): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url);
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
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

function parsePayload(base: string, raw: unknown): Payload {
  const data = raw as Record<string, unknown>;
  const date = String(data.date ?? toISODate(new Date()));
  const rates = data[base] as RateMap | undefined;
  if (!rates) throw new Error(`No rates for base ${base}`);
  return { date, rates };
}

export async function fetchLatest(base: string): Promise<Payload> {
  const memKey = `latest:${base}`;
  const cached = memoryCache.get(memKey);
  if (cached) return cached;

  try {
    const raw = await fetchWithFallback(buildUrls(base, 'latest'));
    const payload = parsePayload(base, raw);
    memoryCache.set(memKey, payload);
    try {
      localStorage.setItem(
        LATEST_LS_KEY(base),
        JSON.stringify({ at: Date.now(), payload }),
      );
    } catch {
      /* storage full */
    }
    return payload;
  } catch (e) {
    const raw = localStorage.getItem(LATEST_LS_KEY(base));
    if (raw) {
      const parsed = JSON.parse(raw) as { at: number; payload: Payload };
      return parsed.payload;
    }
    throw e;
  }
}

export function getLastLatestAge(base: string): number | null {
  try {
    const raw = localStorage.getItem(LATEST_LS_KEY(base));
    if (!raw) return null;
    const { at } = JSON.parse(raw) as { at: number };
    return Date.now() - at;
  } catch {
    return null;
  }
}

export function isLatestFresh(base: string): boolean {
  const age = getLastLatestAge(base);
  return age !== null && age < LATEST_TTL_MS;
}

async function fetchForDate(base: string, date: string): Promise<Payload | null> {
  const memKey = `${date}:${base}`;
  const mem = memoryCache.get(memKey);
  if (mem) return mem;

  const idbKey = `rates:${memKey}`;
  try {
    const stored = await idbGet<Payload>(idbKey);
    if (stored) {
      memoryCache.set(memKey, stored);
      return stored;
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = await fetchWithFallback(buildUrls(base, date), 1);
    const payload = parsePayload(base, raw);
    memoryCache.set(memKey, payload);
    void idbSet(idbKey, payload).catch(() => undefined);
    return payload;
  } catch {
    return null;
  }
}

export type SeriesPoint = { date: string; rate: number };

async function fetchSeriesForDates(
  base: string,
  target: string,
  dates: string[],
): Promise<SeriesPoint[]> {
  const today = toISODate(new Date());
  const results = await Promise.all(
    dates.map(async (date) => {
      const isToday = date >= today;
      const payload = isToday
        ? await fetchLatest(base).catch(() => null)
        : await fetchForDate(base, date);
      if (!payload) return null;
      const rate = payload.rates[target];
      if (typeof rate !== 'number') return null;
      return { date: payload.date, rate };
    }),
  );

  const series: SeriesPoint[] = [];
  const seen = new Set<string>();
  for (const p of results) {
    if (!p) continue;
    if (seen.has(p.date)) continue;
    seen.add(p.date);
    series.push(p);
  }
  series.sort((a, b) => a.date.localeCompare(b.date));
  return series;
}

export async function fetchSeries(
  base: string,
  target: string,
  tf: Timeframe,
): Promise<SeriesPoint[]> {
  const range = rangeForTimeframe(tf);
  const dates = enumerateDates(range).map(toISODate);
  return fetchSeriesForDates(base, target, dates);
}

export async function fetchSeriesRange(
  base: string,
  target: string,
  fromIso: string,
  toIso: string,
): Promise<SeriesPoint[]> {
  const range = rangeForCustom(fromIso, toIso);
  const dates = enumerateDates(range).map(toISODate);
  return fetchSeriesForDates(base, target, dates);
}
