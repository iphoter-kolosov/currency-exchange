import { en, type Dict } from './en.ts';
import { ru } from './ru.ts';
import type { Lang } from '../services/storage.ts';
import type { Currency } from '../data/currencies.ts';

const DICTS: Record<Lang, Dict> = { en, ru };

export function t(lang: Lang): Dict {
  return DICTS[lang];
}

export function currencyName(c: Currency, lang: Lang): string {
  return lang === 'ru' ? c.name_ru : c.name_en;
}

export function detectLang(telegramLanguageCode?: string): Lang {
  return telegramLanguageCode && telegramLanguageCode.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
