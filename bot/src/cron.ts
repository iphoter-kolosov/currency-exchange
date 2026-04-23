import type { Bot } from 'grammy';
import type { BotCtx } from './bot.ts';
import { iterateAllAlerts, updateAlert, getUser, type Alert, type UserPrefs } from './services/storage.ts';
import { getLatestRates, getRateForDate } from './services/rates.ts';
import { CURRENCY_BY_CODE } from './data/currencies.ts';
import { t, tpl } from './i18n/index.ts';
import { formatRate, formatPercent } from './services/format.ts';
import { localParts } from './services/timezones.ts';

const MIN_RE_TRIGGER_MS = 60 * 60 * 1000;
const DIGEST_TRIGGER_WINDOW_MIN = 5;

export async function checkAlerts(bot: Bot<BotCtx>): Promise<{ checked: number; fired: number }> {
  let checked = 0;
  let fired = 0;
  const baseToRates = new Map<string, { rates: Record<string, number>; date: string }>();
  const userCache = new Map<number, UserPrefs>();

  async function userFor(uid: number): Promise<UserPrefs> {
    const cached = userCache.get(uid);
    if (cached) return cached;
    const u = await getUser(uid);
    userCache.set(uid, u);
    return u;
  }

  for await (const alert of iterateAllAlerts()) {
    if (!alert.active) continue;
    checked++;

    if (alert.condition.type === 'daily_digest') {
      try {
        const user = await userFor(alert.userId);
        if (await tryFireDailyDigest(bot, alert, user)) fired++;
      } catch (e) {
        console.error('digest failed', alert.id, e);
      }
      continue;
    }

    let payload = baseToRates.get(alert.base);
    if (!payload) {
      try {
        const p = await getLatestRates(alert.base);
        payload = { rates: p.rates, date: p.date };
        baseToRates.set(alert.base, payload);
      } catch {
        continue;
      }
    }

    const currentRate = payload.rates[alert.target];
    if (typeof currentRate !== 'number') continue;

    const lastFired = alert.triggeredAt ?? 0;
    if (Date.now() - lastFired < MIN_RE_TRIGGER_MS) continue;

    const hit = evaluate(alert, currentRate);
    if (!hit) continue;

    try {
      await sendPriceAlert(bot, alert, currentRate);
      alert.triggeredAt = Date.now();
      if (alert.condition.type === 'pct_up' || alert.condition.type === 'pct_down') {
        alert.baseline = currentRate;
      }
      await updateAlert(alert);
      fired++;
    } catch (e) {
      console.error('failed to send alert', alert.id, e);
    }
  }
  return { checked, fired };
}

function evaluate(alert: Alert, currentRate: number): boolean {
  switch (alert.condition.type) {
    case 'above':
      return currentRate > alert.condition.value;
    case 'below':
      return currentRate < alert.condition.value;
    case 'pct_up': {
      if (!alert.baseline) return false;
      const pct = ((currentRate - alert.baseline) / alert.baseline) * 100;
      return pct >= alert.condition.value;
    }
    case 'pct_down': {
      if (!alert.baseline) return false;
      const pct = ((alert.baseline - currentRate) / alert.baseline) * 100;
      return pct >= alert.condition.value;
    }
    case 'daily_digest':
      return false;
  }
}

async function sendPriceAlert(bot: Bot<BotCtx>, alert: Alert, rate: number): Promise<void> {
  const user = await getUser(alert.userId);
  const T = t(user.lang).alerts;
  const baseCur = CURRENCY_BY_CODE[alert.base];
  const targetCur = CURRENCY_BY_CODE[alert.target];
  const pairStr = `${baseCur?.iso ?? alert.base.toUpperCase()}/${targetCur?.iso ?? alert.target.toUpperCase()}`;
  const priceStr = targetCur
    ? `${targetCur.symbol}${formatRate(rate, user.lang)}`
    : formatRate(rate, user.lang);

  let text: string;
  switch (alert.condition.type) {
    case 'above':
      text = tpl(T.notification_above, {
        pair: pairStr,
        price: priceStr,
        target: String(alert.condition.value),
      });
      break;
    case 'below':
      text = tpl(T.notification_below, {
        pair: pairStr,
        price: priceStr,
        target: String(alert.condition.value),
      });
      break;
    case 'pct_up':
      text = tpl(T.notification_pct_up, {
        pair: pairStr,
        pct: `+${alert.condition.value}%`,
        price: priceStr,
      });
      break;
    case 'pct_down':
      text = tpl(T.notification_pct_down, {
        pair: pairStr,
        pct: `−${alert.condition.value}%`,
        price: priceStr,
      });
      break;
    case 'daily_digest':
      return;
  }
  await bot.api.sendMessage(alert.userId, text, { parse_mode: 'HTML' });
}

