import type { Bot } from 'grammy';
import type { BotCtx } from './bot.ts';
import {
  ADMIN_USER_ID,
  addBetaTester,
  getDiscussionGroupId,
  getNewsChannelId,
  isAiDisabled,
  isAiPublic,
  iterateBetaTesters,
  iterateReferralCounts,
  markSponsoredPost,
  removeBetaTester,
  setAiDisabled,
  setAiPublic,
  setDiscussionGroupId,
  setNewsChannelId,
} from './services/news.ts';
import { iterateAllAlerts, iterateAllUsers } from './services/storage.ts';

const enc = new TextEncoder();

/** Telegram WebApp initData validation per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Returns the validated user id, or null if anything is off. */
export async function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 24 * 60 * 60,
): Promise<{ userId: number; firstName?: string } | null> {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => [k, v] as [string, string])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const webAppDataKey = await crypto.subtle.importKey(
    'raw',
    enc.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const secret = new Uint8Array(
    await crypto.subtle.sign('HMAC', webAppDataKey, enc.encode(botToken)),
  );

  const secretKey = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', secretKey, enc.encode(dataCheckString)),
  );
  const computed = [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (!timingSafeEqual(computed, hash)) return null;

  const authDate = Number(params.get('auth_date') ?? '0');
  if (!Number.isFinite(authDate)) return null;
  const ageSec = Math.floor(Date.now() / 1000) - authDate;
  if (ageSec > maxAgeSec || ageSec < -60) return null;

  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    const user = JSON.parse(userJson) as { id?: number; first_name?: string };
    if (!user.id || typeof user.id !== 'number') return null;
    return { userId: user.id, firstName: user.first_name };
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return acc === 0;
}

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, x-telegram-init-data',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '86400',
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

async function gatherStats() {
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
  let totalReferrals = 0;
  let referrers = 0;
  const topReferrers: { uid: number; count: number }[] = [];
  for await (const r of iterateReferralCounts()) {
    totalReferrals += r.count;
    referrers++;
    topReferrers.push({ uid: r.inviterUid, count: r.count });
  }
  topReferrers.sort((a, b) => b.count - a.count);
  return {
    users: { total, onboarded, dau, wau, mau, langs },
    alerts: { active: activeAlerts, users: alertUserIds.size },
    referrals: { total: totalReferrals, inviters: referrers, top: topReferrers.slice(0, 10) },
  };
}

async function gatherConfig() {
  const channelId = await getNewsChannelId();
  const groupId = await getDiscussionGroupId();
  const aiOff = await isAiDisabled();
  const aiPub = await isAiPublic();
  const testers: number[] = [];
  for await (const id of iterateBetaTesters()) testers.push(id);
  return {
    channelId,
    groupId,
    aiOn: !aiOff,
    aiPublic: aiPub,
    testers,
  };
}

export function makeAdminApiHandler(bot: Bot<BotCtx>, botToken: string) {
  return async function (req: Request, url: URL): Promise<Response | null> {
    if (!url.pathname.startsWith('/api/admin/')) return null;

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const initData = req.headers.get('x-telegram-init-data') ?? '';
    const auth = await validateInitData(initData, botToken);
    if (!auth || auth.userId !== ADMIN_USER_ID) {
      return json({ error: 'unauthorized' }, 401);
    }

    const path = url.pathname.replace('/api/admin/', '');

    try {
      if (path === 'state' && req.method === 'GET') {
        const [stats, config] = await Promise.all([gatherStats(), gatherConfig()]);
        return json({ stats, config });
      }

      if (path === 'post' && req.method === 'POST') {
        const body = await req.json() as { body?: string };
        if (!body.body || typeof body.body !== 'string') {
          return json({ error: 'body required' }, 400);
        }
        const channelId = await getNewsChannelId();
        if (!channelId) return json({ error: 'channel not configured' }, 400);
        const sent = await bot.api.sendMessage(channelId, body.body, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: false },
        });
        return json({ messageId: sent.message_id });
      }

      if (path === 'postsponsored' && req.method === 'POST') {
        const body = await req.json() as { sponsor?: string; body?: string };
        if (!body.sponsor || !body.body) {
          return json({ error: 'sponsor and body required' }, 400);
        }
        const channelId = await getNewsChannelId();
        if (!channelId) return json({ error: 'channel not configured' }, 400);
        const escaped = body.sponsor
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const composed = `📢 <b>Партнёрский материал</b> · ${escaped}\n\n${body.body}`;
        const sent = await bot.api.sendMessage(channelId, composed, {
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: false },
        });
        await markSponsoredPost(sent.message_id, body.sponsor);
        return json({ messageId: sent.message_id });
      }

      if (path === 'setchannel' && req.method === 'POST') {
        const body = await req.json() as { id?: number };
        if (!Number.isFinite(body.id)) return json({ error: 'id required' }, 400);
        await setNewsChannelId(body.id as number);
        return json({ ok: true });
      }

      if (path === 'setgroup' && req.method === 'POST') {
        const body = await req.json() as { id?: number };
        if (!Number.isFinite(body.id)) return json({ error: 'id required' }, 400);
        await setDiscussionGroupId(body.id as number);
        return json({ ok: true });
      }

      if (path === 'aitoggle' && req.method === 'POST') {
        const cur = await isAiDisabled();
        await setAiDisabled(!cur);
        return json({ aiOn: cur });
      }

      if (path === 'aipublic' && req.method === 'POST') {
        const cur = await isAiPublic();
        await setAiPublic(!cur);
        return json({ aiPublic: !cur });
      }

      if (path === 'testers/add' && req.method === 'POST') {
        const body = await req.json() as { userId?: number };
        if (!Number.isFinite(body.userId)) return json({ error: 'userId required' }, 400);
        await addBetaTester(body.userId as number);
        return json({ ok: true });
      }

      if (path === 'testers/remove' && req.method === 'POST') {
        const body = await req.json() as { userId?: number };
        if (!Number.isFinite(body.userId)) return json({ error: 'userId required' }, 400);
        await removeBetaTester(body.userId as number);
        return json({ ok: true });
      }

      return json({ error: 'not found' }, 404);
    } catch (e) {
      console.error('admin api error', e);
      const msg = e instanceof Error ? e.message : String(e);
      return json({ error: msg }, 500);
    }
  };
}
