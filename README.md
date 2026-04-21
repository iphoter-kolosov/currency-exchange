# Currency

Live currency converter PWA inspired by the Currency app — works on phone and computer, installable to the home screen, with historical charts between any two currencies.

## Features

- Live exchange rates for ~40 currencies (daily ECB/public-data snapshots).
- Edit amount in any row — the whole list re-computes instantly.
- Add / remove currencies from a searchable picker.
- Chart view with timeframes: 1D / 1W / 1M / 3M / 6M / 1Y / 2Y.
- Dark theme with green accents. Responsive: phone-width column on desktop too.
- Russian + English UI with switcher in the `⋯` menu.
- PWA: installable, works offline with the last cached rates.

## Develop locally

```sh
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The Vite dev server is reachable on your LAN at `http://<your-ip>:5173` (add `--host` if needed).

## Build

```sh
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push to `main` — the `.github/workflows/deploy.yml` workflow builds and deploys automatically.
2. One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The app will be served at `https://<user>.github.io/currency-exchange/`.

If the repo is renamed, update the `base` option in `vite.config.ts` to match the new path.

## Data source

Exchange rates come from [`@fawazahmed0/currency-api`](https://github.com/fawazahmed0/exchange-api), served through the jsDelivr CDN. No API key required. Historical data is fetched on-demand and cached in IndexedDB (historical snapshots are immutable).

## Tech stack

- Vite + React + TypeScript
- Zustand (state + localStorage persistence)
- Recharts (chart)
- flag-icons (flags)
- vite-plugin-pwa (manifest + Workbox service worker)
