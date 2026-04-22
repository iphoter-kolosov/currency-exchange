import type { ChatTurn, Lang } from './storage.ts';
import { languageName } from '../i18n/index.ts';
import { withLlmSemaphore } from './queue.ts';

export type Intent =
  | { action: 'convert'; amount: number; from: string; to: string }
  | { action: 'rate'; from: string; to: string }
  | { action: 'watch'; base: string }
  | { action: 'chart'; from: string; to: string; tf: string }
  | { action: 'daily_digest'; scope: 'pair' | 'watchlist'; from?: string; to?: string; hour: number; minute: number }
  | { action: 'list_alerts' }
  | { action: 'delete_alert'; base?: string; target?: string; conditionType?: string; all?: boolean }
  | { action: 'set_timezone'; tz: string }
  | { action: 'set_language'; lang: string }
  | { action: 'reset' }
  | { action: 'help' }
  | { action: 'compound'; summary: string; steps: Intent[] }
  | { action: 'chat'; reply: string };

export type AtomicIntent = Exclude<Intent, { action: 'compound' }>;

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const REQUEST_TIMEOUT_MS = 15_000;

const SUPPORTED_ISO =
  'USD EUR GBP JPY CHF CNY AUD CAD NZD SEK NOK DKK PLN CZK HUF RON BGN TRY UAH RUB BYN KZT GEL AMD AZN ILS AED SAR INR KRW SGD HKD THB VND MYR IDR PHP MXN BRL ARS CLP ZAR EGP NGN BTC ETH';