async function tryFireDailyDigest(bot: Bot<BotCtx>, alert: Alert, user: UserPrefs): Promise<boolean> {
  if (alert.condition.type !== 'daily_digest') return false;
  const { hour, minute, scope } = alert.condition;
  const now = localParts(user.tz);
  if (alert.lastTriggeredYmd === now.ymd) return false;

  const nowMin = now.hour * 60 + now.minute;
  const schedMin = hour * 60 + minute;
  const delta = nowMin - schedMin;
  if (delta < 0 || delta >= DIGEST_TRIGGER_WINDOW_MIN) return false;

  const text = scope === 'pair'
    ? await buildPairDigestText(alert, user)
    : await buildWatchlistDigestText(user);

  if (!text) return false;

  await bot.api.sendMessage(alert.userId, text, { parse_mode: 'HTML' });
  alert.lastTriggeredYmd = now.ymd;
  alert.triggeredAt = Date.now();
  await updateAlert(alert);
  return true;
}

function yesterdayYmd(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function buildPairDigestText(alert: Alert, user: UserPrefs): Promise<string | null> {
  const baseCur = CURRENCY_BY_CODE[alert.base];
  const targetCur = CURRENCY_BY_CODE[alert.target];
  if (!baseCur || !targetCur) return null;
  const D = t(user.lang).digest;

  const latest = await getLatestRates(alert.base).catch(() => null);
  if (!latest) return null;
  const current = latest.rates[alert.target];
  if (typeof current !== 'number') return null;

  let prev: number | undefined;
  try {
    const yest = await getRateForDate(alert.base, yesterdayYmd());
    const v = yest.rates[alert.target];
    if (typeof v === 'number') prev = v;
  } catch { /* ignore */ }

  const pair = `${baseCur.iso}/${targetCur.iso}`;
  const priceStr = `${targetCur.symbol}${formatRate(current, user.lang)}`;
  const change = prev ? ((current - prev) / prev) * 100 : null;
  const changeStr = change !== null ? formatPercent(change, user.lang) : '—';
  const prevStr = prev ? `${targetCur.symbol}${formatRate(prev, user.lang)}` : '—';

  return tpl(D.pair, { pair, price: priceStr, change: changeStr, prev: prevStr });
}

async function buildWatchlistDigestText(user: UserPrefs): Promise<string | null> {
  const D = t(user.lang).digest;
  const base = user.defaultBase;
  const baseCur = CURRENCY_BY_CODE[base];
  if (!baseCur) return null;
  const targets = user.watchlist.filter((c) => c !== base && CURRENCY_BY_CODE[c]);
  if (targets.length === 0) return null;

  const latest = await getLatestRates(base).catch(() => null);
  if (!latest) return null;
  const yest = await getRateForDate(base, yesterdayYmd()).catch(() => null);

  const rows = targets.map((code) => {
    const cur = CURRENCY_BY_CODE[code];
    const now = latest.rates[code];
    const prev = yest?.rates[code];
    if (typeof now !== 'number') return `${cur.flag} <b>${cur.iso}</b> —`;
    const nowStr = `${cur.symbol}${formatRate(now, user.lang)}`;
    if (typeof prev !== 'number') return `${cur.flag} <b>${cur.iso}</b>: ${nowStr}`;
    const pct = ((now - prev) / prev) * 100;
    return `${cur.flag} <b>${cur.iso}</b>: ${nowStr}  ${formatPercent(pct, user.lang)}`;
  });

  return `${tpl(D.watchlist, { base: baseCur.iso })}\n\n${rows.join('\n')}`;
}
