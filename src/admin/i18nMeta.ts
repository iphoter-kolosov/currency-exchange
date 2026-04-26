export const SUPPORTED_LANGS = ['en', 'ru', 'es', 'zh', 'ar'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

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
];

export const LANG_BY_ID: Record<SupportedLang, LangMeta> = LANGUAGES.reduce(
  (acc, l) => {
    acc[l.id] = l;
    return acc;
  },
  {} as Record<SupportedLang, LangMeta>,
);
