import { getKv } from './storage.ts';

export const ADMIN_USER_ID = 437010992;

const K_CONFIG_CHANNEL = ['config', 'news_channel_id'] as const;
const K_CONFIG_GROUP = ['config', 'discussion_group_id'] as const;
const K_CONFIG_AI_DISABLED = ['config', 'ai_disabled'] as const;
const K_SPONSORED_POST = (channelMsgId: number) => ['sponsored_post', channelMsgId] as const;
const K_SPONSORED_THREAD = (discussionMsgId: number) => ['sponsored_thread', discussionMsgId] as const;
const K_AI_THROTTLE = (userId: number) => ['ai_throttle', userId] as const;
const K_AI_GLOBAL_BUCKET = ['ai_global_bucket'] as const;
const K_REFERRER = (invitedUid: number) => ['referrer', invitedUid] as const;
const K_REF_COUNT = (inviterUid: number) => ['ref_count', inviterUid] as const;

const SPONSORED_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const THROTTLE_PER_USER_MS = 60_000;
const GLOBAL_RATE_PER_MIN = 30;

export type SponsoredPost = {
  channelMsgId: number;
  sponsor: string;
  postedAt: number;
};

export async function getNewsChannelId(): Promise<number | null> {
  const kv = await getKv();
  const fromKv = await kv.get<number>(K_CONFIG_CHANNEL);
  if (fromKv.value !== null) return fromKv.value;
  const fromEnv = Deno.env.get('NEWS_CHANNEL_ID');
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function getDiscussionGroupId(): Promise<number | null> {
  const kv = await getKv();
  const fromKv = await kv.get<number>(K_CONFIG_GROUP);
  if (fromKv.value !== null) return fromKv.value;
  const fromEnv = Deno.env.get('DISCUSSION_GROUP_ID');
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function setNewsChannelId(id: number): Promise<void> {
  const kv = await getKv();
  await kv.set(K_CONFIG_CHANNEL, id);
}

export async function setDiscussionGroupId(id: number): Promise<void> {
  const kv = await getKv();
  await kv.set(K_CONFIG_GROUP, id);
}

export async function isAiDisabled(): Promise<boolean> {
  const kv = await getKv();
  const e = await kv.get<boolean>(K_CONFIG_AI_DISABLED);
  return e.value === true;
}

export async function setAiDisabled(disabled: boolean): Promise<void> {
  const kv = await getKv();
  await kv.set(K_CONFIG_AI_DISABLED, disabled);
}

export async function markSponsoredPost(channelMsgId: number, sponsor: string): Promise<void> {
  const kv = await getKv();
  const value: SponsoredPost = { channelMsgId, sponsor, postedAt: Date.now() };
  await kv.set(K_SPONSORED_POST(channelMsgId), value, { expireIn: SPONSORED_TTL_MS });
}

export async function getSponsoredPost(channelMsgId: number): Promise<SponsoredPost | null> {
  const kv = await getKv();
  const e = await kv.get<SponsoredPost>(K_SPONSORED_POST(channelMsgId));
  return e.value;
}

export async function markSponsoredThread(discussionMsgId: number): Promise<void> {
  const kv = await getKv();
  await kv.set(K_SPONSORED_THREAD(discussionMsgId), true, { expireIn: SPONSORED_TTL_MS });
}

export async function isSponsoredThread(discussionMsgId: number): Promise<boolean> {
  const kv = await getKv();
  const e = await kv.get<boolean>(K_SPONSORED_THREAD(discussionMsgId));
  return e.value === true;
}

export async function tryAcquireUserThrottle(userId: number): Promise<boolean> {
  const kv = await getKv();
  const e = await kv.get<number>(K_AI_THROTTLE(userId));
  if (e.value !== null) return false;
  await kv.set(K_AI_THROTTLE(userId), Date.now(), { expireIn: THROTTLE_PER_USER_MS });
  return true;
}

const globalBucket = { count: 0, windowStart: 0 };

export function tryAcquireGlobalRate(): boolean {
  const now = Date.now();
  if (now - globalBucket.windowStart > 60_000) {
    globalBucket.count = 1;
    globalBucket.windowStart = now;
    return true;
  }
  if (globalBucket.count >= GLOBAL_RATE_PER_MIN) return false;
  globalBucket.count++;
  return true;
}

export async function setReferrer(invitedUid: number, inviterUid: number): Promise<boolean> {
  if (invitedUid === inviterUid) return false;
  const kv = await getKv();
  const existing = await kv.get<number>(K_REFERRER(invitedUid));
  if (existing.value !== null) return false;
  const ok = await kv.atomic()
    .check(existing)
    .set(K_REFERRER(invitedUid), inviterUid)
    .commit();
  if (!ok.ok) return false;
  await kv.atomic().sum(K_REF_COUNT(inviterUid), 1n).commit();
  return true;
}

export async function getReferrer(invitedUid: number): Promise<number | null> {
  const kv = await getKv();
  const e = await kv.get<number>(K_REFERRER(invitedUid));
  return e.value;
}

export async function getReferralCount(inviterUid: number): Promise<number> {
  const kv = await getKv();
  const e = await kv.get<Deno.KvU64>(K_REF_COUNT(inviterUid));
  if (e.value === null) return 0;
  return Number(e.value.value);
}

export async function* iterateReferralCounts(): AsyncGenerator<{ inviterUid: number; count: number }> {
  const kv = await getKv();
  for await (const entry of kv.list<Deno.KvU64>({ prefix: ['ref_count'] })) {
    const inviterUid = entry.key[1] as number;
    yield { inviterUid, count: Number(entry.value.value) };
  }
}

export async function* iterateReferrals(): AsyncGenerator<{ invitedUid: number; inviterUid: number }> {
  const kv = await getKv();
  for await (const entry of kv.list<number>({ prefix: ['referrer'] })) {
    const invitedUid = entry.key[1] as number;
    yield { invitedUid, inviterUid: entry.value };
  }
}

export function isAdmin(userId: number | undefined): boolean {
  return userId === ADMIN_USER_ID;
}
