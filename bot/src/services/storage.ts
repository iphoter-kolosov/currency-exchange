import { DEFAULT_WATCHLIST } from '../data/currencies.ts';
import { DEFAULT_TZ } from './timezones.ts';

/** BCP-47 language tag: 'en', 'ru', 'de', 'uk-UA' and so on. Only 'en'
 * and 'ru' have full menu translations; other languages fall back to
 * English for UI strings while the LLM still replies in the chosen
 * language. */
export type Lang = string;

export type UserPrefs = {
  lang: Lang;
  tz: string;
  onboarded: boolean;
  watchlist: string[];
  defaultBase: string;
  createdAt: number;
  lastActiveAt: number;
};

export type Alert = {
  id: string;
  userId: number;
  base: string;
  target: string;
  condition: AlertCondition;
  createdAt: number;
  triggeredAt?: number;
  active: boolean;
  baseline?: number;
  lastTriggeredYmd?: string;
};

export type AlertCondition =
  | { type: 'above'; value: number }
  | { type: 'below'; value: number }
  | { type: 'pct_up'; value: number; windowHours: number }
  | { type: 'pct_down'; value: number; windowHours: number }
  | { type: 'daily_digest'; hour: number; minute: number; scope: 'pair' | 'watchlist' };

let kv: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kv) kv = await Deno.openKv();
  return kv;
}

const K_USER = (uid: number) => ['user', uid] as const;
const K_ALERT = (uid: number, aid: string) => ['alert', uid, aid] as const;
const K_ALERTS_BY_USER = (uid: number) => ['alert', uid] as const;
const K_ALL_ALERTS = () => ['alert'] as const;

export async function getUser(userId: number, hintLang?: Lang): Promise<UserPrefs> {
  const k = await getKv();
  const entry = await k.get<UserPrefs>(K_USER(userId));
  if (entry.value) {
    const user = entry.value;
    if (user.onboarded === undefined) user.onboarded = false;
    if (!user.tz) user.tz = DEFAULT_TZ;
    const now = Date.now();
    if (now - user.lastActiveAt > 60_000) {
      user.lastActiveAt = now;
      await k.set(K_USER(userId), user);
    }
    return user;
  }
  const fresh: UserPrefs = {
    lang: hintLang ?? 'en',
    tz: DEFAULT_TZ,
    onboarded: false,
    watchlist: DEFAULT_WATCHLIST.slice(),
    defaultBase: 'usd',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  await k.set(K_USER(userId), fresh);
  return fresh;
}

export async function updateUser(userId: number, patch: Partial<UserPrefs>): Promise<UserPrefs> {
  const k = await getKv();
  const current = await getUser(userId);
  const next = { ...current, ...patch, lastActiveAt: Date.now() };
  await k.set(K_USER(userId), next);
  return next;
}

export async function listAlerts(userId: number): Promise<Alert[]> {
  const k = await getKv();
  const out: Alert[] = [];
  for await (const entry of k.list<Alert>({ prefix: K_ALERTS_BY_USER(userId) })) {
    out.push(entry.value);
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

export async function countActiveAlerts(userId: number): Promise<number> {
  const alerts = await listAlerts(userId);
  return alerts.filter((a) => a.active).length;
}

export async function createAlert(alert: Alert): Promise<void> {
  const k = await getKv();
  await k.set(K_ALERT(alert.userId, alert.id), alert);
}

export async function deleteAlert(userId: number, alertId: string): Promise<void> {
  const k = await getKv();
  await k.delete(K_ALERT(userId, alertId));
}

export async function* iterateAllAlerts(): AsyncGenerator<Alert> {
  const k = await getKv();
  for await (const entry of k.list<Alert>({ prefix: K_ALL_ALERTS() })) {
    yield entry.value;
  }
}

export async function updateAlert(alert: Alert): Promise<void> {
  const k = await getKv();
  await k.set(K_ALERT(alert.userId, alert.id), alert);
}

export function newId(): string {
  return crypto.randomUUID().split('-')[0];
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

const K_CONTEXT = (uid: number) => ['ctx', uid] as const;
const CONTEXT_LIMIT = 6;
const CONTEXT_TTL_MS = 15 * 60 * 1000;

export async function getContext(userId: number): Promise<ChatTurn[]> {
  const k = await getKv();
  const entry = await k.get<ChatTurn[]>(K_CONTEXT(userId));
  return entry.value ?? [];
}

export async function appendContext(
  userId: number,
  user: string,
  assistant: string,
): Promise<void> {
  const k = await getKv();
  const current = (await k.get<ChatTurn[]>(K_CONTEXT(userId))).value ?? [];
  const next = [
    ...current,
    { role: 'user' as const, content: user.slice(0, 400) },
    { role: 'assistant' as const, content: assistant.slice(0, 400) },
  ].slice(-CONTEXT_LIMIT * 2);
  await k.set(K_CONTEXT(userId), next, { expireIn: CONTEXT_TTL_MS });
}

export async function clearContext(userId: number): Promise<void> {
  const k = await getKv();
  await k.delete(K_CONTEXT(userId));
}

export async function resetUser(userId: number): Promise<void> {
  const k = await getKv();
  for await (const entry of k.list<Alert>({ prefix: K_ALERTS_BY_USER(userId) })) {
    await k.delete(entry.key);
  }
  await k.delete(K_USER(userId));
  await k.delete(K_CONTEXT(userId));
}

export type UiLabelsEntry = {
  version: string;
  labels: Record<string, string>;
};

const K_UI = (lang: string) => ['ui', lang] as const;

export async function getUiLabels(lang: string): Promise<UiLabelsEntry | null> {
  const k = await getKv();
  const entry = await k.get<UiLabelsEntry>(K_UI(lang));
  return entry.value ?? null;
}

export async function saveUiLabels(lang: string, entry: UiLabelsEntry): Promise<void> {
  const k = await getKv();
  await k.set(K_UI(lang), entry);
}
