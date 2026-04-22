import { en, type Dict } from './en.ts';
import { ru } from './ru.ts';
import type { Lang } from '../services/storage.ts';
import type { Currency } from '../data/currencies.ts';

const DICTS: Record<string, Dict> = { en, ru };

/** Common BCP-47 prefix → human-readable name, used to tell the LLM in
 * which language to write free-form replies. Anything not listed here
 * is sent to the LLM as-is (the model usually knows). */
export const LANG_NAMES: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  uk: 'Ukrainian',
  be: 'Belarusian',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  cs: 'Czech',
  sk: 'Slovak',
  ro: 'Romanian',
  hu: 'Hungarian',
  bg: 'Bulgarian',
  sr: 'Serbian',
  tr: 'Turkish',
  el: 'Greek',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  he: 'Hebrew',
  ar: 'Arabic',
  fa: 'Persian',
  hi: 'Hindi',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay',
  ka: 'Georgian',
  hy: 'Armenian',
  az: 'Azerbaijani',
  kk: 'Kazakh',
  uz: 'Uzbek',
};

export function normalizeLang(lang: Lang): string {
  return lang.toLowerCase().slice(0, 2);
}

export function t(lang: Lang): Dict {
  return DICTS[normalizeLang(lang)] ?? en;
}

export function languageName(lang: Lang): string {
  const prefix = normalizeLang(lang);
  return LANG_NAMES[prefix] ?? lang;
}

export function currencyName(c: Currency, lang: Lang): string {
  return normalizeLang(lang) === 'ru' ? c.name_ru : c.name_en;
}

export function detectLang(telegramLanguageCode?: string): Lang {
  if (!telegramLanguageCode) return 'en';
  return normalizeLang(telegramLanguageCode);
}
