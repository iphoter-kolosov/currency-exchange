import { en, type Dict } from './en.ts';

/** Every string leaf in Dict is translatable — even the parametric
 * templates like '{amount} {from} = {value} {to}', because placeholders
 * in curly braces survive the LLM round-trip as long as the prompt
 * tells the model to keep them literal. The list is generated from the
 * English dict so it can never drift from the actual schema. */
export function collectPaths(dict: Dict): string[] {
  const out: string[] = [];
  walk(dict as unknown as Record<string, unknown>, '', out);
  return out;
}

function walk(obj: Record<string, unknown>, prefix: string, out: string[]): void {
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (typeof val === 'string') {
      out.push(path);
    } else if (val && typeof val === 'object') {
      walk(val as Record<string, unknown>, path, out);
    }
  }
}

export const TRANSLATABLE_PATHS: string[] = collectPaths(en);

/** Stable fingerprint of the English source at every translatable
 * path. If an upstream edit changes any of these strings, the hash
 * changes and every cached translation becomes invalid — the bot
 * re-translates on next set_language for that lang. */
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
