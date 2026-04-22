import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { parseInput } from '../services/parser.ts';
import { convert, getRateForDate } from '../services/rates.ts';
import { formatAmount, formatRate } from '../services/format.ts';
import { CURRENCY_BY_CODE, findCurrency } from '../data/currencies.ts';
import { setLastIntent, type LastIntent } from '../services/storage.ts';
import { showWatchAs } from './watch.ts';
import { t, tpl } from '../i18n/index.ts';
import { replyError, withTyping } from './_error.ts';

export function registerConvert(bot: Bot<BotCtx>): void {
  bot.command('convert', async (ctx) => {
    const C = t(ctx.lang).convert;
    const raw = ctx.match?.toString().trim() ?? '';
    if (!raw) {
      await ctx.reply(C.prompt, { parse_mode: 'HTML' });
      return;
    }
    await handleConvertText(ctx, raw);
  });

  bot.callbackQuery('menu:convert', async (ctx) => {
    await ctx.answerCallbackQuery();
    const C = t(ctx.lang).convert;
    await ctx.editMessageText(C.prompt, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: t(ctx.lang).common.back, callback_data: 'menu:home' }]] },
    });
  });
}

async function rememberIntent(ctx: BotCtx, intent: LastIntent): Promise<void> {
  if (!ctx.from) return;
  await setLastIntent(ctx.from.id, intent).catch(() => {});
}

export async function handleConvertText(ctx: BotCtx, raw: string): Promise<boolean> {
  const defaultBase = CURRENCY_BY_CODE[ctx.user.defaultBase] ?? null;
  const parsed = parseInput(raw, { tz: ctx.user.tz, defaultBase });
  if (parsed.kind === 'unknown') return false;
  const C = t(ctx.lang).convert;

  if (parsed.kind === 'watch') {
    await rememberIntent(ctx, { kind: 'watch', baseCode: parsed.base.code });
    return showWatchAs(ctx, parsed.base);
  }

  if (parsed.kind === 'historical') {
    try {
      const payload = await withTyping(ctx, () => getRateForDate(parsed.from.code, parsed.date));
      const rate = parsed.to.code === parsed.from.code ? 1 : payload.rates[parsed.to.code];
      if (typeof rate !== 'number') {
        const msg = ctx.lang === 'ru'
          ? `Нет данных по <b>${parsed.from.iso}/${parsed.to.iso}</b> на <code>${parsed.date}</code>.`
          : `No data for <b>${parsed.from.iso}/${parsed.to.iso}</b> on <code>${parsed.date}</code>.`;
        await ctx.reply(msg, { parse_mode: 'HTML' });
        return true;
      }
      const msg = tpl(C.result, {
        amount: formatAmount(1, parsed.from, ctx.lang),
        from: parsed.from.iso,
        value: formatAmount(rate, parsed.to, ctx.lang),
        to: parsed.to.iso,
        rate: formatRate(rate, ctx.lang),
        date: payload.date,
      });
      await ctx.reply(msg, { parse_mode: 'HTML' });
      await rememberIntent(ctx, {
        kind: 'historical',
        fromCode: parsed.from.code,
        toCode: parsed.to.code,
        date: payload.date,
      });
      return true;
    } catch (e) {
      await replyError(ctx, e, `historical ${parsed.from.iso}/${parsed.to.iso} on ${parsed.date}`);
      return true;
    }
  }

  const amount = parsed.kind === 'convert' ? parsed.amount : 1;
  try {
    const result = await withTyping(ctx, () => convert(amount, parsed.from.code, parsed.to.code));
    const msg = tpl(C.result, {
      amount: formatAmount(amount, parsed.from, ctx.lang),
      from: parsed.from.iso,
      value: formatAmount(result.value, parsed.to, ctx.lang),
      to: parsed.to.iso,
      rate: formatRate(result.rate, ctx.lang),
      date: result.date,
    });
    await ctx.reply(msg, { parse_mode: 'HTML' });
    if (parsed.kind === 'convert') {
      await rememberIntent(ctx, {
        kind: 'convert',
        amount: parsed.amount,
        fromCode: parsed.from.code,
        toCode: parsed.to.code,
      });
    } else {
      await rememberIntent(ctx, {
        kind: 'rate',
        fromCode: parsed.from.code,
        toCode: parsed.to.code,
      });
    }
    return true;
  } catch (e) {
    await replyError(ctx, e, `converting ${amount} ${parsed.from.iso} to ${parsed.to.iso}`);
    return true;
  }
}