const SYSTEM_PROMPT = (lang: Lang) =>
  `You are a helpful currency exchange assistant inside a Telegram bot. The user writes in ${
    languageName(lang)
  } and may use slang, symbols, or vague phrasing.

Reply with ONE JSON object — no markdown, no code fences, no commentary. Pick the best action:

1. {"action":"convert","amount":<number>,"from":"<ISO>","to":"<ISO>"} — specific amount between two currencies.
2. {"action":"rate","from":"<ISO>","to":"<ISO>"} — current rate only.
3. {"action":"watch","base":"<ISO>"} — show a board of popular currencies against this base.
4. {"action":"chart","from":"<ISO>","to":"<ISO>","tf":"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"2Y"} — history chart. Default tf is 1M.
5. {"action":"daily_digest","scope":"pair"|"watchlist","from":"<ISO>","to":"<ISO>","hour":<0-23>,"minute":<0-59>} — schedule a daily summary. Use scope="pair" with from/to when the user names a specific pair; use scope="watchlist" (omit from/to) when they ask for their whole list. Time is in the user's local hours/minutes.
   HARD RULES for daily_digest:
   • NEVER invent the time. If the user did not mention a concrete hour (e.g. "в 9 утра", "at 18:30", "каждое утро в 7"), DO NOT return daily_digest — return "chat" asking which time they want.
   • If the user said scope "pair" but didn't name a currency pair, DO NOT guess — return "chat" asking which pair.
   • "каждый день" / "every day" / "каждое утро" alone are NOT enough to commit; still ask for the time.
   • "утро/morning" without a number is ambiguous — ask.
6. {"action":"list_alerts"} — user wants to see their currently-active alerts and digests ("what alerts do I have?", "какие у меня алерты").
7. {"action":"delete_alert","base":"<ISO>","target":"<ISO>","conditionType":"above"|"below"|"pct_up"|"pct_down"|"daily_digest","all":<bool>} — user wants to remove an alert. Include ONLY the fields they mentioned; omit the rest. If the user says "delete all" / "удали все" / "remove everything" / "снеси всё", set "all":true (and skip base/target/conditionType unless they also narrowed it). Examples: "delete EUR/HUF digest" → base=EUR,target=HUF,conditionType=daily_digest. "удали все алерты по евро" → base=EUR,all=true. "remove all my alerts" → all=true.
8. {"action":"set_timezone","tz":"<IANA>"} — user wants to change time zone. Use full IANA names like 'Europe/Prague', 'America/Chicago', 'Asia/Seoul', 'Asia/Bangkok'. If the user names only a country, pick its capital or main financial city. If the city is ambiguous, pick the most likely.
9. {"action":"set_language","lang":"<BCP-47 code>"} — user wants to switch bot language. Use ISO 639-1 codes like "en", "ru", "uk", "de", "fr", "es", "it", "pt", "pl", "cs", "tr", "ja", "zh", "ar", "he". The bot has full menu translations only for "en" and "ru"; for any other code the menus stay in English but your free-form replies are in that language.
10. {"action":"reset"} — user wants to wipe all their bot data and start over ("reset everything", "сбрось всё", "начать с нуля", "delete my account").
11. {"action":"help"} — user asks what the bot can do, how to use it.
12. {"action":"compound","summary":"<one-paragraph plain-language summary of the whole plan in the user's language>","steps":[<2 to 5 atomic intents>]} — the user asked for TWO OR MORE related actions in one message. Examples:
    • "Нужна сводка в 17:00 по Берлину в паре EUR/HUF" when user's current tz is NOT Europe/Berlin → steps = [set_timezone(Europe/Berlin), daily_digest(pair, EUR, HUF, 17, 0)].
    • "Switch to English and delete all my alerts" → steps = [set_language(en), delete_alert(all=true)].
    NEVER nest compound inside steps. NEVER use compound for a single action. The summary must plainly list what will happen so the user can confirm.
13. {"action":"chat","reply":"<short message in ${
    languageName(lang)
  }>"} — greetings, off-topic, clarifications, smalltalk.

Currency ISO codes you may use: ${SUPPORTED_ISO}.

Guidelines:
- Map slang to ISO: баксы/bucks→USD, евро/euro→EUR, рубли→RUB, гривны/грн→UAH, фунты→GBP, йены→JPY, юани→CNY, злотые→PLN, тенге→KZT, биток/биткойн→BTC, эфир→ETH.
- Convert spelled-out numbers: "тысяча"→1000, "сотка"→100, "half a million"→500000, "5k"→5000.
- If the user asks "what's up with X?", "как там X?", "сколько X?" — prefer "rate" between X and the user's likely home currency (default USD if unclear).
- If user asks for a chart/graph/история/динамика — use "chart".
- If user sends a single currency name with no context — use "watch" with that currency as base.
- Off-topic or small talk: "chat" with a warm 1-2 sentence reply in ${
    languageName(lang)
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

export function validateIntent(obj: unknown): Intent | null {
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
      const out: { action: 'delete_alert'; base?: string; target?: string; conditionType?: string; all?: boolean } = { action: 'delete_alert' };
      if (typeof o.base === 'string' && o.base.trim()) out.base = o.base;
      if (typeof o.target === 'string' && o.target.trim()) out.target = o.target;
      if (typeof o.conditionType === 'string' && o.conditionType.trim()) out.conditionType = o.conditionType;
      if (o.all === true) out.all = true;
      return out;
    }
    case 'reset':
      return { action: 'reset' };
    case 'compound': {
      if (typeof o.summary !== 'string' || !o.summary.trim()) return null;
      if (!Array.isArray(o.steps) || o.steps.length < 2 || o.steps.length > 6) return null;
      const steps: AtomicIntent[] = [];
      for (const raw of o.steps) {
        const validated = validateIntent(raw);
        if (!validated) return null;
        if (validated.action === 'compound') return null;
        steps.push(validated as AtomicIntent);
      }
      return { action: 'compound', summary: o.summary.slice(0, 600), steps };
    }
    case 'set_timezone': {
      if (typeof o.tz !== 'string' || !o.tz.trim()) return null;
      return { action: 'set_timezone', tz: o.tz };
    }
    case 'set_language': {
      if (typeof o.lang !== 'string' || !o.lang.trim()) return null;
      // Keep it to a reasonable BCP-47 shape: letters, digits, hyphen, up to 12 chars.
      const lang = o.lang.slice(0, 12);
      if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})?$/.test(lang)) return null;
      return { action: 'set_language', lang };
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
  if (!checkRateLimit(userId)) {
    console.warn('pollinations: rate limit for user', userId);
    return null;
  }

  const body = JSON.stringify({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT(lang) },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: userText.slice(0, 500) },
    ],
    model: 'openai',
    jsonMode: true,
  });

  return await withLlmSemaphore(async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(POLLINATIONS_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          signal: ctrl.signal,
        });
        if (!res.ok) {
          console.warn(`pollinations attempt ${attempt}: status ${res.status}`);
          if ((res.status >= 500 || res.status === 429) && attempt === 0) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          return null;
        }
        const text = await res.text();
        const parsed = extractJson(text);
        const intent = validateIntent(parsed);
        if (!intent) {
          console.warn(`pollinations attempt ${attempt}: unparseable response`, text.slice(0, 200));
          return null;
        }
        return intent;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`pollinations attempt ${attempt}: ${msg}`);
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        return null;
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  });
}

const ERROR_PROMPT = (lang: Lang) =>
  `You are a warm, helpful assistant inside a Telegram currency bot. Something went wrong for a user.
Reply in ${languageName(lang)}, plain text, no markdown, 1-2 sentences max (under 300 chars):
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

  return await withLlmSemaphore(async () => {
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
  });
}
