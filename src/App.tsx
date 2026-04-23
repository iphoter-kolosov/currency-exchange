import { useEffect } from 'react';
import { useStore } from './state/store';
import { ConvertView } from './components/ConvertView';
import { ChartView } from './components/ChartView';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { isRTL } from './i18n';

export default function App() {
  const view = useStore((s) => s.view);
  const onboarded = useStore((s) => s.onboarded);
  const language = useStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = isRTL(language) ? 'rtl' : 'ltr';
  }, [language]);

  return (
    <div className="app">
      <div className="app-shell">
        {view === 'convert' ? <ConvertView /> : <ChartView />}
        <BottomNav />
      </div>
      {!onboarded ? <OnboardingModal /> : null}
    </div>
  );
}
