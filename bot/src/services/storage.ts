import { DEFAULT_WATCHLIST } from '../data/currencies.ts';

export type Lang = 'en' | 'ru';

export type UserPrefs = {
  lang: Lang;
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
};

export type AlertCondition =
  | { type: 'above'; value: number }
  | { type: 'below'; value: number }
  | { type: 'pct_up'; value: number; windowHours: number }
  | { type: 'pct_down'; value: number; windowHours: number };

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
    const now = Date.now();
    if (now - entry.value.lastActiveAt > 60_000) {
      entry.value.lastActiveAt = now;
      await k.set(K_USER(userId), entry.value);
    }
    return entry.value;
  }
  const fresh: UserPrefs = {
    lang: hintLang ?? 'en',
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
