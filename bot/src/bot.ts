import { Bot, Context, GrammyError, HttpError, session, type SessionFlavor } from 'grammy';
import { getUser, updateUser, type Lang, type UserPrefs } from './services/storage.ts';
import { detectLang, t } from './i18n/index.ts';
import { explainError } from './services/ai.ts';
import { mainMenu } from './keyboards.ts';
import { registerStart } from './handlers/start.ts';
import { registerConvert } from './handlers/convert.ts';
import { registerWatch } from './handlers/watch.ts';
import { registerChart } from './handlers/chart.ts';
import { registerAlerts } from './handlers/alerts.ts';
import { registerSettings } from './handlers/settings.ts';
import { registerInline } from './handlers/inline.ts';
import { registerText } from './handlers/text.ts';

export type SessionData = {
  mode?:
    | { type: 'watch:add' }
    | { type: 'watch:base' }
    | { type: 'chart:pair' }
    | { type: 'chart:await_tf'; base: string; target: string }
    | { type: 'alerts:pair' }
    | { type: 'alerts:value'; base: string; target: string; condType: 'above' | 'below' | 'pct_up' | 'pct_down' }
    | { type: 'digest:pair' }
    | { type: 'digest:time'; scope: 'pair' | 'watchlist'; base: string; target: string }
    | { type: 'settings:tz_custom' }
    | { type: 'pending_compound'; summary: string; steps: unknown[] };
};

export type BotCtx = Context & SessionFlavor<SessionData> & {
  user: UserPrefs;
  lang: Lang;
};

export function createBot(token: string): Bot<BotCtx> {
  const bot = new Bot<BotCtx>(token);

  bot.use(session<SessionData, BotCtx>({
    initial: () => ({}),
  }));

  bot.use(async (ctx, next) => {
    const uid = ctx.from?.id;
    if (!uid) return next();
    const hint = detectLang(ctx.from?.language_code);
    ctx.user = await getUser(uid, hint);
    ctx.lang = ctx.user.lang;
    if (ctx.message?.text?.startsWith('/')) {
      ctx.session.mode = undefined;
    }
    await next();
  });

  bot.catch(async (err) => {
    const c = err.ctx;
    console.error(`Error while handling update ${c.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error('Telegram error:', e.description);
    } else if (e instanceof HttpError) {
      console.error('HTTP error:', e);
    } else {
      console.error('Unknown error:', e);
    }
    try {
      const lang: Lang = c.lang ?? detectLang(c.from?.language_code);
      const userId = c.from?.id ?? 0;
      const explanation = userId
        ? await explainError(e, 'handling your message', lang, userId)
        : null;
      const fallback = t(lang).common.error;
      await c.reply(explanation ?? fallback).catch(() => {});
    } catch (replyErr) {
      console.warn('bot.catch reply failed', replyErr);
    }
  });

  registerStart(bot);
  registerConvert(bot);
  registerWatch(bot);
  registerChart(bot);
  registerAlerts(bot);
  registerSettings(bot);
  registerInline(bot);
  registerText(bot);

  bot.callbackQuery('menu:home', async (ctx) => {
    await ctx.answerCallbackQuery();
    const T = t(ctx.lang).start;
    const name = ctx.from?.first_name ?? 'there';
    await ctx.editMessageText(T.greeting(name), {
      parse_mode: 'HTML',
      reply_markup: mainMenu(ctx.lang),
    }).catch(async () => {
      await ctx.reply(T.greeting(name), {
        parse_mode: 'HTML',
        reply_markup: mainMenu(ctx.lang),
      });
    });
  });

  return bot;
}

export async function setBotCommands(bot: Bot<BotCtx>): Promise<void> {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Open main menu' },
    { command: 'convert', description: 'Convert amounts' },
    { command: 'watch', description: 'Show watchlist' },
    { command: 'chart', description: 'Show price chart' },
    { command: 'alerts', description: 'Manage alerts' },
    { command: 'settings', description: 'Language & preferences' },
    { command: 'help', description: 'How to use' },
    { command: 'reset', description: 'Wipe all data and start over' },
  ], { language_code: 'en' });

  await bot.api.setMyCommands([
    { command: 'start', description: 'Главное меню' },
    { command: 'convert', description: 'Конвертация' },
    { command: 'watch', description: 'Список курсов' },
    { command: 'chart', description: 'График курса' },
    { command: 'alerts', description: 'Алерты' },
    { command: 'settings', description: 'Язык и настройки' },
    { command: 'help', description: 'Как пользоваться' },
    { command: 'reset', description: 'Сбросить все данные' },
  ], { language_code: 'ru' });
}

export async function refreshUser(ctx: BotCtx, patch: Partial<UserPrefs>): Promise<void> {
  if (!ctx.from) return;
  ctx.user = await updateUser(ctx.from.id, patch);
  ctx.lang = ctx.user.lang;
}
