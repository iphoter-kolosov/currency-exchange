# Currency Tracker Bot

Telegram bot for live currency rates, conversion, historical charts, and price alerts.

## Stack

- **Runtime**: Deno Deploy
- **Framework**: [grammY](https://grammy.dev/)
- **Storage**: Deno KV
- **Rates**: [@fawazahmed0/currency-api](https://github.com/fawazahmed0/exchange-api) via jsDelivr
- **Charts**: [QuickChart.io](https://quickchart.io)
- **Alerts scheduler**: `Deno.cron` (every 5 minutes)

## Local development

1. Copy env template and fill in the bot token:
   ```sh
   cp .env.example .env
   # Put BOT_TOKEN from @BotFather
   ```
2. Run in polling mode is not configured here (webhook-first); you can either:
   - Expose `deno task dev` via `ngrok` / Cloudflare Tunnel and call `/setup?token=…&url=…` once.
   - Or run in webhook mode directly on Deno Deploy (preferred).

## Deployment (Deno Deploy)

1. Create a new App in Deno Deploy pointing at this repo.
2. Set **entrypoint** to `bot/src/main.ts`.
3. Under env variables add:
   - `BOT_TOKEN` — from @BotFather
   - `WEBHOOK_SECRET` — any random string (generate with `openssl rand -hex 16`)
   - `PUBLIC_URL` — your Deno Deploy production URL, e.g. `https://currency-bot.iphoter-kolosov.deno.net`
4. After first deploy, visit once:
   ```
   https://<your-url>/setup?token=<WEBHOOK_SECRET>
   ```
   This registers the webhook with Telegram and sets the bot commands.
5. Open the bot in Telegram — it's alive.

## Endpoints

- `POST /bot` — Telegram webhook (authenticated by `WEBHOOK_SECRET`).
- `GET /setup?token=<secret>&url=<optional>` — one-time webhook registration.
- `GET /cron/check-alerts?token=<secret>` — manual alerts trigger (also auto-run every 5 min).
- `GET /health` — liveness check.
- `GET /` — public landing page with a link to the bot.

## Cron

`Deno.cron` runs every 5 minutes, fetches current rates for each unique base, and re-evaluates all active alerts. Alerts re-trigger at most once per hour per user.

## Commands

- `/start` — main menu
- `/convert 100 usd eur` — convert amounts
- `/watch` — watchlist with live rates
- `/chart eur usd 1m` — chart pair + timeframe (`1d|1w|1m|3m|6m|1y|2y`)
- `/alerts` — list/manage alerts, create new via inline buttons
- `/alert` — direct create-alert flow
- `/settings` — language
- `/help` — user guide

Free-form text is also parsed: `100 usd eur`, `1500 uah в rub`, `50€ в $`, `eur usd`.

## Inline mode

`@your_bot 100 usd eur` in any chat returns a conversion card.

## Monetization (future)

Stars (Telegram's native micropayments) unlock:
- Unlimited active alerts (free limit = 5)
- 1-minute alert polling (default = 5 minutes)
- Exotic pairs, chart history beyond 2 years
- Priority queue for notification delivery
