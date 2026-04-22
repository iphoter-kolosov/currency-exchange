import { InlineKeyboard, type Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { handleConvertText } from './convert.ts';
import { handleWatchAdd, handleWatchBase, handleSingleCurrencyAsBase } from './watch.ts';
import { handleChartPair, sendChart } from './chart.ts';
import { handleAlertsPair, handleAlertsValue, handleDigestPair, handleDigestTime } from './alerts.ts';
import { handleTzCustom } from './settings.ts';
import { resolveIntent, validateIntent, type Intent } from '../services/ai.ts';
import { refreshUser } from '../bot.ts';
import {
  appendContext,
  createAlert,
  deleteAlert,
  getContext,
  listAlerts,
  newId,
  type Alert,
} from '../services/storage.ts';
import { findCurrency } from '../data/currencies.ts';
import type { Timeframe } from '../services/dates.ts';
import { tzLabel } from '../services/timezones.ts';
import { isSupportedLang, t, tpl } from '../i18n/index.ts';
import { LANGUAGES } from '../i18n/languages.ts';
import { showAlertList } from './alerts.ts';
import { askReset } from './start.ts';

async function handleAiFallback(ctx: BotCtx, text: string): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;
  if (ctx.session.mode) return false;

  ctx.replyWithChatAction('typing').catch(() => {});
  const history = await getContext(userId).catch(() => []);
  const intent = await resolveIntent(text, ctx.lang, userId, history);
  if (!intent) {
    const msg = ctx.lang.toLowerCase().startsWith('ru')
      ? 'Не уловил мысль — связь с моделью пропала или запрос неоднозначный. Попробуй переформулировать или нажми /help.'
      : "Didn't catch that — the model may be slow right now, or the request is ambiguous. Try rephrasing or tap /help.";
    await ctx.reply(msg);
    return true;
  }
  const trace = await runIntent(ctx, intent);
  if (trace) await appendContext(userId, text, trace).catch(() => {});
  return true;
}

