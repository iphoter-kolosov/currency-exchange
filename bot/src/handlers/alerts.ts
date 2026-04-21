import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import {
  createAlert,
  deleteAlert,
  countActiveAlerts,
  listAlerts,
  newId,
  type Alert,
  type AlertCondition,
} from '../services/storage.ts';
import { CURRENCY_BY_CODE, findCurrency } from '../data/currencies.ts';
import { convert } from '../services/rates.ts';
import { t } from '../i18n/index.ts';
import { alertsMenu, alertTypeMenu } from '../keyboards.ts';
import { formatRate } from '../services/format.ts';

export const FREE_ALERT_LIMIT = 5;

function labelForAlert(a: Alert): string {
  const pair = `${a.base.toUpperCase()}/${a.target.toUpperCase()}`;
  switch (a.condition.type) {
    case 'above': return `${pair} > ${a.condition.value}`;
    case 'below': return `${pair} < ${a.condition.value}`;
    case 'pct_up': return `${pair} +${a.condition.value}% / 24h`;
    case 'pct_down': return `${pair} −${a.condition.value}% / 24h`;
  }
}

function summaryLine(a: Alert, lang: 'ru' | 'en'): string {
  const pair = `${a.base.toUpperCase()}/${a.target.toUpperCase()}`;
  const T = t(lang).alerts;
  switch (a.condition.type) {
    case 'above': return `${pair}  ${T.type_above}: ${a.condition.value}`;
    case 'below': return `${pair}  ${T.type_below}: ${a.condition.value}`;
    case 'pct_up': return `${pair}  ${T.type_pct_up}: ${a.condition.value}%`;
    case 'pct_down': return `${pair}  ${T.type_pct_down}: ${a.condition.value}%`;
  }
}

async function showAlertList(ctx: BotCtx, edit = false): Promise<void> {
  if (!ctx.from) return;
  const T = t(ctx.lang).alerts;
  const alerts = await listAlerts(ctx.from.id);
  const activeAlerts = alerts.filter((a) => a.active);
  const text = activeAlerts.length === 0
    ? `${T.list_title}\n\n${T.list_empty}`
    : `${T.list_title}\n\n` + activeAlerts.map((a) => `• ${summaryLine(a, ctx.lang)}`).join('\n');
  const kb = alertsMenu(ctx.lang, activeAlerts.map((a) => ({ id: a.id, label: labelForAlert(a) })));
  if (edit) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() =>
      ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb })
    );
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

export function registerAlerts(bot: Bot<BotCtx>): void {
  bot.command('alerts', async (ctx) => {
    await showAlertList(ctx);
  });

  bot.command('alert', async (ctx) => {
    ctx.session.mode = { type: 'alerts:pair' };
    await ctx.reply(t(ctx.lang).alerts.pick_pair, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('menu:alerts', async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAlertList(ctx, true);
  });

  bot.callbackQuery('alerts:new', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const active = await countActiveAlerts(ctx.from.id);
    if (active >= FREE_ALERT_LIMIT) {
      await ctx.reply(t(ctx.lang).alerts.limit_reached(FREE_ALERT_LIMIT));
      return;
    }
    ctx.session.mode = { type: 'alerts:pair' };
    await ctx.reply(t(ctx.lang).alerts.pick_pair, { parse_mode: 'HTML' });
  });

  bot.callbackQuery(/^alerts:type:(above|below|pct_up|pct_down):([^:]+):([^:]+)$/, async (ctx) => {
    const condType = ctx.match[1] as 'above' | 'below' | 'pct_up' | 'pct_down';
    const base = ctx.match[2];
    const target = ctx.match[3];
    await ctx.answerCallbackQuery();
    ctx.session.mode = { type: 'alerts:value', base, target, condType };
    const T = t(ctx.lang).alerts;
    const typeLabel = condType === 'above' ? T.type_above
      : condType === 'below' ? T.type_below
      : condType === 'pct_up' ? T.type_pct_up
      : T.type_pct_down;
    const hint = condType === 'above' || condType === 'below' ? T.hint_price : T.hint_percent;
    await ctx.reply(T.enter_value(`${base.toUpperCase()}/${target.toUpperCase()}`, typeLabel, hint), {
      parse_mode: 'HTML',
    });
  });

  bot.callbackQuery(/^alerts:del:(.+)$/, async (ctx) => {
    if (!ctx.from) return;
    const id = ctx.match[1];
    await deleteAlert(ctx.from.id, id);
    await ctx.answerCallbackQuery({ text: t(ctx.lang).alerts.deleted });
    await showAlertList(ctx, true);
  });
}

export async function handleAlertsPair(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'alerts:pair') return false;
  const parts = text.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) {
    await ctx.reply(t(ctx.lang).alerts.pick_pair, { parse_mode: 'HTML' });
    return true;
  }
  const base = findCurrency(parts[0]);
  const target = findCurrency(parts[1]);
  if (!base || !target) {
    await ctx.reply(t(ctx.lang).common.unknown_currency(text), { parse_mode: 'HTML' });
    return true;
  }
  ctx.session.mode = undefined;
  const T = t(ctx.lang).alerts;
  await ctx.reply(T.pick_type, {
    reply_markup: alertTypeMenu(ctx.lang, base.code, target.code),
  });
  return true;
}

export async function handleAlertsValue(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'alerts:value') return false;
  const mode = ctx.session.mode;
  const raw = text.trim().replace(',', '.').replace('%', '');
  const val = Number(raw);
  if (!isFinite(val) || val <= 0) {
    await ctx.reply(t(ctx.lang).alerts.pick_type);
    return true;
  }
  if (!ctx.from) return true;

  let baseline: number | undefined;
  if (mode.condType === 'pct_up' || mode.condType === 'pct_down') {
    try {
      const res = await convert(1, mode.base, mode.target);
      baseline = res.rate;
    } catch {
      baseline = undefined;
    }
  }

  let condition: AlertCondition;
  if (mode.condType === 'above') condition = { type: 'above', value: val };
  else if (mode.condType === 'below') condition = { type: 'below', value: val };
  else if (mode.condType === 'pct_up') condition = { type: 'pct_up', value: val, windowHours: 24 };
  else condition = { type: 'pct_down', value: val, windowHours: 24 };

  const alert: Alert = {
    id: newId(),
    userId: ctx.from.id,
    base: mode.base,
    target: mode.target,
    condition,
    createdAt: Date.now(),
    active: true,
    baseline,
  };
  await createAlert(alert);
  ctx.session.mode = undefined;

  const baseCur = CURRENCY_BY_CODE[mode.base];
  const targetCur = CURRENCY_BY_CODE[mode.target];
  if (!baseCur || !targetCur) {
    await ctx.reply(t(ctx.lang).common.error);
    return true;
  }
  const summary = summaryLine(alert, ctx.lang);
  const now = baseline
    ? `\n<i>Сейчас: ${formatRate(baseline, ctx.lang)}</i>`
    : '';
  await ctx.reply(`${t(ctx.lang).alerts.created(summary)}${now}`, { parse_mode: 'HTML' });
  await showAlertList(ctx);
  return true;
}
