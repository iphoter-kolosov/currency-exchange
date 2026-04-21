import { getRateForDate, getLatestRates } from './rates.ts';
import { enumerateDates, type Timeframe } from './dates.ts';

export type ChartPoint = { date: string; rate: number };

export async function fetchSeries(base: string, target: string, tf: Timeframe): Promise<ChartPoint[]> {
  const dates = enumerateDates(tf);
  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.all(
    dates.map(async (date) => {
      try {
        const payload = date >= today
          ? await getLatestRates(base)
          : await getRateForDate(base, date);
        const rate = payload.rates[target];
        return typeof rate === 'number' ? { date: payload.date, rate } : null;
      } catch {
        return null;
      }
    }),
  );
  const series: ChartPoint[] = [];
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

export function buildChartUrl(
  series: ChartPoint[],
  base: string,
  target: string,
  tf: Timeframe,
): string {
  const labels = series.map((p) => p.date);
  const data = series.map((p) => p.rate);
  const isUp = series.length >= 2 && series[series.length - 1].rate >= series[0].rate;
  const color = isUp ? 'rgb(34,197,94)' : 'rgb(239,68,68)';
  const fill = isUp ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)';

  const config = {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${target.toUpperCase()} per 1 ${base.toUpperCase()}`,
        data,
        borderColor: color,
        backgroundColor: fill,
        borderWidth: 2.5,
        fill: 'origin',
        pointRadius: 0,
        tension: 0.25,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${target.toUpperCase()} per 1 ${base.toUpperCase()} · ${tf}`,
          color: 'white',
          font: { size: 18, weight: 'bold' },
        },
      },
      scales: {
        x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?bkg=%230a0a0a&w=800&h=420&c=${encoded}`;
}
