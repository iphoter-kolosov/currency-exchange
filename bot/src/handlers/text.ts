import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { handleConvertText } from './convert.ts';
import { handleWatchAdd, handleWatchBase, handleSingleCurrencyAsBase } from './watch.ts';
import { handleChartPair, sendChart } from './chart.ts';
import { handleAlertsPair, handleAlertsValue, handleDigestPair, handleDigestTime } from './alerts.ts';
import { resolveIntent, type Intent } from '../services/ai.ts';
import { appendContext, createAlert, getContext, newId, type Alert } from '../services/storage.ts';
import { findCurrency } from '../data/currencies.ts';
import type { Timeframe } from '../services/dates.ts';
import { tzLabel } from '../services/timezones.ts';
import { t } from '../i18n/index.ts';

async function handleAiFallback(ctx: BotCtx, text: string): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;
  if (ctx.session.mode) return false;

  const history = await getContext(userId).catch(() => []);
  const intent = await resolveIntent(text, ctx.lang, userId, history);
  if (!intent) return false;
  const trace = await runIntent(ctx, intent);
  if (trace) await appendContext(userId, text, trace).catch(() => {});
  return true;
}

async function runIntent(ctx: BotCtx, intent: Intent): Promise<string | null> {
  switch (intent.action) {
    case 'convert': {
      const synth = `${intent.amount} ${intent.from} ${intent.to}`;
      await handleConvertText(ctx, synth);
      return `Converted ${intent.amount} ${intent.from.toUpperCase()} to ${intent.to.toUpperCase()}`;
    }
    case 'rate': {
      const synth = `${intent.from} ${intent.to}`;
      await handleConvertText(ctx, synth);
      return `Showed current rate ${intent.from.toUpperCase()}/${intent.to.toUpperCase()}`;
    }
    case 'watch': {
      const cur = findCurrency(intent.base);
      if (!cur) return null;
      await handleSingleCurrencyAsBase(ctx, cur.code);
      return `Showed watchlist with base ${cur.iso}`;
    }
    case 'chart': {
      const from = findCurrency(intent.from);
      const to = findCurrency(intent.to);
      if (!from || !to) return null;
      const tf = intent.tf as Timeframe;
      await sendChart(ctx, from.code, to.code, tf);
      return `Opened ${from.iso}/${to.iso} chart at ${tf}`;
    }
    case 'daily_digest': {
      if (!ctx.from) return null;
      let base = 'all';
      let target = 'all';
      if (intent.scope === 'pair') {
        const from = intent.from ? findCurrency(intent.from) : null;
        const to = intent.to ? findCurrency(intent.to) : null;
        if (!from || !to) return null;
        base = from.code;
        target = to.code;
      }
      const alert: Alert = {
        id: newId(),
        userId: ctx.from.id,
        base,
        target,
        condition: {
          type: 'daily_digest',
          hour: intent.hour,
          minute: intent.minute,
          scope: intent.scope,
        },
        createdAt: Date.now(),
        active: true,
      };
      await createAlert(alert);
      const D = t(ctx.lang).digest;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const time = `${pad(intent.hour)}:${pad(intent.minute)}`;
      const tz = tzLabel(ctx.user.tz, ctx.lang);
      const msg = intent.scope === 'pair'
        ? D.created_pair(`${base.toUpperCase()}/${target.toUpperCase()}`, time, tz)
        : D.created_watchlist(time, tz);
      await ctx.reply(msg, { parse_mode: 'HTML' });
      return intent.scope === 'pair'
        ? `Scheduled daily ${base.toUpperCase()}/${target.toUpperCase()} digest at ${time} ${tz}`
        : `Scheduled daily watchlist digest at ${time} ${tz}`;
    }
    case 'chat': {
      await ctx.reply(intent.reply, { parse_mode: 'HTML' }).catch(() =>
        ctx.reply(intent.reply)
      );
      return intent.reply;
    }
  }
}

export function registerText(bot: Bot<BotCtx>): void {
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    if (await handleWatchAdd(ctx, text)) return;
    if (await handleWatchBase(ctx, text)) return;
    if (await handleChartPair(ctx, text)) return;
    if (await handleAlertsPair(ctx, text)) return;
    if (await handleAlertsValue(ctx, text)) return;
    if (await handleDigestPair(ctx, text)) return;
    if (await handleDigestTime(ctx, text)) return;

    if (await handleConvertText(ctx, text)) return;
    if (await handleSingleCurrencyAsBase(ctx, text)) return;

    await handleAiFallback(ctx, text);
  });
}
