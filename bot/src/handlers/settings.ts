import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { refreshUser } from '../bot.ts';
import { t } from '../i18n/index.ts';
import { settingsMenu } from '../keyboards.ts';

async function showSettings(ctx: BotCtx, edit: boolean): Promise<void> {
  const T = t(ctx.lang).settings;
  const text = `${T.title}\n\n${T.language}: ${ctx.lang === 'ru' ? T.language_ru : T.language_en}`;
  if (edit) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: settingsMenu(ctx.lang) }).catch(() =>
      ctx.reply(text, { parse_mode: 'HTML', reply_markup: settingsMenu(ctx.lang) })
    );
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: settingsMenu(ctx.lang) });
  }
}

export function registerSettings(bot: Bot<BotCtx>): void {
  bot.command('settings', (ctx) => showSettings(ctx, false));

  bot.callbackQuery('menu:settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSettings(ctx, true);
  });

  bot.callbackQuery(/^settings:lang:(ru|en)$/, async (ctx) => {
    const next = ctx.match[1] as 'ru' | 'en';
    await refreshUser(ctx, { lang: next });
    await ctx.answerCallbackQuery({ text: t(ctx.lang).settings.lang_changed });
    await showSettings(ctx, true);
  });
}
