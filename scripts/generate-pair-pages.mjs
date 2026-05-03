#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { CURRENCIES } from './pair-data.mjs';
import { indexHtml, pairPageHtml, robotsTxt, sitemapXml } from './pair-page-template.mjs';

const DIST = process.env.DIST || './dist';
const PAIR_DIR = path.join(DIST, 'pair');

const CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
const CDN_FALLBACK = 'https://currency-api.pages.dev/v1/currencies';

async function fetchRates(code) {
  for (const base of [CDN_PRIMARY, CDN_FALLBACK]) {
    try {
      const res = await fetch(`${base}/${code}.json`);
      if (!res.ok) continue;
      const data = await res.json();
      const rates = data?.[code];
      if (rates && typeof rates === 'object') return rates;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const builtAt = new Date().toISOString();
  console.log(`[pair-pages] generating into ${PAIR_DIR}`);
  await ensureDir(PAIR_DIR);

  const allRates = {};
  console.log(`[pair-pages] fetching live rates for ${CURRENCIES.length} currencies…`);
  let fetched = 0;
  let failed = 0;
  await Promise.all(
    CURRENCIES.map(async (c) => {
      const r = await fetchRates(c.code);
      if (r) {
        allRates[c.code] = r;
        fetched++;
      } else {
        failed++;
      }
    }),
  );
  console.log(`[pair-pages] fetched=${fetched} failed=${failed}`);

  const slugs = [];
  let written = 0;
  let withRate = 0;
  for (const from of CURRENCIES) {
    for (const to of CURRENCIES) {
      if (from.code === to.code) continue;
      const rate = allRates[from.code]?.[to.code] ?? null;
      // Always generate the page even if the build-time fetch failed for this
      // pair. The runtime JS retries against the same CDNs, so a transient
      // network failure during the build doesn't shrink the indexed surface.
      if (rate !== null) withRate++;
      const slug = `${from.code}-to-${to.code}`;
      const dir = path.join(PAIR_DIR, slug);
      await ensureDir(dir);
      const html = pairPageHtml({ from, to, rate, builtAt });
      await fs.writeFile(path.join(dir, 'index.html'), html, 'utf8');
      slugs.push(slug);
      written++;
    }
  }
  console.log(`[pair-pages] pair pages written=${written} (with snapshot rate: ${withRate})`);

  await fs.writeFile(path.join(PAIR_DIR, 'index.html'), indexHtml(written), 'utf8');
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml(slugs), 'utf8');
  await fs.writeFile(path.join(DIST, 'robots.txt'), robotsTxt(), 'utf8');
  console.log(`[pair-pages] index, sitemap.xml, robots.txt written`);
}

main().catch((e) => {
  console.error('[pair-pages] failed:', e);
  process.exit(1);
});
