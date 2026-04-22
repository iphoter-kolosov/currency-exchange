import { TIMEFRAMES, type Timeframe } from '../utils/dates';
import { useT } from '../i18n';

type Props = {
  value: Timeframe;
  customActive: boolean;
  onChange: (tf: Timeframe) => void;
  onCustom: () => void;
};

export function TimeframeTabs({ value, customActive, onChange, onCustom }: Props) {
  const { t } = useT();
  return (
    <div className="timeframes">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={`tf-btn ${!customActive && value === tf ? 'is-active' : ''}`}
          onClick={() => onChange(tf)}
        >
          {t.timeframe[tf]}
        </button>
      ))}
      <button
        className={`tf-btn tf-custom ${customActive ? 'is-active' : ''}`}
        onClick={onCustom}
      >
        {t.timeframe.custom}
      </button>
    </div>
  );
}