/** Regex matches prepositions users type as a standalone follow-up:
 * "в евро", "к рублю", "в USD", "to USD", "from EUR". The preposition
 * is captured so we know whether the user is swapping the "from" or
 * the "to" side of the last intent. */
const PREP_SWAP_RE = /^\s*(в|во|ко|к|to|in|into|от|со|from)\s+(.+?)\s*$/iu;
const FROM_PREPS = new Set(['от', 'со', 'from']);

const DATE_KEYWORDS: Record<string, number> = {
  'вчера': -1, 'вчерашний': -1, 'вчерашняя': -1, 'вчерашнее': -1, 'вчерашние': -1,
  'позавчера': -2,
  'сегодня': 0, 'сегодняшний': 0, 'сегодняшняя': 0, 'сегодняшнее': 0,
  'yesterday': -1, 'yday': -1,
  'today': 0,
};

function dateAfter(tz: string, offsetDays: number): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.format(new Date()).split('-').map((n) => parseInt(n, 10));
  const base = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const shifted = new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function detectDateOnly(raw: string, tz: string): string | null {
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Must be 1-3 words total and all must be "at/on/за/на" connectors or a date keyword.
  if (words.length === 0 || words.length > 3) return null;
  let hit: string | null = null;
  for (const w of words) {
    if (w === 'на' || w === 'за' || w === 'в' || w === 'on' || w === 'at' || w === 'for') continue;
    const off = DATE_KEYWORDS[w];
    if (off !== undefined) {
      if (hit) return null;
      hit = dateAfter(tz, off);
      continue;
    }
    const iso = w.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      if (hit) return null;
      hit = w;
      continue;
    }
    return null;
  }
  return hit;
}

function swapCurrency(last: LastIntent, newCur: string, isFrom: boolean): LastIntent | null {
  if (last.kind === 'watch') {
    // Base becomes the other side; we can't usefully swap 'from' here.
    if (isFrom) return { kind: 'rate', fromCode: newCur, toCode: last.baseCode };
    return { kind: 'rate', fromCode: last.baseCode, toCode: newCur };
  }
  if (last.kind === 'convert') {
    return isFrom
      ? { ...last, fromCode: newCur }
      : { ...last, toCode: newCur };
  }
  if (last.kind === 'rate') {
    return isFrom
      ? { ...last, fromCode: newCur }
      : { ...last, toCode: newCur };
  }
  if (last.kind === 'historical') {
    return isFrom
      ? { ...last, fromCode: newCur }
      : { ...last, toCode: newCur };
  }
  return null;
}

function applyDate(last: LastIntent, date: string): LastIntent | null {
  if (last.kind === 'watch') return null; // watch + date is ambiguous
  if (last.kind === 'convert') {
    return { kind: 'historical', fromCode: last.fromCode, toCode: last.toCode, date };
  }
  if (last.kind === 'rate') {
    return { kind: 'historical', fromCode: last.fromCode, toCode: last.toCode, date };
  }
  if (last.kind === 'historical') {
    return { ...last, date };
  }
  return null;
}

function intentToSynth(intent: LastIntent): string | null {
  if (intent.kind === 'convert') return `${intent.amount} ${intent.fromCode} ${intent.toCode}`;
  if (intent.kind === 'rate') return `${intent.fromCode} ${intent.toCode}`;
  if (intent.kind === 'historical') return `${intent.fromCode} ${intent.toCode} ${intent.date}`;
  if (intent.kind === 'watch') return intent.baseCode;
  return null;
}

/** Follow-up path: "в евро" after "курс huf usd", "за вчера" after
 * any pair-based intent. Returns true if the message was absorbed as
 * a follow-up; false lets the regular pipeline run. */
export async function tryContextFollowUp(
  ctx: BotCtx,
  raw: string,
  last: LastIntent | null,
): Promise<boolean> {
  if (!last) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;

  const prepMatch = trimmed.match(PREP_SWAP_RE);
  if (prepMatch) {
    const cur = findCurrency(prepMatch[2].trim());
    if (cur) {
      const isFrom = FROM_PREPS.has(prepMatch[1].toLowerCase());
      const merged = swapCurrency(last, cur.code, isFrom);
      if (merged) {
        const synth = intentToSynth(merged);
        if (synth) return handleConvertText(ctx, synth);
      }
    }
  }

  const dateOnly = detectDateOnly(trimmed, ctx.user.tz);
  if (dateOnly) {
    const merged = applyDate(last, dateOnly);
    if (merged) {
      const synth = intentToSynth(merged);
      if (synth) return handleConvertText(ctx, synth);
    }
  }

  return false;
}
