import { InlineKeyboard, type Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { refreshUser } from '../bot.ts';
import { isSupportedLang, SUPPORTED_LANGS, t } from '../i18n/index.ts';
import { LANGUAGES } from '../i18n/languages.ts';
import { cancelKb, timezoneMenu } from '../keyboards.ts';
import { TIMEZONES, tzLabel } from '../services/timezones.ts';
import { resolveIntent } from '../services/ai.ts';
import { replyError, withTyping } from './_error.ts';

async function showSettings(ctx: BotCtx, edit: boolean): Promise<void> {
  const T = t(ctx.lang).settings;
  const prefix = ctx.lang.toLowerCase().slice(0, 2);
  const current = LANGUAGES.find((l) => l.id === prefix);
  const langLabel = current ? `${current.flag} ${current.native}` : ctx.lang;
  const tzLabelStr = tzLabel(ctx.user.tz, ctx.lang);
  const text = `${T.title}\n\n${T.language}: ${langLabel}\n${T.timezone}: ${tzLabelStr}`;
  const kb = new InlineKeyboard();
  LANGUAGES.forEach((lang, i) => {
    const marker = lang.id === prefix ? '✓ ' : '';
    kb.text(`${marker}${lang.flag} ${lang.native}`, `settings:lang:${lang.id}`);
    if (i % 2 === 1) kb.row();
  });
  kb.row()
    .text(`⏰ ${T.timezone}`, 'settings:tz').row()
    .text(t(ctx.lang).common.askAssistant, 'menu:home');
  if (edit) {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb }).catch(() =>
      ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb })
    );
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }
}

const LANG_CALLBACK = new RegExp(`^settings:lang:(${SUPPORTED_LANGS.join('|')})$`);

export function registerSettings(bot: Bot<BotCtx>): void {
  bot.command('settings', (ctx) => showSettings(ctx, false));

  bot.callbackQuery('menu:settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    await showSettings(ctx, true);
  });

  bot.callbackQuery(LANG_CALLBACK, async (ctx) => {
    const next = ctx.match[1];
    if (!isSupportedLang(next)) {
      await ctx.answerCallbackQuery();
      return;
    }
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
      reply_markup: cancelKb(ctx.lang),
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

export async function handleTzCustom(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'settings:tz_custom') return false;
  const userId = ctx.from?.id;
  if (!userId) return true;
  try {
    const intent = await withTyping(ctx, () =>
      resolveIntent(`set my timezone to ${text}`, ctx.lang, userId, ctx.user.tz)
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
    await ctx.reply(msg, { reply_markup: cancelKb(ctx.lang) });
    return true;
  } catch (e) {
    ctx.session.mode = undefined;
    await replyError(ctx, e, `resolving time zone from "${text}"`);
    return true;
  }
}
