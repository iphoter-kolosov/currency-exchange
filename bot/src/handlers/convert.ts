import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { parseInput } from '../services/parser.ts';
import { convert } from '../services/rates.ts';
import { formatAmount, formatRate } from '../services/format.ts';
import { t } from '../i18n/index.ts';

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
  const parsed = parseInput(raw);
  if (parsed.kind === 'unknown') return false;
  const C = t(ctx.lang).convert;
  const amount = parsed.kind === 'convert' ? parsed.amount : 1;
  try {
    const result = await convert(amount, parsed.from.code, parsed.to.code);
    const msg = C.result(
      formatAmount(amount, parsed.from, ctx.lang),
      parsed.from.iso,
      formatAmount(result.value, parsed.to, ctx.lang),
      parsed.to.iso,
      formatRate(result.rate, ctx.lang),
      result.date,
    );
    await ctx.reply(msg, { parse_mode: 'HTML' });
    return true;
  } catch (e) {
    console.error('convert failed', e);
    await ctx.reply(t(ctx.lang).common.error);
    return true;
  }
}
