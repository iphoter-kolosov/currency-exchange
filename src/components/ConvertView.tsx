import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../state/store';
import { CURRENCY_BY_CODE } from '../data/currencies';
import { fetchLatest, getLastLatestAge, type RateMap } from '../api/rates';
import { CurrencyRow } from './CurrencyRow';
import { TopBar } from './TopBar';
import { CurrencyPicker } from './CurrencyPicker';
import { formatTemplate, useT } from '../i18n';
import { formatDateShort } from '../utils/format';

export function ConvertView() {
  const { t, lang } = useT();
  const selectedCodes = useStore((s) => s.selectedCodes);
  const activeCode = useStore((s) => s.activeCode);
  const amount = useStore((s) => s.amount);
  const editing = useStore((s) => s.editing);
  const setActive = useStore((s) => s.setActive);
  const setAmount = useStore((s) => s.setAmount);
  const addCurrency = useStore((s) => s.addCurrency);
  const removeCurrency = useStore((s) => s.removeCurrency);

  const [rates, setRates] = useState<RateMap | null>(null);
  const [ratesBase, setRatesBase] = useState<string>('usd');
  const [rateDate, setRateDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [offlineFrom, setOfflineFrom] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadRates = useCallback(async () => {
    setLoading(true);
    setErrored(false);
    try {
      const payload = await fetchLatest('usd');
      setRates(payload.rates);
      setRatesBase('usd');
      setRateDate(payload.date);
      setOfflineFrom(null);
    } catch {
      setErrored(true);
      const age = getLastLatestAge('usd');
      if (age !== null) setOfflineFrom(age);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  useEffect(() => {
    const onOnline = () => void loadRates();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [loadRates]);

  const valueFor = (code: string): number => {
    if (!rates) return 0;
    const rActive = code === ratesBase ? 1 : rates[code];
    const rFrom = activeCode === ratesBase ? 1 : rates[activeCode];
    if (typeof rActive !== 'number' || typeof rFrom !== 'number' || rFrom === 0) return 0;
    return (amount * rActive) / rFrom;
  };

  const activeCurrency = CURRENCY_BY_CODE[activeCode];
  const updatedLabel = rateDate
    ? formatTemplate(t.updatedAt, { date: formatDateShort(new Date(rateDate), lang) })
    : '';

  return (
    <>
      <TopBar title={t.appTitle} onAdd={() => setPickerOpen(true)} />

      <main className="main">
        {loading && !rates ? (
          <div className="status">{t.loading}</div>
        ) : errored && !rates ? (
          <div className="status error">
            <div>{t.error}</div>
            <button className="retry-btn" onClick={() => void loadRates()}>{t.retry}</button>
          </div>
        ) : (
          <>
            {offlineFrom !== null ? (
              <div className="status offline">{t.offline}</div>
            ) : null}

            <div className="list">
              {selectedCodes.map((code) => {
                const currency = CURRENCY_BY_CODE[code];
                if (!currency) return null;
                const isActive = code === activeCode;
                const value = isActive ? amount : valueFor(code);
                return (
                  <CurrencyRow
                    key={code}
                    currency={currency}
                    amount={value}
                    isActive={isActive}
                    editing={editing}
                    onActivate={() => setActive(code)}
                    onChangeAmount={(next) => setAmount(next)}
                    onRemove={
                      selectedCodes.length > 1 && code !== activeCode
                        ? () => removeCurrency(code)
                        : undefined
                    }
                  />
                );
              })}
              {selectedCodes.length === 0 ? (
                <div className="status">{t.empty}</div>
              ) : null}
            </div>

            {activeCurrency && !editing ? (
              <div className="footer-note">{updatedLabel}</div>
            ) : null}
          </>
        )}
      </main>

      <CurrencyPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(code) => addCurrency(code)}
        excludeCodes={selectedCodes}
      />
    </>
  );
}
