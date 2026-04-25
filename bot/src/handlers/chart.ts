import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { parseChartCommand } from '../services/parser.ts';
import { fetchSeries, buildChartUrl } from '../services/chart.ts';
import { findCurrency, CURRENCY_BY_CODE } from '../data/currencies.ts';
import type { Timeframe } from '../services/dates.ts';
import { formatPercent, formatRate } from '../services/format.ts';
import { t, tpl } from '../i18n/index.ts';
import { cancelKb, timeframeKeyboard } from '../keyboards.ts';
import { replyError, withTyping } from './_error.ts';

export function registerChart(bot: Bot<BotCtx>): void {
  bot.command('chart', async (ctx) => {
    const args = ctx.match?.toString() ?? '';
    const parsed = parseChartCommand(args);
    if (!parsed) {
      ctx.session.mode = { type: 'chart:pair' };
      await ctx.reply(t(ctx.lang).chart.pick_pair, {
        parse_mode: 'HTML',
        reply_markup: cancelKb(ctx.lang),
      });
      return;
    }
    await sendChart(ctx, parsed.base.code, parsed.target.code, parsed.tf as Timeframe);
  });

  bot.callbackQuery('menu:chart', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = { type: 'chart:pair' };
    await ctx.editMessageText(t(ctx.lang).chart.pick_pair, {
      parse_mode: 'HTML',
      reply_markup: cancelKb(ctx.lang),
    });
  });

  bot.callbackQuery(/^chart:tf:([^:]+):([^:]+):([^:]+)$/, async (ctx) => {
    const base = ctx.match[1];
    const target = ctx.match[2];
    const tf = ctx.match[3] as Timeframe;
    await ctx.answerCallbackQuery();
    await sendChart(ctx, base, target, tf);
  });

  bot.callbackQuery(/^chart:swap:([^:]+):([^:]+):([^:]+)$/, async (ctx) => {
    const base = ctx.match[2];
    const target = ctx.match[1];
    const tf = ctx.match[3] as Timeframe;
    await ctx.answerCallbackQuery();
    await sendChart(ctx, base, target, tf);
  });
}

export async function handleChartPair(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'chart:pair') return false;
  try {
    const parts = text.trim().toLowerCase().split(/\s+/);
    if (parts.length < 2) {
      await ctx.reply(t(ctx.lang).chart.pick_pair, {
        parse_mode: 'HTML',
        reply_markup: cancelKb(ctx.lang),
      });
      return true;
    }
    const base = findCurrency(parts[0]);
    const target = findCurrency(parts[1]);
    if (!base || !target) {
      await ctx.reply(tpl(t(ctx.lang).common.unknown_currency, { q: text }), {
        parse_mode: 'HTML',
        reply_markup: cancelKb(ctx.lang),
      });
      return true;
    }
    ctx.session.mode = undefined;
    await sendChart(ctx, base.code, target.code, '1M');
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, `rendering chart for "${text}"`);
    return true;
  }
}

export async function sendChart(
  ctx: BotCtx,
  base: string,
  target: string,
  tf: Timeframe,
): Promise<void> {
  const baseCur = CURRENCY_BY_CODE[base];
  const targetCur = CURRENCY_BY_CODE[target];
  if (!baseCur || !targetCur) {
    await ctx.reply(t(ctx.lang).common.error);
    return;
  }
  const canEdit = Boolean(ctx.callbackQuery?.message?.photo);
  try {
    if (!canEdit) ctx.replyWithChatAction('upload_photo').catch(() => {});
    const series = await fetchSeries(base, target, tf);
    if (series.length < 2) {
      await ctx.reply(t(ctx.lang).chart.no_data);
      return;
    }
    const last = series[series.length - 1].rate;
    const first = series[0].rate;
    const pct = ((last - first) / first) * 100;
    const C = t(ctx.lang).chart;
    const caption = [
      tpl(C.title, { base: baseCur.iso, target: targetCur.iso, tf }),
      tpl(C.current, {
        price: `${targetCur.symbol}${formatRate(last, ctx.lang)}`,
        pct: formatPercent(pct, ctx.lang),
      }),
    ].join('\n\n');

    const url = buildChartUrl(series, base, target, tf);
    const keyboard = timeframeKeyboard(ctx.lang, base, target, tf);

    if (canEdit) {
      try {
        await ctx.editMessageMedia(
          { type: 'photo', media: url, caption, parse_mode: 'HTML' },
          { reply_markup: keyboard },
        );
        return;
      } catch (e) {
        console.warn('editMessageMedia failed, falling back to reply', e instanceof Error ? e.message : e);
      }
    }

    await ctx.replyWithPhoto(url, {
      caption,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (e) {
    await replyError(ctx, e, `loading ${baseCur.iso}/${targetCur.iso} chart for ${tf}`);
  }
}