async function runIntent(ctx: BotCtx, intent: Intent): Promise<string | null> {
  switch (intent.action) {
    case 'convert': {
      const synth = `${intent.amount} ${intent.from} ${intent.to}`;
      await handleConvertText(ctx, synth);
      return `Converted ${intent.amount} ${intent.from.toUpperCase()} to ${intent.to.toUpperCase()}`;
    }
    case 'rate': {
      const synth = `${intent.from} ${intent.to}`;
      await handleConvertText(ctx, synth);
      return `Showed current rate ${intent.from.toUpperCase()}/${intent.to.toUpperCase()}`;
    }
    case 'watch': {
      const cur = findCurrency(intent.base);
      if (!cur) return null;
      await handleSingleCurrencyAsBase(ctx, cur.code);
      return `Showed watchlist with base ${cur.iso}`;
    }
    case 'chart': {
      const from = findCurrency(intent.from);
      const to = findCurrency(intent.to);
      if (!from || !to) return null;
      const tf = intent.tf as Timeframe;
      await sendChart(ctx, from.code, to.code, tf);
      return `Opened ${from.iso}/${to.iso} chart at ${tf}`;
    }
    case 'daily_digest': {
      if (!ctx.from) return null;
      let base = 'all';
      let target = 'all';
      if (intent.scope === 'pair') {
        const from = intent.from ? findCurrency(intent.from) : null;
        const to = intent.to ? findCurrency(intent.to) : null;
        if (!from || !to) return null;
        base = from.code;
        target = to.code;
      }
      const alert: Alert = {
        id: newId(),
        userId: ctx.from.id,
        base,
        target,
        condition: {
          type: 'daily_digest',
          hour: intent.hour,
          minute: intent.minute,
          scope: intent.scope,
        },
        createdAt: Date.now(),
        active: true,
      };
      await createAlert(alert);
      const D = t(ctx.lang).digest;
      const pad = (n: number) => n.toString().padStart(2, '0');
      const time = `${pad(intent.hour)}:${pad(intent.minute)}`;
      const tz = tzLabel(ctx.user.tz, ctx.lang);
      const msg = intent.scope === 'pair'
        ? tpl(D.created_pair, { pair: `${base.toUpperCase()}/${target.toUpperCase()}`, time, tz })
        : tpl(D.created_watchlist, { time, tz });
      await ctx.reply(msg, { parse_mode: 'HTML' });
      return intent.scope === 'pair'
        ? `Scheduled daily ${base.toUpperCase()}/${target.toUpperCase()} digest at ${time} ${tz}`
        : `Scheduled daily watchlist digest at ${time} ${tz}`;
    }
    case 'list_alerts': {
      await showAlertList(ctx);
      return 'Showed alert list';
    }
    case 'delete_alert': {
      return await runDeleteAlert(ctx, intent);
    }
    case 'set_timezone': {
      if (!isValidTz(intent.tz)) {
        const msg = ctx.lang === 'ru'
          ? `Не нашёл пояс <b>${intent.tz}</b>. Попробуй название города на английском — например «Prague», «Tel Aviv».`
          : `Couldn't find timezone <b>${intent.tz}</b>. Try a city name like "Prague" or "Tel Aviv".`;
        await ctx.reply(msg, { parse_mode: 'HTML' });
        return null;
      }
      await refreshUser(ctx, { tz: intent.tz });
      const label = tzLabel(intent.tz, ctx.lang);
      const msg = ctx.lang === 'ru'
        ? `⏰ Часовой пояс: <b>${label === intent.tz ? intent.tz : label}</b>.`
        : `⏰ Time zone set to <b>${label === intent.tz ? intent.tz : label}</b>.`;
      await ctx.reply(msg, { parse_mode: 'HTML' });
      return `Set timezone to ${intent.tz}`;
    }
    case 'set_language': {
      if (!isSupportedLang(intent.lang)) {
        const supported = LANGUAGES.map((l) => `${l.flag} ${l.native}`).join(', ');
        await ctx.reply(tpl(t(ctx.lang).settings.lang_unsupported, { supported }));
        return `Rejected unsupported language ${intent.lang}`;
      }
      const prefix = intent.lang.toLowerCase().slice(0, 2);
      await refreshUser(ctx, { lang: prefix });
      await ctx.reply(t(ctx.lang).settings.lang_changed);
      return `Language set to ${prefix}`;
    }
    case 'help': {
      const H = t(ctx.lang).help;
      const me = await ctx.api.getMe();
      await ctx.reply(H.text.replaceAll('{username}', me.username ?? 'bot'), {
        parse_mode: 'HTML',
      });
      return 'Showed help';
    }
    case 'reset': {
      await askReset(ctx);
      return 'Asked for reset confirmation';
    }
    case 'compound': {
      ctx.session.mode = {
        type: 'pending_compound',
        summary: intent.summary,
        steps: intent.steps as unknown[],
      };
      const header = ctx.lang === 'ru'
        ? '📋 <b>Собираюсь сделать:</b>'
        : '📋 <b>Planned steps:</b>';
      const kb = new InlineKeyboard()
        .text(ctx.lang === 'ru' ? '✅ Подтвердить' : '✅ Confirm', 'compound:confirm')
        .text(ctx.lang === 'ru' ? '❌ Отмена' : '❌ Cancel', 'compound:cancel');
      await ctx.reply(`${header}\n\n${intent.summary}`, {
        parse_mode: 'HTML',
        reply_markup: kb,
      });
      return `Proposed: ${intent.summary}`;
    }
    case 'chat': {
      await ctx.reply(intent.reply, { parse_mode: 'HTML' }).catch(() =>
        ctx.reply(intent.reply)
      );
      return intent.reply;
    }
  }
}

function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

