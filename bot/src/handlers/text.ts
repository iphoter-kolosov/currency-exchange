import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { handleConvertText } from './convert.ts';
import { handleWatchAdd, handleWatchBase, handleSingleCurrencyAsBase } from './watch.ts';
import { handleChartPair, sendChart } from './chart.ts';
import { handleAlertsPair, handleAlertsValue } from './alerts.ts';
import { resolveIntent, type Intent } from '../services/ai.ts';
import { findCurrency } from '../data/currencies.ts';
import type { Timeframe } from '../services/dates.ts';

async function handleAiFallback(ctx: BotCtx, text: string): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;
  if (ctx.session.mode) return false;

  const intent = await resolveIntent(text, ctx.lang, userId);
  if (!intent) return false;
  await runIntent(ctx, intent);
  return true;
}

async function runIntent(ctx: BotCtx, intent: Intent): Promise<void> {
  switch (intent.action) {
    case 'convert': {
      const synth = `${intent.amount} ${intent.from} ${intent.to}`;
      await handleConvertText(ctx, synth);
      return;
    }
    case 'rate': {
      const synth = `${intent.from} ${intent.to}`;
      await handleConvertText(ctx, synth);
      return;
    }
    case 'watch': {
      const cur = findCurrency(intent.base);
      if (!cur) return;
      await handleSingleCurrencyAsBase(ctx, cur.code);
      return;
    }
    case 'chart': {
      const from = findCurrency(intent.from);
      const to = findCurrency(intent.to);
      if (!from || !to) return;
      await sendChart(ctx, from.code, to.code, intent.tf as Timeframe);
      return;
    }
    case 'chat': {
      await ctx.reply(intent.reply, { parse_mode: 'HTML' }).catch(() =>
        ctx.reply(intent.reply)
      );
      return;
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

    if (await handleConvertText(ctx, text)) return;
    if (await handleSingleCurrencyAsBase(ctx, text)) return;

    await handleAiFallback(ctx, text);
  });
}
