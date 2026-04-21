import type { Bot } from 'grammy';
import type { BotCtx } from './bot.ts';
import { iterateAllAlerts, updateAlert, getUser, type Alert } from './services/storage.ts';
import { getLatestRates } from './services/rates.ts';
import { CURRENCY_BY_CODE } from './data/currencies.ts';
import { t } from './i18n/index.ts';
import { formatRate } from './services/format.ts';

const MIN_RE_TRIGGER_MS = 60 * 60 * 1000;

export async function checkAlerts(bot: Bot<BotCtx>): Promise<{ checked: number; fired: number }> {
  let checked = 0;
  let fired = 0;
  const baseToRates = new Map<string, { rates: Record<string, number>; date: string }>();

  for await (const alert of iterateAllAlerts()) {
    if (!alert.active) continue;
    checked++;

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
      await sendAlert(bot, alert, currentRate);
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
    case 'above': return currentRate > alert.condition.value;
    case 'below': return currentRate < alert.condition.value;
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
  }
}

async function sendAlert(
  bot: Bot<BotCtx>,
  alert: Alert,
  rate: number,
): Promise<void> {
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
      text = T.notification_above(pairStr, priceStr, String(alert.condition.value));
      break;
    case 'below':
      text = T.notification_below(pairStr, priceStr, String(alert.condition.value));
      break;
    case 'pct_up':
      text = T.notification_pct_up(pairStr, `+${alert.condition.value}%`, priceStr);
      break;
    case 'pct_down':
      text = T.notification_pct_down(pairStr, `−${alert.condition.value}%`, priceStr);
      break;
  }
  await bot.api.sendMessage(alert.userId, text, { parse_mode: 'HTML' });
}
