import type { BotCtx } from '../bot.ts';
import { explainError } from '../services/ai.ts';
import { t } from '../i18n/index.ts';

export async function replyError(
  ctx: BotCtx,
  error: unknown,
  context: string,
): Promise<void> {
  console.error(`[${context}]`, error);
  const userId = ctx.from?.id;
  let explanation: string | null = null;
  if (userId) {
    try {
      explanation = await explainError(error, context, ctx.lang, userId);
    } catch (e) {
      console.warn('explainError failed', e instanceof Error ? e.message : e);
    }
  }
  const fallback = t(ctx.lang).common.error;
  await ctx.reply(explanation ?? fallback).catch((e) => {
    console.warn('replyError failed to send', e instanceof Error ? e.message : e);
  });
}

export async function withTyping<T>(ctx: BotCtx, fn: () => Promise<T>): Promise<T> {
  ctx.replyWithChatAction('typing').catch(() => {});
  return await fn();
}
