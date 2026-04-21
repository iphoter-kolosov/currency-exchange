import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { t } from '../i18n/index.ts';
import { mainMenu } from '../keyboards.ts';

export function registerStart(bot: Bot<BotCtx>): void {
  bot.command('start', async (ctx) => {
    const T = t(ctx.lang).start;
    const name = ctx.from?.first_name ?? 'there';
    await ctx.reply(T.greeting(name), {
      parse_mode: 'HTML',
      reply_markup: mainMenu(ctx.lang),
    });
  });

  bot.command('help', async (ctx) => {
    const H = t(ctx.lang).help;
    const me = await ctx.api.getMe();
    await ctx.reply(H.text.replaceAll('{username}', me.username ?? 'bot'), {
      parse_mode: 'HTML',
    });
  });

  bot.callbackQuery('menu:help', async (ctx) => {
    await ctx.answerCallbackQuery();
    const H = t(ctx.lang).help;
    const me = await ctx.api.getMe();
    await ctx.editMessageText(H.text.replaceAll('{username}', me.username ?? 'bot'), {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: t(ctx.lang).common.back, callback_data: 'menu:home' }]] },
    });
  });
}
