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

export function rangeForTimeframe(tf: Timeframe, now = new Date()): { from: Date; to: Date; step: number } {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  switch (tf) {
    case '1D': return { from: addDays(today, -2), to: today, step: 1 };
    case '1W': return { from: addDays(today, -7), to: today, step: 1 };
    case '1M': return { from: addDays(today, -30), to: today, step: 1 };
    case '3M': return { from: addDays(today, -90), to: today, step: 2 };
    case '6M': return { from: addDays(today, -180), to: today, step: 3 };
    case '1Y': return { from: addDays(today, -365), to: today, step: 5 };
    case '2Y': return { from: addDays(today, -730), to: today, step: 10 };
  }
}

export function enumerateDates(tf: Timeframe, now = new Date()): string[] {
  const { from, to, step } = rangeForTimeframe(tf, now);
  const dates: string[] = [];
  for (let d = new Date(from); d <= to; d = addDays(d, step)) {
    dates.push(toISODate(d));
  }
  const last = toISODate(to);
  if (dates.length === 0 || dates[dates.length - 1] !== last) dates.push(last);
  return dates;
}
