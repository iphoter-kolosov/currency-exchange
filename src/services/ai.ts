import type { Language } from '../i18n';

export type Intent =
  | { action: 'convert'; amount: number; from: string; to: string }
  | { action: 'rate'; from: string; to: string }
  | { action: 'watch'; base: string }
  | { action: 'chart'; from: string; to: string; tf: string }
  | { action: 'chat'; reply: string };

const POLLINATIONS_URL = 'https://text.pollinations.ai/';
const REQUEST_TIMEOUT_MS = 9000;

const SUPPORTED_ISO =
  'USD EUR GBP JPY CHF CNY AUD CAD NZD SEK NOK DKK PLN CZK HUF RON BGN TRY UAH RUB BYN KZT GEL AMD AZN ILS AED SAR INR KRW SGD HKD THB VND MYR IDR PHP MXN BRL ARS CLP ZAR EGP NGN BTC ETH';

const SYSTEM_PROMPT = (lang: Language) =>
  `You are a helpful currency exchange assistant inside a web app. The user writes in ${
    lang === 'ru' ? 'Russian' : 'English'
  } and may use slang, symbols, or vague phrasing.

Reply with ONE JSON object — no markdown, no code fences, no commentary. Pick the best action:

1. {"action":"convert","amount":<number>,"from":"<ISO>","to":"<ISO>"} — specific amount between two currencies.
2. {"action":"rate","from":"<ISO>","to":"<ISO>"} — current rate only.
3. {"action":"watch","base":"<ISO>"} — set this currency as the active source (user wants to see everything relative to it).
4. {"action":"chart","from":"<ISO>","to":"<ISO>","tf":"1D"|"1W"|"1M"|"3M"|"6M"|"1Y"|"2Y"} — open the history chart. Default tf is 1M.
5. {"action":"chat","reply":"<short message in ${
    lang === 'ru' ? 'Russian' : 'English'
  }>"} — greetings, off-topic, clarifications, smalltalk.

Currency ISO codes you may use: ${SUPPORTED_ISO}.

Guidelines:
- Map slang to ISO: баксы/bucks→USD, евро/euro→EUR, рубли→RUB, гривны/грн→UAH, фунты→GBP, йены→JPY, юани→CNY, злотые→PLN, тенге→KZT, биток/биткойн→BTC, эфир→ETH.
- Convert spelled-out numbers: "тысяча"→1000, "сотка"→100, "5k"→5000, "half a million"→500000.
- If the user asks "what's up with X?" / "как там X?" — prefer "rate" between X and USD unless another currency is mentioned.
- If the user asks for a chart/graph/история/динамика — use "chart".
- Off-topic or small talk: "chat" with a warm 1-2 sentence reply in ${
    lang === 'ru' ? 'Russian' : 'English'
  }, then gently remind them you track currencies.
- If the input is utter gibberish — "chat" asking politely what they need.
- NEVER wrap output in \`\`\` or add explanations.`;

type BucketEntry = { count: number; windowStart: number };
const bucket: BucketEntry = { count: 0, windowStart: 0 };
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 15;

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - bucket.windowStart > RATE_WINDOW_MS) {
    bucket.count = 1;
    bucket.windowStart = now;
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count++;
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
    case 'chat': {
      if (typeof o.reply !== 'string' || !o.reply.trim()) return null;
      return { action: 'chat', reply: o.reply.slice(0, 500) };
    }
    default:
      return null;
  }
}

export async function resolveIntent(userText: string, lang: Language): Promise<Intent | null> {
  if (!checkRateLimit()) return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(lang) },
          { role: 'user', content: userText.slice(0, 500) },
        ],
        model: 'openai',
        jsonMode: true,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const body = await res.text();
    const parsed = extractJson(body);
    return validateIntent(parsed);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
