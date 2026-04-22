import type { ChatTurn, Lang } from './storage.ts';

export type Intent =
  | { action: 'convert'; amount: number; from: string; to: string }
  | { action: 'rate'; from: string; to: string }
  | { action: 'watch'; base: string }
  | { action: 'chart'; from: string; to: string; tf: string }
  | { action: 'daily_digest'; scope: 'pair' | 'watchlist'; from?: string; to?: string; hour: number; minute: number }
  | { action: 'list_alerts' }
  | { action: 'delete_alert'; base?: string; target?: string; conditionType?: string }
  | { action: 'set_timezone'; tz: string }
  | { action: 'set_language'; lang: 'en' | 'ru' }
  | { action: 'help' }
  | { action: 'chat'; reply: string };

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const REQUEST_TIMEOUT_MS = 9000;

const SUPPORTED_ISO =
  'USD EUR GBP JPY CHF CNY AUD CAD NZD SEK NOK DKK PLN CZK HUF RON BGN TRY UAH RUB BYN KZT GEL AMD AZN ILS AED SAR INR KRW SGD HKD THB VND MYR IDR PHP MXN BRL ARS CLP ZAR EGP NGN BTC ETH';

const SYSTEM_PROMPT = (lang: Lang) =>
  `You are a helpful currency exchange assistant inside a Telegram bot. The user writes in ${
    lang === 'ru' ? 'Russian' : 'English'
  } and may use slang, symbols, or vague phrasing.

Reply with ONE JSON object — no markdown, no code fences, no commentary. Pick the best action:

1. {"action":"convert","amount":<number>,"from":"<ISO>","to":"<ISO>"} — specific amount between two currencies.
2. {"action":"rate","from":"<ISO>","to":"<ISO>"} — current rate only.
3. {"action":"watch","base":"<ISO>"} — show a board of popular currencies against this base.
4. {"action":"chart","from":"<ISO>","to":"<ISO>","tf":"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"2Y"} — history chart. Default tf is 1M.
5. {"action":"daily_digest","scope":"pair"|"watchlist","from":"<ISO>","to":"<ISO>","hour":<0-23>,"minute":<0-59>} — schedule a daily summary. Use scope="pair" with from/to when the user names a specific pair; use scope="watchlist" (omit from/to) when they ask for their whole list. Time is in the user's local hours/minutes.
6. {"action":"list_alerts"} — user wants to see their currently-active alerts and digests ("what alerts do I have?", "какие у меня алерты").
7. {"action":"delete_alert","base":"<ISO>","target":"<ISO>","conditionType":"above"|"below"|"pct_up"|"pct_down"|"daily_digest"} — user wants to remove an alert. Include ONLY the fields they mentioned; omit the rest. Example: "delete EUR/HUF digest" → base=EUR,target=HUF,conditionType=daily_digest. "удали все алерты по евро" → base=EUR (no target).
8. {"action":"set_timezone","tz":"<IANA>"} — user wants to change time zone. Use full IANA names like 'Europe/Prague', 'America/Chicago', 'Asia/Seoul', 'Asia/Bangkok'. If the user names only a country, pick its capital or main financial city. If the city is ambiguous, pick the most likely.
9. {"action":"set_language","lang":"en"|"ru"} — user wants to switch bot language.
10. {"action":"help"} — user asks what the bot can do, how to use it.
11. {"action":"chat","reply":"<short message in ${
    lang === 'ru' ? 'Russian' : 'English'
  }>"} — greetings, off-topic, clarifications, smalltalk.

Currency ISO codes you may use: ${SUPPORTED_ISO}.

Guidelines:
- Map slang to ISO: баксы/bucks→USD, евро/euro→EUR, рубли→RUB, гривны/грн→UAH, фунты→GBP, йены→JPY, юани→CNY, злотые→PLN, тенге→KZT, биток/биткойн→BTC, эфир→ETH.
- Convert spelled-out numbers: "тысяча"→1000, "сотка"→100, "half a million"→500000, "5k"→5000.
- If the user asks "what's up with X?", "как там X?", "сколько X?" — prefer "rate" between X and the user's likely home currency (default USD if unclear).
- If user asks for a chart/graph/история/динамика — use "chart".
- If user sends a single currency name with no context — use "watch" with that currency as base.
- Off-topic or small talk: "chat" with a warm 1-2 sentence reply in ${
    lang === 'ru' ? 'Russian' : 'English'
  }, then gently remind them you track currencies.
- If the input is utter gibberish — "chat" asking politely what they need.
- CONTEXT: previous assistant turns describe what you already did (e.g. "Opened EUR/HUF chart at 1M"). If the user follows up with a short phrase like "а за неделю?", "now in USD?", "и график", resolve the referents from those previous turns. Reuse the same currency pair / amount / timeframe unless the user explicitly changes them.
- NEVER wrap output in \`\`\` or add explanations.`;

