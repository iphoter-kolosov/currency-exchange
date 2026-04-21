import { TIMEFRAMES, type Timeframe } from '../utils/dates';
import { useT } from '../i18n';

type Props = {
  value: Timeframe;
  onChange: (tf: Timeframe) => void;
};

export function TimeframeTabs({ value, onChange }: Props) {
  const { t } = useT();
  return (
    <div className="timeframes">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={`tf-btn ${value === tf ? 'is-active' : ''}`}
          onClick={() => onChange(tf)}
        >
          {t.timeframe[tf]}
        </button>
      ))}
    </div>
  );
}
