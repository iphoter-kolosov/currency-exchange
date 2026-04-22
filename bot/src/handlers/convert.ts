import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { parseInput } from '../services/parser.ts';
import { convert, getRateForDate } from '../services/rates.ts';
import { formatAmount, formatRate } from '../services/format.ts';
import { CURRENCY_BY_CODE } from '../data/currencies.ts';
import { showWatchAs } from './watch.ts';
import { t, tpl } from '../i18n/index.ts';
import { replyError, withTyping } from './_error.ts';

export function registerConvert(bot: Bot<BotCtx>): void {
  bot.command('convert', async (ctx) => {
    const C = t(ctx.lang).convert;
    const raw = ctx.match?.toString().trim() ?? '';
    if (!raw) {
      await ctx.reply(C.prompt, { parse_mode: 'HTML' });
      return;
    }
    await handleConvertText(ctx, raw);
  });

  bot.callbackQuery('menu:convert', async (ctx) => {
    await ctx.answerCallbackQuery();
    const C = t(ctx.lang).convert;
    await ctx.editMessageText(C.prompt, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: t(ctx.lang).common.back, callback_data: 'menu:home' }]] },
    });
  });
}

export async function handleConvertText(ctx: BotCtx, raw: string): Promise<boolean> {
  const defaultBase = CURRENCY_BY_CODE[ctx.user.defaultBase] ?? null;
  const parsed = parseInput(raw, { tz: ctx.user.tz, defaultBase });
  if (parsed.kind === 'unknown') return false;
  const C = t(ctx.lang).convert;

  if (parsed.kind === 'watch') {
    return showWatchAs(ctx, parsed.base);
  }

  if (parsed.kind === 'historical') {
    try {
      const payload = await withTyping(ctx, () => getRateForDate(parsed.from.code, parsed.date));
      const rate = parsed.to.code === parsed.from.code ? 1 : payload.rates[parsed.to.code];
      if (typeof rate !== 'number') {
        const msg = ctx.lang === 'ru'
          ? `Нет данных по <b>${parsed.from.iso}/${parsed.to.iso}</b> на <code>${parsed.date}</code>.`
          : `No data for <b>${parsed.from.iso}/${parsed.to.iso}</b> on <code>${parsed.date}</code>.`;
        await ctx.reply(msg, { parse_mode: 'HTML' });
        return true;
      }
      const msg = tpl(C.result, {
        amount: formatAmount(1, parsed.from, ctx.lang),
        from: parsed.from.iso,
        value: formatAmount(rate, parsed.to, ctx.lang),
        to: parsed.to.iso,
        rate: formatRate(rate, ctx.lang),
        date: payload.date,
      });
      await ctx.reply(msg, { parse_mode: 'HTML' });
      return true;
    } catch (e) {
      await replyError(ctx, e, `historical ${parsed.from.iso}/${parsed.to.iso} on ${parsed.date}`);
      return true;
    }
  }

  // convert + rate
  const amount = parsed.kind === 'convert' ? parsed.amount : 1;
  try {
    const result = await withTyping(ctx, () => convert(amount, parsed.from.code, parsed.to.code));
    const msg = tpl(C.result, {
      amount: formatAmount(amount, parsed.from, ctx.lang),
      from: parsed.from.iso,
      value: formatAmount(result.value, parsed.to, ctx.lang),
      to: parsed.to.iso,
      rate: formatRate(result.rate, ctx.lang),
      date: result.date,
    });
    await ctx.reply(msg, { parse_mode: 'HTML' });
    return true;
  } catch (e) {
    await replyError(ctx, e, `converting ${amount} ${parsed.from.iso} to ${parsed.to.iso}`);
    return true;
  }
}
