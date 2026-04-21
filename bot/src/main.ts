import { webhookCallback } from 'grammy';
import { createBot, setBotCommands } from './bot.ts';
import { checkAlerts } from './cron.ts';

const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? 'dev-secret';
const PUBLIC_URL = Deno.env.get('PUBLIC_URL');

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN env var is required');
  Deno.exit(1);
}

const bot = createBot(BOT_TOKEN);
const handleUpdate = webhookCallback(bot, 'std/http', {
  secretToken: WEBHOOK_SECRET,
});

try {
  Deno.cron('check-alerts', '*/5 * * * *', async () => {
    try {
      const stats = await checkAlerts(bot);
      if (stats.fired > 0 || stats.checked > 0) {
        console.log(`cron: checked=${stats.checked} fired=${stats.fired}`);
      }
    } catch (e) {
      console.error('cron failed', e);
    }
  });
} catch (e) {
  console.warn('Deno.cron not available (local dev?):', e instanceof Error ? e.message : e);
}

async function setupWebhook(publicUrl: string): Promise<Response> {
  const url = `${publicUrl.replace(/\/+$/, '')}/bot`;
  await bot.api.setWebhook(url, {
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ['message', 'callback_query', 'inline_query'],
    drop_pending_updates: false,
  });
  await setBotCommands(bot);
  return new Response(`Webhook set to ${url}`, { status: 200 });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'POST' && url.pathname === '/bot') {
    try {
      return await handleUpdate(req);
    } catch (e) {
      console.error('webhook error', e);
      return new Response('error', { status: 500 });
    }
  }

  if (req.method === 'GET' && url.pathname === '/setup') {
    const token = url.searchParams.get('token');
    if (token !== WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 });
    }
    const pub = url.searchParams.get('url') ?? PUBLIC_URL ?? `${url.protocol}//${url.host}`;
    return await setupWebhook(pub);
  }

  if (req.method === 'GET' && url.pathname === '/cron/check-alerts') {
    const token = url.searchParams.get('token');
    if (token !== WEBHOOK_SECRET) {
      return new Response('forbidden', { status: 403 });
    }
    const stats = await checkAlerts(bot);
    return new Response(JSON.stringify(stats), {
      headers: { 'content-type': 'application/json' },
    });
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return new Response('ok', { status: 200 });
  }

  if (req.method === 'GET' && url.pathname === '/') {
    const me = await bot.api.getMe().catch(() => null);
    const name = me?.username ? `@${me.username}` : 'currency bot';
    return new Response(
      `<!doctype html><meta charset=utf-8><title>${name}</title>` +
      `<body style="background:#0a0a0a;color:#fff;font-family:system-ui;padding:40px;text-align:center">` +
      `<h1>${name}</h1>` +
      `<p>Currency tracker Telegram bot.</p>` +
      `${me?.username ? `<p><a href="https://t.me/${me.username}" style="color:#22c55e">Open in Telegram →</a></p>` : ''}` +
      `</body>`,
      { headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  return new Response('not found', { status: 404 });
});
