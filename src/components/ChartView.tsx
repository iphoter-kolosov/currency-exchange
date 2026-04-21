import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../state/store';
import { CURRENCY_BY_CODE } from '../data/currencies';
import { fetchSeries, type SeriesPoint } from '../api/rates';
import { TimeframeTabs } from './TimeframeTabs';
import { TopBar } from './TopBar';
import { CurrencyPicker } from './CurrencyPicker';
import { Flag } from './Flag';
import { formatAmount, formatPercent } from '../utils/format';
import { formatTemplate, useT } from '../i18n';

export function ChartView() {
  const { t, lang } = useT();
  const base = useStore((s) => s.chartBase);
  const target = useStore((s) => s.chartTarget);
  const timeframe = useStore((s) => s.timeframe);
  const setChartPair = useStore((s) => s.setChartPair);
  const swap = useStore((s) => s.swapChartPair);
  const setTimeframe = useStore((s) => s.setTimeframe);

  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);

  const [picker, setPicker] = useState<null | 'base' | 'target'>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);
    fetchSeries(base, target, timeframe)
      .then((s) => {
        if (!cancelled) setSeries(s);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [base, target, timeframe]);

  const baseCur = CURRENCY_BY_CODE[base];
  const targetCur = CURRENCY_BY_CODE[target];

  const lastRate = series.length > 0 ? series[series.length - 1].rate : null;
  const firstRate = series.length > 0 ? series[0].rate : null;
  const pctChange =
    lastRate !== null && firstRate !== null && firstRate !== 0
      ? ((lastRate - firstRate) / firstRate) * 100
      : null;

  const domain = useMemo<[number, number] | undefined>(() => {
    if (series.length === 0) return undefined;
    const values = series.map((p) => p.rate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.1 || max * 0.01;
    return [min - pad, max + pad];
  }, [series]);

  const chartColor = pctChange !== null && pctChange < 0 ? '#ef4444' : '#22c55e';

  return (
    <>
      <TopBar title={t.appTitle} />

      <main className="main chart-main">
        <div className="chart-heading">
          <div>
            <div className="chart-title">
              {formatTemplate(t.perOne, {
                target: targetCur?.iso ?? target.toUpperCase(),
                base: baseCur?.iso ?? base.toUpperCase(),
              })}
            </div>
            <div className="chart-sub">
              {lastRate !== null && targetCur ? (
                <span className="chart-price">
                  {targetCur.symbol}
                  {formatAmount(lastRate, targetCur, lang, { maxFractionDigits: 4 })}
                </span>
              ) : (
                <span className="chart-price">—</span>
              )}
              {pctChange !== null ? (
                <span
                  className="chart-delta"
                  style={{ color: pctChange < 0 ? '#ef4444' : '#22c55e' }}
                >
                  {formatPercent(pctChange, lang)}
                </span>
              ) : null}
            </div>
          </div>
          <button className="swap-btn" onClick={swap} aria-label={t.swap}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4v14" />
              <path d="M3 8l4-4 4 4" />
              <path d="M17 20V6" />
              <path d="M21 16l-4 4-4-4" />
            </svg>
          </button>
        </div>

        <div className="chart-area">
          {loading ? (
            <div className="status">{t.loading}</div>
          ) : errored ? (
            <div className="status error">{t.error}</div>
          ) : series.length === 0 ? (
            <div className="status">{t.loading}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={domain ?? ['auto', 'auto']} hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const p = payload[0].payload as SeriesPoint;
                    return (
                      <div className="chart-tooltip">
                        <div className="chart-tooltip-date">{p.date}</div>
                        <div className="chart-tooltip-rate">
                          {targetCur?.symbol}
                          {formatAmount(p.rate, targetCur, lang, { maxFractionDigits: 4 })}
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill="url(#chartFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <TimeframeTabs value={timeframe} onChange={setTimeframe} />

        <div className="pair-row">
          <button className="pair-btn" onClick={() => setPicker('base')}>
            {baseCur ? <Flag code={baseCur.flagCode} size={28} /> : null}
            <span>{baseCur?.iso ?? base.toUpperCase()}</span>
          </button>
          <button className="pair-btn" onClick={() => setPicker('target')}>
            {targetCur ? <Flag code={targetCur.flagCode} size={28} /> : null}
            <span>{targetCur?.iso ?? target.toUpperCase()}</span>
          </button>
        </div>
      </main>

      <CurrencyPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        onPick={(code) => {
          if (picker === 'base') setChartPair(code, target);
          if (picker === 'target') setChartPair(base, code);
        }}
      />
    </>
  );
}
