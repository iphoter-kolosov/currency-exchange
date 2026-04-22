import { InlineKeyboard, type Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { refreshUser } from '../bot.ts';
import { t } from '../i18n/index.ts';
import { timezoneMenu } from '../keyboards.ts';
import { TIMEZONES, tzLabel } from '../services/timezones.ts';

async function showSettings(ctx: BotCtx, edit: boolean): Promise<void> {
  const T = t(ctx.lang).settings;
  const langLabel = ctx.lang === 'ru' ? T.language_ru : T.language_en;
  const tzLabelStr = tzLabel(ctx.user.tz, ctx.lang);
  const text = `${T.title}\n\n${T.language}: ${langLabel}\n${T.timezone}: ${tzLabelStr}`;
  const kb = new InlineKeyboard()
    .text((ctx.lang === 'ru' ? '✓ ' : '') + T.language_ru, 'settings:lang:ru')
    .text((ctx.lang === 'en' ? '✓ ' : '') + T.language_en, 'settings:lang:en').row()
    .text(`⏰ ${T.timezone}`, 'settings:tz').row()
    .text(t(ctx.lang).common.back, 'menu:home');
  if (edit) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() =>
      ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb })
    );
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
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

  bot.callbackQuery('settings:tz', async (ctx) => {
    await ctx.answerCallbackQuery();
    const T = t(ctx.lang).settings;
    await ctx.editMessageText(`${T.title}\n\n${T.tz_prompt}`, {
      parse_mode: 'HTML',
      reply_markup: timezoneMenu(ctx.lang, ctx.user.tz),
    });
  });

  bot.callbackQuery(/^tz:set:(.+)$/, async (ctx) => {
    const tz = ctx.match[1];
    if (!TIMEZONES.find((t) => t.id === tz)) {
      await ctx.answerCallbackQuery();
      return;
    }
    await refreshUser(ctx, { tz });
    await ctx.answerCallbackQuery({ text: t(ctx.lang).settings.tz_changed });
    await showSettings(ctx, true);
  });
}