type BucketEntry = { count: number; windowStart: number };
const buckets = new Map<number, BucketEntry>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const b = buckets.get(userId);
  if (!b || now - b.windowStart > RATE_WINDOW_MS) {
    buckets.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (b.count >= RATE_LIMIT) return false;
  b.count++;
  return true;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function validateIntent(obj: unknown): Intent | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  switch (o.action) {
    case 'convert': {
      const amount = Number(o.amount);
      if (!isFinite(amount) || amount <= 0) return null;
      if (typeof o.from !== 'string' || typeof o.to !== 'string') return null;
      return { action: 'convert', amount, from: o.from, to: o.to };
    }
    case 'rate': {
      if (typeof o.from !== 'string' || typeof o.to !== 'string') return null;
      return { action: 'rate', from: o.from, to: o.to };
    }
    case 'watch': {
      if (typeof o.base !== 'string') return null;
      return { action: 'watch', base: o.base };
    }
    case 'chart': {
      if (typeof o.from !== 'string' || typeof o.to !== 'string') return null;
      const tf = typeof o.tf === 'string' ? o.tf.toUpperCase() : '1M';
      const allowed = ['1D', '1W', '1M', '3M', '6M', '1Y', '2Y'];
      return {
        action: 'chart',
        from: o.from,
        to: o.to,
        tf: allowed.includes(tf) ? tf : '1M',
      };
    }
    case 'daily_digest': {
      const scope = o.scope === 'watchlist' ? 'watchlist' : 'pair';
      const hour = Number(o.hour);
      const minute = Number(o.minute);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
      if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
      if (scope === 'pair') {
        if (typeof o.from !== 'string' || typeof o.to !== 'string') return null;
        return { action: 'daily_digest', scope, from: o.from, to: o.to, hour, minute };
      }
      return { action: 'daily_digest', scope: 'watchlist', hour, minute };
    }
    case 'list_alerts':
      return { action: 'list_alerts' };
    case 'delete_alert': {
      const out: { action: 'delete_alert'; base?: string; target?: string; conditionType?: string } = { action: 'delete_alert' };
      if (typeof o.base === 'string' && o.base.trim()) out.base = o.base;
      if (typeof o.target === 'string' && o.target.trim()) out.target = o.target;
      if (typeof o.conditionType === 'string' && o.conditionType.trim()) out.conditionType = o.conditionType;
      return out;
    }
    case 'set_timezone': {
      if (typeof o.tz !== 'string' || !o.tz.trim()) return null;
      return { action: 'set_timezone', tz: o.tz };
    }
    case 'set_language': {
      if (o.lang !== 'en' && o.lang !== 'ru') return null;
      return { action: 'set_language', lang: o.lang };
    }
    case 'help':
      return { action: 'help' };
    case 'chat': {
      if (typeof o.reply !== 'string' || !o.reply.trim()) return null;
      return { action: 'chat', reply: o.reply.slice(0, 600) };
    }
    default:
      return null;
  }
}

export async function resolveIntent(
  userText: string,
  lang: Lang,
  userId: number,
  history: ChatTurn[] = [],
): Promise<Intent | null> {
  if (!checkRateLimit(userId)) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(lang) },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: userText.slice(0, 500) },
        ],
        model: 'openai',
        jsonMode: true,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn('pollinations status', res.status);
      return null;
    }
    const body = await res.text();
    const parsed = extractJson(body);
    return validateIntent(parsed);
  } catch (e) {
    console.warn('pollinations failed', e instanceof Error ? e.message : e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const ERROR_PROMPT = (lang: Lang) =>
  `You are a warm, helpful assistant inside a Telegram currency bot. Something went wrong for a user.
Reply in ${lang === 'ru' ? 'Russian' : 'English'}, plain text, no markdown, 1-2 sentences max (under 300 chars):
1. Briefly acknowledge what didn't work in everyday language (no stack traces, no code words, no error IDs).
2. Suggest one concrete next step (retry, different format, contact, or alternative).
Tone: friendly, not robotic. Never reveal internal details or file paths.`;

export async function explainError(
  error: unknown,
  userContext: string,
  lang: Lang,
  userId: number,
): Promise<string | null> {
  if (!checkRateLimit(userId)) return null;
  const errMsg = error instanceof Error ? error.message : String(error);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: ERROR_PROMPT(lang) },
          {
            role: 'user',
            content:
              `User was trying to: ${userContext}\nTechnical error (internal, do not quote): ${errMsg.slice(0, 300)}\nWrite the friendly explanation now.`,
          },
        ],
        model: 'openai',
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const body = (await res.text()).trim();
    if (!body) return null;
    return body.slice(0, 400);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
