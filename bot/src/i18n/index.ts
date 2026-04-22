import { en, type Dict } from './en.ts';
import { ru } from './ru.ts';
import { es } from './es.ts';
import { zh } from './zh.ts';
import { ar } from './ar.ts';
import type { Lang } from '../services/storage.ts';
import type { Currency } from '../data/currencies.ts';

export const SUPPORTED_LANGS = ['en', 'ru', 'es', 'zh', 'ar'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

/** Record instead of plain object so removing a language from
 * SUPPORTED_LANGS without updating the map is a type error. */
const DICTS: Record<SupportedLang, Dict> = { en, ru, es, zh, ar };

/** Human-readable names for every supported UI language, fed into the
 * LLM prompts so the model answers free-form replies in the user's
 * language. Only the supported five — anything else resets to 'en'. */
export const LANG_NAMES: Record<SupportedLang, string> = {
  en: 'English',
  ru: 'Russian',
  es: 'Spanish',
  zh: 'Chinese',
  ar: 'Arabic',
};

export function normalizeLang(lang: Lang): string {
  return lang.toLowerCase().slice(0, 2);
}

export function isSupportedLang(lang: string): lang is SupportedLang {
  return (SUPPORTED_LANGS as readonly string[]).includes(normalizeLang(lang));
}

export function t(lang: Lang): Dict {
  const prefix = normalizeLang(lang);
  return isSupportedLang(prefix) ? DICTS[prefix] : en;
}

export function languageName(lang: Lang): string {
  const prefix = normalizeLang(lang);
  return isSupportedLang(prefix) ? LANG_NAMES[prefix] : 'English';
}

/** Render a template string with {placeholder} tokens against a params
 * object. Unknown tokens pass through unchanged so we notice missing
 * fields instead of silently emitting 'undefined'. */
export function tpl(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = params[key];
    return v === undefined ? match : String(v);
  });
}

export function currencyName(c: Currency, lang: Lang): string {
  return normalizeLang(lang) === 'ru' ? c.name_ru : c.name_en;
}

export function detectLang(telegramLanguageCode?: string): Lang {
  if (!telegramLanguageCode) return 'en';
  const prefix = normalizeLang(telegramLanguageCode);
  return isSupportedLang(prefix) ? prefix : 'en';
}
