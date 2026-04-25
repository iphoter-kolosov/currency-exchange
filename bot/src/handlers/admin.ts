import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import {
  getDiscussionGroupId,
  getNewsChannelId,
  isAdmin,
  isAiDisabled,
  iterateReferralCounts,
  markSponsoredPost,
  setAiDisabled,
  setDiscussionGroupId,
  setNewsChannelId,
} from '../services/news.ts';

function parsePostArgs(text: string): { sponsor: string | null; body: string } {
  const lines = text.split('\n');
  const first = lines[0].trim();
  if (lines.length === 1) {
    return { sponsor: null, body: first };
  }
  const rest = lines.slice(1).join('\n').trim();
  return { sponsor: first || null, body: rest };
}

function adminOnly(ctx: BotCtx): boolean {
  if (!isAdmin(ctx.from?.id)) return false;
  return true;
}

export function registerAdmin(bot: Bot<BotCtx>): void {
  bot.command('post', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const body = (ctx.match ?? '').toString().trim();
    if (!body) {
      await ctx.reply(
        'Usage: <code>/post &lt;text&gt;</code>\nText supports Telegram HTML tags.',
        { parse_mode: 'HTML' },
      );
      return;
    }
    const channelId = await getNewsChannelId();
    if (!channelId) {
      await ctx.reply('No news channel configured. Use /setchannel first.');
      return;
    }
    try {
      const sent = await ctx.api.sendMessage(channelId, body, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: false },
      });
      await ctx.reply(`Posted to channel (msg ${sent.message_id}).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await ctx.reply(`Failed: ${msg}`);
    }
  });

  bot.command('postsponsored', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const raw = (ctx.match ?? '').toString();
    if (!raw.trim()) {
      await ctx.reply(
        'Usage:\n<code>/postsponsored Sponsor name\nPost body (Telegram HTML).</code>\n\nFirst line is the sponsor name; the rest is the post body.',
        { parse_mode: 'HTML' },
      );
      return;
    }
    const { sponsor, body } = parsePostArgs(raw);
    if (!sponsor || !body) {
      await ctx.reply('Need sponsor name on the first line and the body on subsequent lines.');
      return;
    }
    const channelId = await getNewsChannelId();
    if (!channelId) {
      await ctx.reply('No news channel configured. Use /setchannel first.');
      return;
    }
    const escapedSponsor = sponsor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const composed = `📢 <b>Партнёрский материал</b> · ${escapedSponsor}\n\n${body}`;
    try {
      const sent = await ctx.api.sendMessage(channelId, composed, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: false },
      });
      await markSponsoredPost(sent.message_id, sponsor);
      await ctx.reply(`Sponsored post sent (channel msg ${sent.message_id}). AI cheerleader will stay silent in this thread.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await ctx.reply(`Failed: ${msg}`);
    }
  });

  bot.command('setchannel', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const arg = (ctx.match ?? '').toString().trim();
    let id: number | null = null;
    if (arg) {
      const parsed = Number(arg);
      if (Number.isFinite(parsed)) id = parsed;
    } else {
      const fwdChat = ctx.message?.forward_origin && 'chat' in ctx.message.forward_origin
        ? ctx.message.forward_origin.chat
        : null;
      if (fwdChat) id = fwdChat.id;
    }
    if (id === null) {
      await ctx.reply(
        'Usage: <code>/setchannel &lt;id&gt;</code>\n' +
          'Or forward any message from the channel and reply <code>/setchannel</code> to it.',
        { parse_mode: 'HTML' },
      );
      return;
    }
    await setNewsChannelId(id);
    await ctx.reply(`News channel set to <code>${id}</code>.`, { parse_mode: 'HTML' });
  });

  bot.command('setgroup', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const arg = (ctx.match ?? '').toString().trim();
    let id: number | null = null;
    if (arg) {
      const parsed = Number(arg);
      if (Number.isFinite(parsed)) id = parsed;
    } else if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
      id = ctx.chat.id;
    } else {
      const fwdChat = ctx.message?.forward_origin && 'chat' in ctx.message.forward_origin
        ? ctx.message.forward_origin.chat
        : null;
      if (fwdChat) id = fwdChat.id;
    }
    if (id === null) {
      await ctx.reply(
        'Usage: <code>/setgroup &lt;id&gt;</code>\n' +
          'Or run <code>/setgroup</code> directly inside the discussion group, ' +
          'or forward a message from it and reply with <code>/setgroup</code>.',
        { parse_mode: 'HTML' },
      );
      return;
    }
    await setDiscussionGroupId(id);
    await ctx.reply(`Discussion group set to <code>${id}</code>.`, { parse_mode: 'HTML' });
  });

  bot.command('newsconfig', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const channelId = await getNewsChannelId();
    const groupId = await getDiscussionGroupId();
    const aiOff = await isAiDisabled();
    const lines = [
      '<b>News config</b>',
      `📰 Channel: ${channelId ?? '<i>not set</i>'}`,
      `💬 Discussion group: ${groupId ?? '<i>not set</i>'}`,
      `🤖 AI cheerleader: ${aiOff ? '🔴 OFF' : '🟢 ON'}`,
    ];
    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  });

  bot.command('aitoggle', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const current = await isAiDisabled();
    await setAiDisabled(!current);
    await ctx.reply(`AI cheerleader: ${!current ? '🔴 OFF' : '🟢 ON'}`);
  });

  bot.command('refs', async (ctx) => {
    if (!adminOnly(ctx)) return;
    const top: { uid: number; count: number }[] = [];
    for await (const r of iterateReferralCounts()) {
      top.push({ uid: r.inviterUid, count: r.count });
    }
    top.sort((a, b) => b.count - a.count);
    const totalInvited = top.reduce((s, r) => s + r.count, 0);
    if (top.length === 0) {
      await ctx.reply('No referrals yet.');
      return;
    }
    const lines = [`<b>Referrals</b> · ${totalInvited} total`];
    for (let i = 0; i < Math.min(top.length, 20); i++) {
      const r = top[i];
      lines.push(`${i + 1}. <code>${r.uid}</code> — ${r.count}`);
    }
    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  });

  bot.command('myref', async (ctx) => {
    const uid = ctx.from?.id;
    if (!uid) return;
    const me = await ctx.api.getMe();
    const link = `https://t.me/${me.username}?start=ref_${uid}`;
    await ctx.reply(
      `Your referral link:\n<code>${link}</code>\n\nShare it — every new user who taps it will be tied to you.`,
      { parse_mode: 'HTML', link_preview_options: { is_disabled: true } },
    );
  });
}
