import { InlineKeyboard, type Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { refreshUser } from '../bot.ts';
import { t } from '../i18n/index.ts';
import { mainMenu } from '../keyboards.ts';

const ONBOARDING_TEXT =
  '👋 <b>Welcome!</b> · <b>Добро пожаловать!</b>\n\n' +
  'Choose your language to get started.\n' +
  'Выбери язык, чтобы продолжить.';

function onboardingKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🇬🇧 English', 'onboard:lang:en')
    .text('🇷🇺 Русский', 'onboard:lang:ru');
}

async function showGreeting(ctx: BotCtx, edit = false): Promise<void> {
  const T = t(ctx.lang).start;
  const name = ctx.from?.first_name ?? (ctx.lang === 'ru' ? 'друг' : 'there');
  const text = T.greeting(name);
  const opts = { parse_mode: 'HTML' as const, reply_markup: mainMenu(ctx.lang) };
  if (edit) {
    await ctx.editMessageText(text, opts).catch(() => ctx.reply(text, opts));
  } else {
    await ctx.reply(text, opts);
  }
}

export function registerStart(bot: Bot<BotCtx>): void {
  bot.command('start', async (ctx) => {
    if (!ctx.user.onboarded) {
      await ctx.reply(ONBOARDING_TEXT, {
        parse_mode: 'HTML',
        reply_markup: onboardingKeyboard(),
      });
      return;
    }
    await showGreeting(ctx);
  });

  bot.callbackQuery(/^onboard:lang:(ru|en)$/, async (ctx) => {
    const lang = ctx.match[1] as 'ru' | 'en';
    await refreshUser(ctx, { lang, onboarded: true });
    await ctx.answerCallbackQuery({ text: t(ctx.lang).settings.lang_changed });
    await showGreeting(ctx, true);
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
