import type { Language } from './index';

export type LangMeta = {
  id: Language;
  flagCode: string;
  native: string;
};

export const LANGUAGES: readonly LangMeta[] = [
  { id: 'en', flagCode: 'gb', native: 'English' },
  { id: 'ru', flagCode: 'ru', native: 'Русский' },
  { id: 'es', flagCode: 'es', native: 'Español' },
  { id: 'zh', flagCode: 'cn', native: '中文' },
  { id: 'ar', flagCode: 'sa', native: 'العربية' },
] as const;
