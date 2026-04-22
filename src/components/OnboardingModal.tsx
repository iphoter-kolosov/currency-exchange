import { useState } from 'react';
import { useStore } from '../state/store';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';
import type { Language } from '../i18n';

export function OnboardingModal() {
  const setLanguage = useStore((s) => s.setLanguage);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const currentLang = useStore((s) => s.language);
  const [pick, setPick] = useState<Language>(currentLang);

  const dict = pick === 'ru' ? ru : en;
  const T = dict.onboarding;

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
        <div className="onboarding-lang-row">
          <button
            className={`onboarding-lang ${pick === 'en' ? 'is-picked' : ''}`}
            onClick={() => setPick('en')}
          >
            <span className="fi fi-gb" />
            <span>English</span>
          </button>
          <button
            className={`onboarding-lang ${pick === 'ru' ? 'is-picked' : ''}`}
            onClick={() => setPick('ru')}
          >
            <span className="fi fi-ru" />
            <span>Русский</span>
          </button>
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
