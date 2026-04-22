import type { SupportedLang } from './index.ts';

export type LangMeta = {
  id: SupportedLang;
  flag: string;
  native: string;
};

export const LANGUAGES: readonly LangMeta[] = [
  { id: 'en', flag: '🇬🇧', native: 'English' },
  { id: 'ru', flag: '🇷🇺', native: 'Русский' },
  { id: 'es', flag: '🇪🇸', native: 'Español' },
  { id: 'zh', flag: '🇨🇳', native: '中文' },
  { id: 'ar', flag: '🇸🇦', native: 'العربية' },
] as const;
