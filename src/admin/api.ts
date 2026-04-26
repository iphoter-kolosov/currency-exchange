import type { State } from './types';

const DEFAULT_API_BASE = 'https://currency-exchange.iphoter-kolosov.deno.net';

function readApiBase(): string {
  // Allow override via ?api=https://… so we can change endpoint without re-deploying.
  const fromQuery = new URLSearchParams(window.location.search).get('api');
  if (fromQuery) {
    try {
      localStorage.setItem('adminApiBase', fromQuery);
    } catch {
      /* ignore quota errors */
    }
    return fromQuery.replace(/\/+$/, '');
  }
  try {
    const saved = localStorage.getItem('adminApiBase');
    if (saved) return saved.replace(/\/+$/, '');
  } catch {
    /* ignore */
  }
  const fromEnv = import.meta.env.VITE_ADMIN_API_BASE;
  if (fromEnv) return String(fromEnv).replace(/\/+$/, '');
  return DEFAULT_API_BASE;
}

export const API_BASE = readApiBase();

function initData(): string {
  return window.Telegram?.WebApp?.initData ?? '';
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/admin/${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-telegram-init-data': initData(),
        ...(init.headers ?? {}),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Network error reaching ${url} — ${msg}`);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error ?? `HTTP ${res.status} from ${url}`;
    throw new Error(err);
  }
  return data as T;
}

import type { PostResult } from './types';
import type { SupportedLang } from './i18nMeta';

export const api = {
  state: () => call<State>('state'),
  post: (posts: { lang: SupportedLang; body: string }[], sponsor?: string) =>
    call<{ results: PostResult[] }>('post', {
      method: 'POST',
      body: JSON.stringify({ posts, sponsor }),
    }),
  translate: (from: SupportedLang, body: string, to: SupportedLang[]) =>
    call<{ translations: Record<string, string | null> }>('translate', {
      method: 'POST',
      body: JSON.stringify({ from, body, to }),
    }),
  setChannel: (lang: SupportedLang, id: number | null) =>
    call<{ ok: true }>('setchannel', { method: 'POST', body: JSON.stringify({ lang, id }) }),
  setGroup: (lang: SupportedLang, id: number | null) =>
    call<{ ok: true }>('setgroup', { method: 'POST', body: JSON.stringify({ lang, id }) }),
  aiToggle: () => call<{ aiOn: boolean }>('aitoggle', { method: 'POST' }),
  aiPublic: () => call<{ aiPublic: boolean }>('aipublic', { method: 'POST' }),
  addTester: (userId: number) =>
    call<{ ok: true }>('testers/add', { method: 'POST', body: JSON.stringify({ userId }) }),
  removeTester: (userId: number) =>
    call<{ ok: true }>('testers/remove', { method: 'POST', body: JSON.stringify({ userId }) }),
};
