import { useStore } from './state/store';
import { ConvertView } from './components/ConvertView';
import { ChartView } from './components/ChartView';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';

export default function App() {
  const view = useStore((s) => s.view);
  const onboarded = useStore((s) => s.onboarded);
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
