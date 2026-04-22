import { en, type Dict } from './en.ts';

/** Dot-paths into Dict that hold plain string values (no template args).
 * Only these get translated on-demand by the LLM; everything else (the
 * parametric functions like start.greeting(name)) stays English so we
 * don't mangle placeholders. This covers every button label, section
 * title, confirmation toast, and dry status message the user ever
 * sees. */
export const TRANSLATABLE_PATHS: string[] = [
  'start.menu_convert',
  'start.menu_watch',
  'start.menu_chart',
  'start.menu_alerts',
  'start.menu_settings',
  'start.menu_help',
  'common.cancel',
  'common.back',
  'common.done',
  'common.delete',
  'common.add',
  'common.loading',
  'common.error',
  'convert.prompt',
  'watchlist.title',
  'watchlist.empty',
  'watchlist.add_prompt',
  'watchlist.change_base',
  'watchlist.base_prompt',
  'chart.pick_pair',
  'chart.pick_tf',
  'chart.no_data',
  'alerts.list_title',
  'alerts.list_empty',
  'alerts.new',
  'alerts.pick_pair',
  'alerts.pick_type',
  'alerts.type_above',
  'alerts.type_below',
  'alerts.type_pct_up',
  'alerts.type_pct_down',
  'alerts.hint_price',
  'alerts.hint_percent',
  'alerts.deleted',
  'settings.title',
  'settings.language',
  'settings.language_en',
  'settings.language_ru',
  'settings.lang_changed',
  'settings.timezone',
  'settings.tz_changed',
  'settings.tz_prompt',
  'settings.tz_custom',
  'settings.tz_custom_prompt',
  'settings.lang_custom',
  'settings.lang_custom_prompt',
  'settings.about',
  'digest.menu_new',
  'digest.scope_pair',
  'digest.scope_watchlist',
  'digest.pick_scope',
  'digest.pick_pair',
  'digest.pick_time_custom',
  'digest.time_invalid',
  'reset.prompt',
  'reset.confirm',
  'reset.cancel',
  'reset.done',
  'reset.done_toast',
  'reset.cancelled',
];

/** A stable fingerprint of the English source text at the paths above.
 * If an upstream edit changes any of these strings, the hash changes
 * and every cached translation becomes invalid — the bot re-translates
 * on next use so users never see stale copy. */
export function sourceVersion(): string {
  const labels = extractLabels(en);
  const joined = TRANSLATABLE_PATHS.map((p) => `${p}=${labels[p] ?? ''}`).join('\n');
  let h = 2166136261;
  for (let i = 0; i < joined.length; i++) {
    h ^= joined.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function extractLabels(dict: Dict): Record<string, string> {
  const out: Record<string, string> = {};
  for (const path of TRANSLATABLE_PATHS) {
    const val = getByPath(dict, path);
    if (typeof val === 'string') out[path] = val;
  }
  return out;
}

export function applyLabels(base: Dict, overrides: Record<string, string>): Dict {
  const copy = cloneKeepingFunctions(base) as Dict;
  for (const [path, value] of Object.entries(overrides)) {
    if (typeof value === 'string' && value.trim()) {
      setByPath(copy, path, value);
    }
  }
  return copy;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function setByPath(obj: unknown, path: string, value: string): void {
  const parts = path.split('.');
  let cur = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = cur[parts[i]];
    if (next && typeof next === 'object') {
      cur = next as Record<string, unknown>;
    } else {
      return;
    }
  }
  cur[parts[parts.length - 1]] = value;
}

function cloneKeepingFunctions(src: unknown): unknown {
  if (src === null || typeof src !== 'object') return src;
  if (typeof src === 'function') return src;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(src as Record<string, unknown>)) {
    out[key] = cloneKeepingFunctions((src as Record<string, unknown>)[key]);
  }
  return out;
}
