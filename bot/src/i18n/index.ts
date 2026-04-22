import { en, type Dict } from './en.ts';
import { ru } from './ru.ts';
import type { Lang } from '../services/storage.ts';
import type { Currency } from '../data/currencies.ts';
import { applyLabels, extractLabels, sourceVersion } from './translatable.ts';
import { getUiLabels, saveUiLabels } from '../services/storage.ts';
import { translateUiLabels } from '../services/ai.ts';

const DICTS: Record<string, Dict> = { en, ru };

/** lang prefix → merged dict (EN base + LLM overrides). Populated by
 * ensureUiLabels and consumed by t(). Survives only inside one isolate;
 * that's fine — next request in the same isolate skips the KV round-
 * trip, a fresh isolate re-reads from KV. */
const mergedCache = new Map<string, Dict>();
/** lang prefix → in-flight background translation. Prevents parallel
 * duplicate Pollinations calls when two messages land at once for a
 * language with no cached dict yet. */
const translating = new Map<string, Promise<void>>();

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
  const prefix = normalizeLang(lang);
  if (DICTS[prefix]) return DICTS[prefix];
  return mergedCache.get(prefix) ?? en;
}

/** Fast path: if we already have a translation for this language in KV,
 * load it into memory so t(lang) returns localised buttons. Never hits
 * the LLM — middleware calls this on every request, so it must be cheap
 * and never block on network latency. */
export async function ensureLabelsFromCache(lang: Lang): Promise<void> {
  const prefix = normalizeLang(lang);
  if (DICTS[prefix]) return;
  if (mergedCache.has(prefix)) return;
  const saved = await getUiLabels(prefix).catch(() => null);
  if (saved && saved.version === sourceVersion()) {
    mergedCache.set(prefix, applyLabels(en, saved.labels));
  }
}

/** Slow path: call the LLM to translate every UI label into this lang,
 * then cache in KV + memory. Called once when the user changes their
 * language to something other than en/ru. Deduplicates parallel calls
 * for the same language. Returns true on success, false on any failure
 * (caller can fall back to English labels). */
export async function translateAndCacheLabels(lang: Lang): Promise<boolean> {
  const prefix = normalizeLang(lang);
  if (DICTS[prefix]) return true;

  const cached = mergedCache.has(prefix) ? true : null;
  if (cached) return true;

  const inflight = translating.get(prefix);
  if (inflight) {
    await inflight;
    return mergedCache.has(prefix);
  }

  const job = (async () => {
    const translated = await translateUiLabels(extractLabels(en), lang);
    if (!translated) return;
    mergedCache.set(prefix, applyLabels(en, translated));
    await saveUiLabels(prefix, { version: sourceVersion(), labels: translated }).catch(() => {});
  })();
  translating.set(prefix, job);
  try {
    await job;
    return mergedCache.has(prefix);
  } finally {
    translating.delete(prefix);
  }
}

export function languageName(lang: Lang): string {
  const prefix = normalizeLang(lang);
  return LANG_NAMES[prefix] ?? lang;
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
  return normalizeLang(telegramLanguageCode);
}
