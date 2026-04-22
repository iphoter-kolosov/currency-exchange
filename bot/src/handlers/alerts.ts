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
import { t, tpl } from '../i18n/index.ts';
import { alertsMenu, alertTypeMenu, digestScopeMenu, digestTimeMenu } from '../keyboards.ts';
import { tzLabel } from '../services/timezones.ts';
import { formatRate } from '../services/format.ts';
import { replyError, withTyping } from './_error.ts';

export const FREE_ALERT_LIMIT = 5;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function labelForAlert(a: Alert, lang: 'ru' | 'en'): string {
  const pair = `${a.base.toUpperCase()}/${a.target.toUpperCase()}`;
  switch (a.condition.type) {
    case 'above': return `${pair} > ${a.condition.value}`;
    case 'below': return `${pair} < ${a.condition.value}`;
    case 'pct_up': return `${pair} +${a.condition.value}% / 24h`;
    case 'pct_down': return `${pair} −${a.condition.value}% / 24h`;
    case 'daily_digest': {
      const time = `${pad2(a.condition.hour)}:${pad2(a.condition.minute)}`;
      const D = t(lang).digest;
      return a.condition.scope === 'pair'
        ? tpl(D.label_pair, { pair, time })
        : tpl(D.label_watchlist, { time });
    }
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
    case 'daily_digest': return labelForAlert(a, lang);
  }
}

export async function showAlertList(ctx: BotCtx, edit = false): Promise<void> {
  if (!ctx.from) return;
  const T = t(ctx.lang).alerts;
  const alerts = await listAlerts(ctx.from.id);
  const activeAlerts = alerts.filter((a) => a.active);
  const text = activeAlerts.length === 0
    ? `${T.list_title}\n\n${T.list_empty}`
    : `${T.list_title}\n\n` + activeAlerts.map((a) => `• ${summaryLine(a, ctx.lang)}`).join('\n');
  const kb = alertsMenu(ctx.lang, activeAlerts.map((a) => ({ id: a.id, label: labelForAlert(a, ctx.lang) })));
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
      await ctx.reply(tpl(t(ctx.lang).alerts.limit_reached, { limit: FREE_ALERT_LIMIT }));
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
    await ctx.reply(tpl(T.enter_value, {
      pair: `${base.toUpperCase()}/${target.toUpperCase()}`,
      type: typeLabel,
      hint,
    }), { parse_mode: 'HTML' });
  });

  bot.callbackQuery(/^alerts:del:(.+)$/, async (ctx) => {
    if (!ctx.from) return;
    const id = ctx.match[1];
    await deleteAlert(ctx.from.id, id);
    await ctx.answerCallbackQuery({ text: t(ctx.lang).alerts.deleted });
    await showAlertList(ctx, true);
  });

  bot.callbackQuery('digest:new', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const active = await countActiveAlerts(ctx.from.id);
    if (active >= FREE_ALERT_LIMIT) {
      await ctx.reply(tpl(t(ctx.lang).alerts.limit_reached, { limit: FREE_ALERT_LIMIT }));
      return;
    }
    const D = t(ctx.lang).digest;
    await ctx.editMessageText(D.pick_scope, {
      parse_mode: 'HTML',
      reply_markup: digestScopeMenu(ctx.lang),
    });
  });

  bot.callbackQuery(/^digest:scope:(pair|watchlist)$/, async (ctx) => {
    const scope = ctx.match[1] as 'pair' | 'watchlist';
    await ctx.answerCallbackQuery();
    const D = t(ctx.lang).digest;
    if (scope === 'pair') {
      ctx.session.mode = { type: 'digest:pair' };
      await ctx.editMessageText(D.pick_pair, { parse_mode: 'HTML' });
      return;
    }
    ctx.session.mode = { type: 'digest:time', scope: 'watchlist', base: 'all', target: 'all' };
    await ctx.editMessageText(
      `${tpl(D.pick_time, { tz: tzLabel(ctx.user.tz, ctx.lang) })}\n<i>${D.pick_time_custom}</i>`,
      { parse_mode: 'HTML', reply_markup: digestTimeMenu(ctx.lang, 'watchlist', 'all-all') },
    );
  });

  bot.callbackQuery(/^digest:time:(pair|watchlist):([^:]+):(\d{2}):(\d{2})$/, async (ctx) => {
    if (!ctx.from) return;
    const scope = ctx.match[1] as 'pair' | 'watchlist';
    const pairRaw = ctx.match[2];
    const hour = parseInt(ctx.match[3], 10);
    const minute = parseInt(ctx.match[4], 10);
    await ctx.answerCallbackQuery();
    const [base, target] = pairRaw.split('-');
    await finalizeDigest(ctx, scope, base, target, hour, minute);
  });
}

