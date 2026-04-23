import { en, type Dict } from './en';
import { ru } from './ru';
import { es } from './es';
import { zh } from './zh';
import { ar } from './ar';
import { useStore } from '../state/store';
import type { Currency } from '../data/currencies';

export type Language = 'en' | 'ru' | 'es' | 'zh' | 'ar';

const DICTS: Record<Language, Dict> = { en, ru, es, zh, ar };

const LOCALES: Record<Language, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  es: 'es-ES',
  zh: 'zh-CN',
  ar: 'ar-SA',
};

export function useT() {
  const lang = useStore((s) => s.language);
  const dict = DICTS[lang];
  return { t: dict, lang };
}

export function getLocale(lang: Language): string {
  return LOCALES[lang];
}

export function getCurrencyName(c: Currency, lang: Language): string {
  return lang === 'ru' ? c.name_ru : c.name_en;
}

export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}

export function formatTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
