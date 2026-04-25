import { useState } from 'react';
import { useStore } from '../state/store';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';
import { es } from '../i18n/es';
import { zh } from '../i18n/zh';
import { ar } from '../i18n/ar';
import type { Dict } from '../i18n/en';
import type { Language } from '../i18n';
import { LANGUAGES } from '../i18n/languages';

const DICTS: Record<Language, Dict> = { en, ru, es, zh, ar };

export function OnboardingModal() {
  const setLanguage = useStore((s) => s.setLanguage);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const currentLang = useStore((s) => s.language);
  const [pick, setPick] = useState<Language>(currentLang);

  const T = DICTS[pick].onboarding;

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true">
      <div className="onboarding-card">
        <div className="onboarding-emoji" aria-hidden="true">👋</div>
        <h1 className="onboarding-title">
          {en.onboarding.welcome}
          <span className="onboarding-divider">·</span>
          {ru.onboarding.welcome}
        </h1>
        <p className="onboarding-subtitle">{T.subtitle}</p>

        <div className="onboarding-section-label">{T.chooseLanguage}</div>
        <div className="onboarding-lang-grid">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              className={`onboarding-lang ${pick === l.id ? 'is-picked' : ''}`}
              onClick={() => setPick(l.id)}
            >
              <span className={`fi fi-${l.flagCode}`} />
              <span>{l.native}</span>
            </button>
          ))}
        </div>

        <button
          className="onboarding-continue"
          onClick={() => {
            setLanguage(pick);
            setOnboarded(true);
          }}
        >
          {T.continue}
        </button>
      </div>
    </div>
  );
}
