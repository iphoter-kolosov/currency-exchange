import type { Bot } from 'grammy';
import type { BotCtx } from '../bot.ts';
import { iterateAllAlerts, iterateAllUsers } from '../services/storage.ts';

const ADMIN_USER_ID = 437010992;

export function registerStats(bot: Bot<BotCtx>): void {
  bot.command('stats', async (ctx) => {
    if (ctx.from?.id !== ADMIN_USER_ID) return;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    let total = 0;
    let onboarded = 0;
    let dau = 0;
    let wau = 0;
    let mau = 0;
    const langs: Record<string, number> = {};

    for await (const u of iterateAllUsers()) {
      total++;
      if (u.onboarded) onboarded++;
      const idle = now - (u.lastActiveAt ?? 0);
      if (idle <= day) dau++;
      if (idle <= 7 * day) wau++;
      if (idle <= 30 * day) mau++;
      langs[u.lang] = (langs[u.lang] ?? 0) + 1;
    }

    let activeAlerts = 0;
    const alertUserIds = new Set<number>();
    for await (const a of iterateAllAlerts()) {
      if (a.active) {
        activeAlerts++;
        alertUserIds.add(a.userId);
      }
    }

    const langLine = Object.entries(langs)
      .sort(([, a], [, b]) => b - a)
      .map(([k, v]) => `${k} ${v}`)
      .join(' · ') || '—';

    const onboardedPct = total > 0 ? Math.round((onboarded / total) * 100) : 0;

    const lines = [
      '<b>Bot stats</b>',
      `👥 Users: <b>${total}</b>`,
      `🟢 DAU: <b>${dau}</b>  📅 WAU: <b>${wau}</b>  🌙 MAU: <b>${mau}</b>`,
      `✅ Onboarded: <b>${onboarded}</b> (${onboardedPct}%)`,
      `🌐 Langs: ${langLine}`,
      `🔔 Active alerts: <b>${activeAlerts}</b> across ${alertUserIds.size} user(s)`,
    ];

    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
  });
}
