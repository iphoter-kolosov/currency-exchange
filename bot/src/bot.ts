import { Bot, Context, GrammyError, HttpError, session, type SessionFlavor } from 'grammy';
import { getUser, updateUser, type Lang, type UserPrefs } from './services/storage.ts';
import { detectLang, isSupportedLang, t, tpl } from './i18n/index.ts';
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
import { registerStats } from './handlers/stats.ts';
import { registerAdmin } from './handlers/admin.ts';
import { registerComments } from './handlers/comments.ts';
import { getDiscussionGroupId } from './services/news.ts';

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

const seenUpdates = new Map<number, number>();
const SEEN_TTL_MS = 120_000;

function alreadyHandled(updateId: number): boolean {
  const now = Date.now();
  if (seenUpdates.size > 500) {
    for (const [k, t] of seenUpdates) {
      if (now - t > SEEN_TTL_MS) seenUpdates.delete(k);
    }
  }
  if (seenUpdates.has(updateId)) return true;
  seenUpdates.set(updateId, now);
  return false;
}

export function createBot(token: string): Bot<BotCtx> {
  const bot = new Bot<BotCtx>(token);

  bot.use(session<SessionData, BotCtx>({
    initial: () => ({}),
  }));

  // Dedupe retries: Telegram resends the same update_id if a webhook
  // reply didn't come back in time. Without this guard every retry
  // runs the same handler again, leading to duplicate replies.
  bot.use(async (ctx, next) => {
    if (alreadyHandled(ctx.update.update_id)) {
      console.log(`skip duplicate update ${ctx.update.update_id}`);
      return;
    }
    await next();
  });

  bot.use(async (ctx, next) => {
    const uid = ctx.from?.id;
    if (!uid) return next();
    const hint = detectLang(ctx.from?.language_code);
    ctx.user = await getUser(uid, hint);
    // Legacy users may have unsupported codes saved (e.g. 'uk', 'de')
    // from before the five-language lockdown. Reset them to English
    // lazily so they see a working menu on their next message.
    if (!isSupportedLang(ctx.user.lang)) {
      ctx.user = await updateUser(uid, { lang: 'en' });
    }
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
  registerStats(bot);
  registerAdmin(bot);
  registerComments(bot);
  registerText(bot);

  bot.callbackQuery('menu:home', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = undefined;
    const T = t(ctx.lang).start;
    const name = ctx.from?.first_name ?? 'there';
    const greeting = tpl(T.greeting, { name });
    await ctx.editMessageText(greeting, {
      parse_mode: 'HTML',
      reply_markup: mainMenu(ctx.lang),
    }).catch(async () => {
      await ctx.reply(greeting, {
        parse_mode: 'HTML',
        reply_markup: mainMenu(ctx.lang),
      });
    });
  });

  // Universal escape hatch: /cancel and the inline "Cancel" button
  // clear whatever multi-step mode the user is stuck in. Without this,
  // a user who typed /chart and then messaged anything else was trapped
  // in chart:pair mode until they figured out that slash commands
  // break out of it.
  bot.command('cancel', async (ctx) => {
    ctx.session.mode = undefined;
    await ctx.reply(t(ctx.lang).reset.cancelled);
  });

  bot.callbackQuery('mode:cancel', async (ctx) => {
    ctx.session.mode = undefined;
    await ctx.answerCallbackQuery();
    const msg = t(ctx.lang).reset.cancelled;
    await ctx.editMessageText(msg).catch(() => ctx.reply(msg));
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
    { command: 'cancel', description: 'Cancel the current action' },
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
    { command: 'cancel', description: 'Отменить текущее действие' },
    { command: 'reset', description: 'Сбросить все данные' },
  ], { language_code: 'ru' });
}

export async function refreshUser(ctx: BotCtx, patch: Partial<UserPrefs>): Promise<void> {
  if (!ctx.from) return;
  ctx.user = await updateUser(ctx.from.id, patch);
  ctx.lang = ctx.user.lang;
}