async function finalizeDigest(
  ctx: BotCtx,
  scope: 'pair' | 'watchlist',
  base: string,
  target: string,
  hour: number,
  minute: number,
): Promise<void> {
  if (!ctx.from) return;
  try {
    const alert: Alert = {
      id: newId(),
      userId: ctx.from.id,
      base: scope === 'pair' ? base : 'all',
      target: scope === 'pair' ? target : 'all',
      condition: { type: 'daily_digest', hour, minute, scope },
      createdAt: Date.now(),
      active: true,
    };
    await createAlert(alert);
    ctx.session.mode = undefined;
    const D = t(ctx.lang).digest;
    const time = `${pad2(hour)}:${pad2(minute)}`;
    const tz = tzLabel(ctx.user.tz, ctx.lang);
    const msg = scope === 'pair'
      ? tpl(D.created_pair, { pair: `${base.toUpperCase()}/${target.toUpperCase()}`, time, tz })
      : tpl(D.created_watchlist, { time, tz });
    await ctx.reply(msg, { parse_mode: 'HTML' });
    await showAlertList(ctx);
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, `creating daily digest ${scope}`);
  }
}

export async function handleDigestPair(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'digest:pair') return false;
  try {
    const parts = text.trim().toLowerCase().split(/\s+/);
    if (parts.length < 2) {
      await ctx.reply(t(ctx.lang).digest.pick_pair, { parse_mode: 'HTML' });
      return true;
    }
    const base = findCurrency(parts[0]);
    const target = findCurrency(parts[1]);
    if (!base || !target) {
      await ctx.reply(tpl(t(ctx.lang).common.unknown_currency, { q: text }), { parse_mode: 'HTML' });
      return true;
    }
    ctx.session.mode = {
      type: 'digest:time',
      scope: 'pair',
      base: base.code,
      target: target.code,
    };
    const D = t(ctx.lang).digest;
    await ctx.reply(
      `${tpl(D.pick_time, { tz: tzLabel(ctx.user.tz, ctx.lang) })}\n<i>${D.pick_time_custom}</i>`,
      {
        parse_mode: 'HTML',
        reply_markup: digestTimeMenu(ctx.lang, 'pair', `${base.code}-${target.code}`),
      },
    );
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, 'picking pair for digest');
    return true;
  }
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export async function handleDigestTime(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'digest:time') return false;
  const mode = ctx.session.mode;
  try {
    const m = text.trim().match(TIME_RE);
    if (!m) {
      await ctx.reply(t(ctx.lang).digest.time_invalid, { parse_mode: 'HTML' });
      return true;
    }
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    await finalizeDigest(ctx, mode.scope, mode.base, mode.target, hour, minute);
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, 'setting digest time');
    return true;
  }
}

export async function handleAlertsPair(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'alerts:pair') return false;
  try {
    const parts = text.trim().toLowerCase().split(/\s+/);
    if (parts.length < 2) {
      await ctx.reply(t(ctx.lang).alerts.pick_pair, { parse_mode: 'HTML' });
      return true;
    }
    const base = findCurrency(parts[0]);
    const target = findCurrency(parts[1]);
    if (!base || !target) {
      await ctx.reply(tpl(t(ctx.lang).common.unknown_currency, { q: text }), { parse_mode: 'HTML' });
      return true;
    }
    ctx.session.mode = undefined;
    const T = t(ctx.lang).alerts;
    await ctx.reply(T.pick_type, {
      reply_markup: alertTypeMenu(ctx.lang, base.code, target.code),
    });
    return true;
  } catch (e) {
    await replyError(ctx, e, 'creating alert: picking pair');
    return true;
  }
}

export async function handleAlertsValue(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'alerts:value') return false;
  const mode = ctx.session.mode;
  try {
    const raw = text.trim().replace(',', '.').replace('%', '');
    const val = Number(raw);
    if (!isFinite(val) || val <= 0) {
      const msg = ctx.lang === 'ru'
        ? `Не получилось прочитать число из «${text}». Пришли просто число, например 1.15 или 2.`
        : `I couldn't read a number from "${text}". Send a plain number like 1.15 or 2.`;
      await ctx.reply(msg);
      return true;
    }
    if (!ctx.from) return true;

    let baseline: number | undefined;
    if (mode.condType === 'pct_up' || mode.condType === 'pct_down') {
      try {
        const res = await withTyping(ctx, () => convert(1, mode.base, mode.target));
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
    const nowLine = baseline
      ? `\n<i>${ctx.lang === 'ru' ? 'Сейчас' : 'Now'}: ${formatRate(baseline, ctx.lang)}</i>`
      : '';
    await ctx.reply(`${tpl(t(ctx.lang).alerts.created, { summary })}${nowLine}`, { parse_mode: 'HTML' });
    await showAlertList(ctx);
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, `creating alert ${mode.base}/${mode.target} ${mode.condType}`);
    return true;
  }
}
