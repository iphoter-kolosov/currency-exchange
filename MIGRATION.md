# Going live on bigrate.app

The codebase is wired to assume `https://bigrate.app` is the production
URL. Until DNS is configured the GH Actions workflow overrides
`SITE_BASE` to the GH Pages staging URL so canonical tags and the
sitemap stay accurate. To flip to production:

## 1. DNS (in your registrar)

Point the apex domain at GitHub Pages by adding **A records** for
`bigrate.app` to all four GitHub Pages IPs:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Or, if your registrar supports `ALIAS`/`ANAME` at the apex, point it
to `iphoter-kolosov.github.io`.

For the bare `www.bigrate.app` (optional), add a `CNAME` record pointing
to `iphoter-kolosov.github.io`.

DNS propagation usually completes in 15–60 minutes.

## 2. Tell GitHub Pages about the domain

Repository → **Settings → Pages → Custom domain** → enter `bigrate.app`
→ Save. GitHub will check the DNS, then enforce HTTPS automatically
(Let's Encrypt cert provisioning takes a few minutes).

## 3. Add the CNAME file to the repo

Create `public/CNAME` with one line:

```
bigrate.app
```

This file gets copied into `dist/` by Vite and tells GitHub Pages to
serve under the custom domain on every redeploy. Without it, a fresh
deploy can clear the custom-domain setting.

## 4. Drop the staging override in the workflow

In `.github/workflows/deploy.yml` remove the entire `env:` block under
the build step (the comment in there explains the trigger). The build
will then fall back to `https://bigrate.app` from
`scripts/pair-page-template.mjs`, emitting correct canonical URLs and
sitemap entries.

## 5. Update the bot's admin panel URL

On Deno Deploy → project `currency-exchange` → **Settings → Environment
Variables**:

- `ADMIN_PANEL_URL` = `https://bigrate.app/admin.html`

(Or simply remove the variable — the code default already points at
`bigrate.app/admin.html`.)

## 6. Submit to Google Search Console

Only **after** the above is done:

- Add `https://bigrate.app/` as a property
- Verify via DNS TXT record (preferred) or HTML file
- Submit sitemap: `https://bigrate.app/sitemap.xml`

Indexing usually starts within 7–21 days, with the long-tail queries
(`HUF to KZT`, `EGP to AED`, etc.) showing impressions first.

## 7. Verify

After all the above:

- `curl -I https://bigrate.app/` → 200 OK
- `curl -I https://bigrate.app/pair/usd-to-eur/` → 200 OK
- `curl https://bigrate.app/sitemap.xml | head` → bigrate.app URLs
- Open the bot in Telegram → `/admin` → button opens
  `bigrate.app/admin.html`
- iphoter-kolosov.github.io/currency-exchange/ → 301 redirect to
  bigrate.app (GitHub Pages does this automatically once `CNAME` is
  set), preserving any backlinks Google may have collected during
  staging.

That's it — single deploy after these steps, and we're live.
