import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SELECTED_CODES } from '../data/currencies';
import { isSupportedLang, type Language } from '../i18n';
import type { Timeframe } from '../utils/dates';

type View = 'convert' | 'chart';

export type CustomRange = { from: string; to: string };

export type AppState = {
  selectedCodes: string[];
  activeCode: string;
  amount: number;
  view: View;
  editing: boolean;

  chartBase: string;
  chartTarget: string;
  timeframe: Timeframe;
  customRange: CustomRange | null;

  language: Language;
  onboarded: boolean;

  setActive: (code: string) => void;
  setAmount: (amount: number) => void;
  setView: (view: View) => void;
  setEditing: (editing: boolean) => void;
  addCurrency: (code: string) => void;
  removeCurrency: (code: string) => void;
  reorder: (from: number, to: number) => void;
  setChartPair: (base: string, target: string) => void;
  swapChartPair: () => void;
  setTimeframe: (tf: Timeframe) => void;
  setCustomRange: (range: CustomRange | null) => void;
  setLanguage: (lang: Language) => void;
  setOnboarded: (onboarded: boolean) => void;
};

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const n = (navigator.language || '').toLowerCase();
  const prefix = n.split('-')[0];
  return isSupportedLang(prefix) ? prefix : 'en';
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedCodes: DEFAULT_SELECTED_CODES,
      activeCode: 'usd',
      amount: 100,
      view: 'convert',
      editing: false,

      chartBase: 'eur',
      chartTarget: 'usd',
      timeframe: '1M',
      customRange: null,

      language: detectLanguage(),
      onboarded: false,

      setActive: (code) => set({ activeCode: code }),
      setAmount: (amount) => set({ amount }),
      setView: (view) => set({ view, editing: false }),
      setEditing: (editing) => set({ editing }),

      addCurrency: (code) =>
        set((s) =>
          s.selectedCodes.includes(code)
            ? s
            : { selectedCodes: [...s.selectedCodes, code] },
        ),

      removeCurrency: (code) =>
        set((s) => {
          if (s.selectedCodes.length <= 1) return s;
          const selectedCodes = s.selectedCodes.filter((c) => c !== code);
          const activeCode = s.activeCode === code ? selectedCodes[0] : s.activeCode;
          return { selectedCodes, activeCode };
        }),

      reorder: (from, to) =>
        set((s) => {
          const list = [...s.selectedCodes];
          const [moved] = list.splice(from, 1);
          list.splice(to, 0, moved);
          return { selectedCodes: list };
        }),

      setChartPair: (base, target) => {
        if (base === target) {
          const alt = get().selectedCodes.find((c) => c !== base) ?? 'usd';
          set({ chartBase: base, chartTarget: alt });
        } else {
          set({ chartBase: base, chartTarget: target });
        }
      },

      swapChartPair: () =>
        set((s) => ({ chartBase: s.chartTarget, chartTarget: s.chartBase })),

      setTimeframe: (tf) => set({ timeframe: tf, customRange: null }),
      setCustomRange: (range) => set({ customRange: range }),
      setLanguage: (lang) => set({ language: lang }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: 'currency-exchange-v1',
      partialize: (s) => ({
        selectedCodes: s.selectedCodes,
        activeCode: s.activeCode,
        amount: s.amount,
        chartBase: s.chartBase,
        chartTarget: s.chartTarget,
        timeframe: s.timeframe,
        customRange: s.customRange,
        language: s.language,
        onboarded: s.onboarded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !isSupportedLang(state.language)) {
          state.language = 'en';
        }
      },
    },
  ),
);
