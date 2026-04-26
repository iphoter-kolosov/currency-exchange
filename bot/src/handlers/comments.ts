import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import {
  getLangForGroupId,
  getSponsoredPost,
  isAiDisabled,
  isAiPublic,
  isBetaTester,
  isSponsoredThread,
  markSponsoredThread,
  tryAcquireGlobalRate,
  tryAcquireUserThrottle,
} from '../services/news.ts';
import { reactToComment } from '../services/cheerleader.ts';

export function registerComments(bot: Bot<BotCtx>): void {
  bot.on('message', async (ctx, next) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return next();
    const groupLang = await getLangForGroupId(chatId);
    if (!groupLang) return next();

    if (ctx.from?.is_bot) return;

    if (ctx.message.is_automatic_forward) {
      const origin = ctx.message.forward_origin;
      if (origin && origin.type === 'channel') {
        const channelMsgId = origin.message_id;
        const sponsored = await getSponsoredPost(channelMsgId);
        if (sponsored) {
          await markSponsoredThread(ctx.message.message_id);
          console.log(`marked sponsored thread ${ctx.message.message_id} (channel msg ${channelMsgId})`);
        }
      }
      return;
    }

    const text = ctx.message.text;
    if (!text) return;
    if (text.startsWith('/')) return;

    if (await isAiDisabled()) return;

    const threadId = ctx.message.message_thread_id;
    if (threadId !== undefined && await isSponsoredThread(threadId)) return;

    const userId = ctx.from?.id;
    if (!userId) return;

    // Beta gate: until cheerleader_public is flipped on, react only to
    // beta testers. Lets the admin and a second account rehearse the
    // whole flow in the real group while ordinary members see nothing.
    if (!(await isAiPublic())) {
      if (!(await isBetaTester(userId))) return;
    }

    if (!tryAcquireGlobalRate()) return;
    if (!(await tryAcquireUserThrottle(userId))) return;

    // The group's configured language wins over the commenter's profile —
    // a Russian channel deserves Russian replies even if a tester writes
    // in English by accident.
    const reaction = await reactToComment(text, groupLang);
    if (!reaction) return;

    await ctx.api.sendMessage(chatId, reaction, {
      reply_parameters: { message_id: ctx.message.message_id, allow_sending_without_reply: true },
      message_thread_id: threadId,
    }).catch((e) => {
      console.warn('cheerleader reply failed:', e instanceof Error ? e.message : e);
    });
  });
}
