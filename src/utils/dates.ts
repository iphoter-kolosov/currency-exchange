export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y';

export const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y'];

export function toISODate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

type Range = { from: Date; to: Date; step: number; maxPoints: number };

export function rangeForTimeframe(tf: Timeframe, now: Date = new Date()): Range {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  switch (tf) {
    case '1D':
      return { from: addDays(today, -1), to: today, step: 1, maxPoints: 2 };
    case '1W':
      return { from: addDays(today, -7), to: today, step: 1, maxPoints: 8 };
    case '1M':
      return { from: addDays(today, -30), to: today, step: 1, maxPoints: 31 };
    case '3M':
      return { from: addDays(today, -90), to: today, step: 2, maxPoints: 46 };
    case '6M':
      return { from: addDays(today, -180), to: today, step: 3, maxPoints: 61 };
    case '1Y':
      return { from: addDays(today, -365), to: today, step: 5, maxPoints: 74 };
    case '2Y':
      return { from: addDays(today, -730), to: today, step: 10, maxPoints: 74 };
  }
}

export function enumerateDates(range: Range): Date[] {
  const dates: Date[] = [];
  for (let d = new Date(range.from); d <= range.to; d = addDays(d, range.step)) {
    dates.push(d);
  }
  const last = range.to;
  if (dates.length === 0 || toISODate(dates[dates.length - 1]) !== toISODate(last)) {
    dates.push(last);
  }
  return dates;
}
