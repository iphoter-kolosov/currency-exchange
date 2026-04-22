import { InlineKeyboard, type Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { refreshUser } from '../bot.ts';
import { t, translateAndCacheLabels } from '../i18n/index.ts';
import { timezoneMenu } from '../keyboards.ts';
import { TIMEZONES, tzLabel } from '../services/timezones.ts';
import { resolveIntent } from '../services/ai.ts';
import { replyError, withTyping } from './_error.ts';

async function showSettings(ctx: BotCtx, edit: boolean): Promise<void> {
  const T = t(ctx.lang).settings;
  const prefix = ctx.lang.toLowerCase().slice(0, 2);
  const langLabel = prefix === 'ru'
    ? T.language_ru
    : prefix === 'en'
      ? T.language_en
      : ctx.lang;
  const tzLabelStr = tzLabel(ctx.user.tz, ctx.lang);
  const text = `${T.title}\n\n${T.language}: ${langLabel}\n${T.timezone}: ${tzLabelStr}`;
  const kb = new InlineKeyboard()
    .text((prefix === 'ru' ? '✓ ' : '') + T.language_ru, 'settings:lang:ru')
    .text((prefix === 'en' ? '✓ ' : '') + T.language_en, 'settings:lang:en').row()
    .text(T.lang_custom, 'settings:lang_custom').row()
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

  bot.callbackQuery('tz:custom', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = { type: 'settings:tz_custom' };
    await ctx.editMessageText(t(ctx.lang).settings.tz_custom_prompt, {
      parse_mode: 'HTML',
    });
  });

  bot.callbackQuery('settings:lang_custom', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = { type: 'settings:lang_custom' };
    await ctx.editMessageText(t(ctx.lang).settings.lang_custom_prompt, {
      parse_mode: 'HTML',
    });
  });
}

function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function handleLangCustom(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'settings:lang_custom') return false;
  const userId = ctx.from?.id;
  if (!userId) return true;
  try {
    const intent = await withTyping(ctx, () =>
      resolveIntent(`set my bot language to ${text}`, ctx.lang, userId)
    );
    if (intent?.action === 'set_language') {
      ctx.session.mode = undefined;
      await refreshUser(ctx, { lang: intent.lang });
      const prefix = intent.lang.toLowerCase().slice(0, 2);
      if (prefix === 'en' || prefix === 'ru') {
        await ctx.reply(t(ctx.lang).settings.lang_changed);
        await showSettings(ctx, false);
        return true;
      }
      await ctx.reply(`🔄 Переключаюсь на ${intent.lang}… / Switching to ${intent.lang}…`);
      const chatId = ctx.chat?.id;
      queueMicrotask(async () => {
        const ok = await translateAndCacheLabels(intent.lang);
        if (!chatId) return;
        const msg = ok
          ? t(intent.lang).settings.lang_changed
          : `Language set to ${intent.lang}. Try /settings again in a moment for translated menus.`;
        await ctx.api.sendMessage(chatId, msg).catch(() => {});
      });
      return true;
    }
    const msg = ctx.lang.toLowerCase().startsWith('ru')
      ? `Не понял язык из «${text}». Попробуй английское название (Spanish, German) или код (es, de).`
      : `Couldn't resolve "${text}" to a language. Try an English name (Spanish, German) or code (es, de).`;
    await ctx.reply(msg);
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, `resolving language from "${text}"`);
    return true;
  }
}

export async function handleTzCustom(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'settings:tz_custom') return false;
  const userId = ctx.from?.id;
  if (!userId) return true;
  try {
    const intent = await withTyping(ctx, () =>
      resolveIntent(`set my timezone to ${text}`, ctx.lang, userId)
    );
    if (intent?.action === 'set_timezone' && isValidTz(intent.tz)) {
      ctx.session.mode = undefined;
      await refreshUser(ctx, { tz: intent.tz });
      const label = tzLabel(intent.tz, ctx.lang);
      const pretty = label === intent.tz ? intent.tz : label;
      const msg = ctx.lang === 'ru'
        ? `⏰ Часовой пояс: <b>${pretty}</b>.`
        : `⏰ Time zone set to <b>${pretty}</b>.`;
      await ctx.reply(msg, { parse_mode: 'HTML' });
      await showSettings(ctx, false);
      return true;
    }
    const msg = ctx.lang === 'ru'
      ? `Не получилось найти пояс для «${text}». Попробуй другое написание или выбери из списка — /settings.`
      : `Couldn't resolve "${text}" to a time zone. Try a different spelling or pick from the list — /settings.`;
    await ctx.reply(msg);
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, `resolving time zone from "${text}"`);
    return true;
  }
}

