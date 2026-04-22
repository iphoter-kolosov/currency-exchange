import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { handleConvertText } from './convert.ts';
import { handleWatchAdd, handleWatchBase, handleSingleCurrencyAsBase } from './watch.ts';
import { handleChartPair } from './chart.ts';
import { handleAlertsPair, handleAlertsValue } from './alerts.ts';

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
  });
}
