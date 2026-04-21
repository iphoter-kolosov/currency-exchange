import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { getLatestRates } from '../services/rates.ts';
import { CURRENCY_BY_CODE, findCurrency } from '../data/currencies.ts';
import { formatMoney } from '../services/format.ts';
import { t } from '../i18n/index.ts';
import { refreshUser } from '../bot.ts';
import { watchMenu, watchRemoveList } from '../keyboards.ts';

async function buildWatchText(ctx: BotCtx): Promise<string> {
  const W = t(ctx.lang).watchlist;
  const base = ctx.user.defaultBase;
  const baseCur = CURRENCY_BY_CODE[base];
  if (!baseCur) return W.empty;
  if (ctx.user.watchlist.length === 0) return W.empty;

  const payload = await getLatestRates(base);
  const lines = ctx.user.watchlist
    .filter((code) => code !== base && CURRENCY_BY_CODE[code])
    .map((code) => {
      const cur = CURRENCY_BY_CODE[code];
      const rate = payload.rates[code];
      if (typeof rate !== 'number') return `${cur.flag} ${cur.iso}: —`;
      return `${cur.flag} <b>${cur.iso}</b>: ${formatMoney(rate, cur, ctx.lang)}`;
    });
  const header = W.header(baseCur.iso, 1);
  return [
    W.title,
    '',
    header,
    '',
    `${baseCur.flag} <b>${baseCur.iso}</b> · ${baseCur.name_en}`,
    '',
    ...lines,
    '',
    `<i>${payload.date}</i>`,
  ].join('\n');
}

async function showWatch(ctx: BotCtx): Promise<void> {
  try {
    const text = await buildWatchText(ctx);
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: watchMenu(ctx.lang),
    }).catch(async () => {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: watchMenu(ctx.lang) });
    });
  } catch (e) {
    console.error('watch failed', e);
    await ctx.reply(t(ctx.lang).common.error);
  }
}

export function registerWatch(bot: Bot<BotCtx>): void {
  bot.command('watch', async (ctx) => {
    const text = await buildWatchText(ctx);
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: watchMenu(ctx.lang) });
  });

  bot.callbackQuery('menu:watch', async (ctx) => {
    await ctx.answerCallbackQuery();
    await showWatch(ctx);
  });

  bot.callbackQuery('watch:refresh', async (ctx) => {
    await ctx.answerCallbackQuery({ text: '🔄' });
    await showWatch(ctx);
  });

  bot.callbackQuery('watch:add', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = { type: 'watch:add' };
    await ctx.reply(t(ctx.lang).watchlist.add_prompt, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('watch:base', async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.mode = { type: 'watch:base' };
    await ctx.reply(t(ctx.lang).watchlist.base_prompt, { parse_mode: 'HTML' });
  });

  bot.callbackQuery('watch:remove', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({
      reply_markup: watchRemoveList(ctx.lang, ctx.user.watchlist),
    });
  });

  bot.callbackQuery(/^watch:rm:(.+)$/, async (ctx) => {
    const code = ctx.match[1];
    const list = ctx.user.watchlist.filter((c) => c !== code);
    await refreshUser(ctx, { watchlist: list });
    const cur = CURRENCY_BY_CODE[code];
    await ctx.answerCallbackQuery({ text: cur ? `− ${cur.iso}` : 'removed' });
    await ctx.editMessageReplyMarkup({
      reply_markup: watchRemoveList(ctx.lang, ctx.user.watchlist),
    }).catch(() => undefined);
  });
}

export async function handleWatchAdd(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'watch:add') return false;
  const cur = findCurrency(text);
  if (!cur) {
    await ctx.reply(t(ctx.lang).common.unknown_currency(text), { parse_mode: 'HTML' });
    return true;
  }
  const list = ctx.user.watchlist.includes(cur.code)
    ? ctx.user.watchlist
    : [...ctx.user.watchlist, cur.code];
  await refreshUser(ctx, { watchlist: list });
  ctx.session.mode = undefined;
  await ctx.reply(t(ctx.lang).watchlist.added(cur.iso), { parse_mode: 'HTML' });
  const str = await buildWatchText(ctx);
  await ctx.reply(str, { parse_mode: 'HTML', reply_markup: watchMenu(ctx.lang) });
  return true;
}

export async function handleWatchBase(ctx: BotCtx, text: string): Promise<boolean> {
  if (ctx.session.mode?.type !== 'watch:base') return false;
  const cur = findCurrency(text);
  if (!cur) {
    await ctx.reply(t(ctx.lang).common.unknown_currency(text), { parse_mode: 'HTML' });
    return true;
  }
  const list = ctx.user.watchlist.includes(cur.code)
    ? ctx.user.watchlist
    : [cur.code, ...ctx.user.watchlist];
  await refreshUser(ctx, { defaultBase: cur.code, watchlist: list });
  ctx.session.mode = undefined;
  await ctx.reply(t(ctx.lang).watchlist.base_changed(cur.iso), { parse_mode: 'HTML' });
  const str = await buildWatchText(ctx);
  await ctx.reply(str, { parse_mode: 'HTML', reply_markup: watchMenu(ctx.lang) });
  return true;
}
