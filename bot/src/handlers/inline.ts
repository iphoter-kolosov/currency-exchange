import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { parseInput } from '../services/parser.ts';
import { convert } from '../services/rates.ts';
import { formatAmount, formatRate } from '../services/format.ts';

export function registerInline(bot: Bot<BotCtx>): void {
  bot.on('inline_query', async (ctx) => {
    const q = ctx.inlineQuery.query.trim();
    if (!q) {
      await ctx.answerInlineQuery([], {
        cache_time: 10,
        button: { text: 'Open bot for examples', start_parameter: 'from_inline' },
      });
      return;
    }

    const parsed = parseInput(q);
    if (parsed.kind === 'unknown') {
      await ctx.answerInlineQuery([], { cache_time: 5 });
      return;
    }

    const lang = ctx.lang ?? 'en';
    const amount = parsed.kind === 'convert' ? parsed.amount : 1;
    try {
      const result = await convert(amount, parsed.from.code, parsed.to.code);
      const title = `${formatAmount(amount, parsed.from, lang)} ${parsed.from.iso} = ${formatAmount(result.value, parsed.to, lang)} ${parsed.to.iso}`;
      const description = `1 ${parsed.from.iso} = ${formatRate(result.rate, lang)} ${parsed.to.iso} · ${result.date}`;
      const messageText = `<b>${title}</b>\n${description}`;
      await ctx.answerInlineQuery([{
        type: 'article',
        id: `${parsed.from.code}-${parsed.to.code}-${amount}`,
        title,
        description,
        input_message_content: { message_text: messageText, parse_mode: 'HTML' },
      }], {
        cache_time: 30,
      });
    } catch {
      await ctx.answerInlineQuery([], { cache_time: 5 });
    }
  });
}
