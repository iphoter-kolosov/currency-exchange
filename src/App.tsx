import { useStore } from './state/store';
import { ConvertView } from './components/ConvertView';
import { ChartView } from './components/ChartView';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const view = useStore((s) => s.view);
  return (
    <div className="app">
      <div className="app-shell">
        {view === 'convert' ? <ConvertView /> : <ChartView />}
        <BottomNav />
      </div>
    </div>
  );
}
