import type { Language } from './index';

export type LangMeta = {
  id: Language;
  flag: string;
  flagCode: string;
  native: string;
};

export const LANGUAGES: readonly LangMeta[] = [
  { id: 'en', flag: '🇬🇧', flagCode: 'gb', native: 'English' },
  { id: 'ru', flag: '🇷🇺', flagCode: 'ru', native: 'Русский' },
  { id: 'es', flag: '🇪🇸', flagCode: 'es', native: 'Español' },
  { id: 'zh', flag: '🇨🇳', flagCode: 'cn', native: '中文' },
  { id: 'ar', flag: '🇸🇦', flagCode: 'sa', native: 'العربية' },
] as const;