async function runDeleteAlert(
  ctx: BotCtx,
  intent: Extract<Intent, { action: 'delete_alert' }>,
): Promise<string | null> {
  if (!ctx.from) return null;
  const alerts = await listAlerts(ctx.from.id);
  const active = alerts.filter((a) => a.active);
  const base = intent.base?.toLowerCase();
  const target = intent.target?.toLowerCase();
  const ct = intent.conditionType;
  const all = intent.all === true;

  const matches = active.filter((a) => {
    if (base && a.base !== base && !(a.condition.type === 'daily_digest' && a.condition.scope === 'watchlist')) return false;
    if (target && a.target !== target && !(a.condition.type === 'daily_digest' && a.condition.scope === 'watchlist')) return false;
    if (ct && a.condition.type !== ct) return false;
    return true;
  });

  if (matches.length === 0) {
    const msg = ctx.lang === 'ru'
      ? 'Не нашёл таких алертов. Посмотреть все — /alerts.'
      : 'No matching alerts. See the full list with /alerts.';
    await ctx.reply(msg);
    return null;
  }
  // Ask to narrow only if there are several matches AND the user did not say "all"
  // AND did not narrow by either pair or condition type.
  if (matches.length > 1 && !all && !base && !target && !ct) {
    const msg = ctx.lang === 'ru'
      ? `Нашёл ${matches.length} алертов. Если хочешь удалить все — напиши «удали все», иначе уточни пару или тип.`
      : `Found ${matches.length} alerts. Say "delete all" to remove them all, or narrow by pair / type.`;
    await ctx.reply(msg);
    await showAlertList(ctx);
    return null;
  }
  for (const a of matches) {
    await deleteAlert(ctx.from.id, a.id);
  }
  const msg = matches.length === 1
    ? (ctx.lang === 'ru' ? '🗑 Алерт удалён.' : '🗑 Alert deleted.')
    : (ctx.lang === 'ru' ? `🗑 Удалено алертов: ${matches.length}.` : `🗑 Deleted ${matches.length} alerts.`);
  await ctx.reply(msg);
  await showAlertList(ctx);
  return `Deleted ${matches.length} alert(s)`;
}

export function registerText(bot: Bot<BotCtx>): void {
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    if (await handleWatchAdd(ctx, text)) return;
    if (await handleWatchBase(ctx, text)) return;
    if (await handleChartPair(ctx, text)) return;
    if (await handleAlertsPair(ctx, text)) return;
    if (await handleAlertsValue(ctx, text)) return;
    if (await handleDigestPair(ctx, text)) return;
    if (await handleDigestTime(ctx, text)) return;
    if (await handleTzCustom(ctx, text)) return;

    if (await handleConvertText(ctx, text)) return;
    if (await handleSingleCurrencyAsBase(ctx, text)) return;

    await handleAiFallback(ctx, text);
  });

  bot.callbackQuery('compound:confirm', async (ctx) => {
    await ctx.answerCallbackQuery();
    const mode = ctx.session.mode;
    if (mode?.type !== 'pending_compound') {
      const stale = ctx.lang === 'ru'
        ? 'План уже не активен — напиши запрос ещё раз.'
        : 'That plan is no longer pending — send the request again.';
      await ctx.reply(stale);
      return;
    }
    const rawSteps = mode.steps;
    ctx.session.mode = undefined;
    const running = ctx.lang === 'ru' ? '✅ Выполняю…' : '✅ Running…';
    await ctx.editMessageText(running, { parse_mode: 'HTML' }).catch(() => {});

    for (const raw of rawSteps) {
      const step = validateIntent(raw);
      if (!step || step.action === 'compound') continue;
      try {
        await runIntent(ctx, step);
      } catch (e) {
        console.error('compound step failed', step.action, e instanceof Error ? e.message : e);
      }
    }
  });

  bot.callbackQuery('compound:cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = undefined;
    const msg = ctx.lang === 'ru' ? '❌ Отменено.' : '❌ Cancelled.';
    await ctx.editMessageText(msg).catch(() => ctx.reply(msg));
  });
}
