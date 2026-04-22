import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { toISODate } from '../utils/dates';

type Props = {
  open: boolean;
  initialFrom: string | null;
  initialTo: string | null;
  onApply: (from: string, to: string) => void;
  onClose: () => void;
};

export function CustomRangePicker({ open, initialFrom, initialTo, onApply, onClose }: Props) {
  const { t } = useT();
  const todayIso = toISODate(new Date());
  const defaultFrom = initialFrom ?? (() => {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 1);
    return toISODate(d);
  })();
  const defaultTo = initialTo ?? todayIso;

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFrom(initialFrom ?? defaultFrom);
      setTo(initialTo ?? defaultTo);
      setErr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function apply() {
    if (!from || !to || from > to) {
      setErr(t.customRange.invalid);
      return;
    }
    onApply(from, to);
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal range-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t.customRange.title}</div>
          <button className="icon-btn" onClick={onClose} aria-label={t.close}>×</button>
        </div>
        <div className="modal-body">
          <label className="range-field">
            <span>{t.customRange.from}</span>
            <input
              type="date"
              value={from}
              max={to || todayIso}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="range-field">
            <span>{t.customRange.to}</span>
            <input
              type="date"
              value={to}
              min={from}
              max={todayIso}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          {err ? <div className="range-error">{err}</div> : null}
        </div>
        <div className="modal-footer">
          <button className="text-btn" onClick={onClose}>{t.customRange.cancel}</button>
          <button className="primary-btn" onClick={apply}>{t.customRange.apply}</button>
        </div>
      </div>
    </div>
  );
}
