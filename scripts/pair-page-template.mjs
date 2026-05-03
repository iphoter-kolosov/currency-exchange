import { CURRENCY_BY_CODE, MAJORS } from './pair-data.mjs';

const BOT_USERNAME = process.env.BOT_USERNAME || 'bigrate_exchange_bot';
// Default targets the production domain. CI overrides this with the GH
// Pages staging URL until DNS for bigrate.app is configured. To go live:
// drop the env override in deploy.yml and add public/CNAME with bigrate.app.
const SITE_BASE = process.env.SITE_BASE || 'https://bigrate.app';

function fmtRate(r, decimals = 4) {
  if (!isFinite(r)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(r);
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function relatedLinks(from, to) {
  // Cross-link to popular adjacent pairs so Google can crawl the whole graph
  // efficiently and so a user reading USD/EUR can hop to USD/GBP in one tap.
  const rels = new Set();
  for (const m of MAJORS) {
    if (m !== from.code && m !== to.code) {
      rels.add(`${from.code}-to-${m}`);
      rels.add(`${m}-to-${to.code}`);
    }
  }
  rels.add(`${to.code}-to-${from.code}`); // inverse pair always
  return [...rels].slice(0, 12).map((slug) => {
    const [a, b] = slug.split('-to-');
    const ca = CURRENCY_BY_CODE[a];
    const cb = CURRENCY_BY_CODE[b];
    if (!ca || !cb) return '';
    return `<li><a href="../${slug}/">${ca.iso} → ${cb.iso}</a></li>`;
  }).join('\n          ');
}

export function pairPageHtml({ from, to, rate, builtAt }) {
  const title = `${from.iso} to ${to.iso} — Live Exchange Rate · BigRate`;
  const description =
    `Live ${from.iso} to ${to.iso} exchange rate. 1 ${from.iso} = ${fmtRate(rate)} ${to.iso}. ` +
    `Convert ${from.name} to ${to.name} instantly. Updated continuously.`;
  const canonical = `${SITE_BASE}/pair/${from.code}-to-${to.code}/`;
  const sample100 = fmtRate((rate ?? 1) * 100, 2);
  const inverseRate = rate && rate > 0 ? fmtRate(1 / rate) : '—';
  const today = new Date(builtAt).toISOString().slice(0, 10);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#0f0f12">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(`${from.iso} → ${to.iso} · Live rate`)}">
<meta property="og:description" content="${escape(`1 ${from.iso} = ${fmtRate(rate)} ${to.iso} right now. Track ${from.iso}/${to.iso} and 60+ pairs on Telegram.`)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: canonical,
  about: {
    '@type': 'ExchangeRateSpecification',
    currency: from.iso,
    currentExchangeRate: {
      '@type': 'UnitPriceSpecification',
      price: rate ?? 0,
      priceCurrency: to.iso,
    },
  },
})}
</script>
<style>
*,*::before,*::after{box-sizing:border-box}
:root{--bg:#0f0f12;--panel:#18181c;--panel-2:#1f1f24;--border:#2a2a30;--text:#f0f0f3;--dim:#9a9aa3;--accent:#3390ec;--green:#22c55e}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:720px;margin:0 auto;padding:24px 16px 60px}
header nav{display:flex;justify-content:space-between;align-items:center;padding:8px 0 16px;font-size:13px;color:var(--dim)}
.brand{font-weight:700;color:var(--text)}
h1{margin:8px 0;font-size:28px;line-height:1.2}
.subtitle{color:var(--dim);margin:0 0 16px;font-size:14px}
.rate-card{background:var(--panel);border-radius:14px;padding:24px;margin:16px 0}
.rate-headline{font-size:22px;font-weight:600;margin:0 0 6px}
.rate-big{font-size:36px;font-weight:800;color:var(--green);margin:8px 0}
.rate-meta{color:var(--dim);font-size:13px}
.calc{background:var(--panel);border-radius:14px;padding:20px;margin:16px 0}
.calc h2{margin:0 0 12px;font-size:15px;color:var(--dim);text-transform:uppercase;letter-spacing:.5px}
.calc-row{display:flex;gap:12px;align-items:center;margin:8px 0}
.calc-row label{font-size:13px;color:var(--dim);min-width:50px}
.calc-row input{flex:1;background:var(--panel-2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:18px;font-family:inherit;outline:none;width:100%}
.calc-row input:focus{border-color:var(--accent)}
.calc-row .iso{font-weight:600;color:var(--text)}
.cta{display:block;background:var(--accent);color:#fff;padding:16px 20px;border-radius:14px;text-align:center;font-weight:600;font-size:16px;margin:24px 0}
.cta:hover{text-decoration:none;opacity:.9}
.cta small{display:block;font-weight:400;opacity:.85;font-size:13px;margin-top:2px}
section{margin:24px 0}
section h2{margin:0 0 8px;font-size:18px}
section p{color:var(--dim);margin:0 0 8px}
.related ul{list-style:none;padding:0;margin:8px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}
.related li a{display:block;background:var(--panel);padding:10px 12px;border-radius:8px;font-size:14px}
footer{color:var(--dim);font-size:12px;margin-top:40px;padding-top:16px;border-top:1px solid var(--border)}
footer a{color:var(--dim)}
</style>
</head>
<body>
<div class="wrap">
<header><nav>
<a href="../../" class="brand">BigRate</a>
<a href="https://t.me/${BOT_USERNAME}?start=seo_${from.code}_${to.code}">Open on Telegram →</a>
</nav></header>

<h1>${from.iso} to ${to.iso} — Live Exchange Rate</h1>
<p class="subtitle">Convert ${escape(from.name)} (${from.iso}) to ${escape(to.name)} (${to.iso}). Rate updated continuously.</p>

<div class="rate-card">
<div class="rate-headline">1 ${from.iso} =</div>
<div class="rate-big" id="rate">${fmtRate(rate)} ${to.iso}</div>
<div class="rate-meta">Reverse: 1 ${to.iso} = <span id="inverse">${inverseRate}</span> ${from.iso} · Snapshot ${today}</div>
</div>

<div class="calc">
<h2>Quick converter</h2>
<div class="calc-row">
<label for="amount">Amount</label>
<input id="amount" type="number" inputmode="decimal" value="100" step="any" min="0">
<span class="iso">${from.iso}</span>
</div>
<div class="calc-row">
<label>Equals</label>
<input id="result" type="text" value="${sample100}" readonly>
<span class="iso">${to.iso}</span>
</div>
</div>

<a class="cta" href="https://t.me/${BOT_USERNAME}?start=seo_${from.code}_${to.code}">
📲 Track ${from.iso}/${to.iso} on Telegram
<small>Daily updates, alerts when the rate moves, supports 60+ currencies</small>
</a>

<section>
<h2>About ${escape(from.name)}</h2>
<p>${escape(from.name)} (${from.iso}) is the official currency of ${escape(from.country)}.</p>
</section>

<section>
<h2>About ${escape(to.name)}</h2>
<p>${escape(to.name)} (${to.iso}) is the official currency of ${escape(to.country)}.</p>
</section>

<section class="related">
<h2>Related conversions</h2>
<ul>
${relatedLinks(from, to)}
</ul>
</section>

<footer>
<p><a href="../../">BigRate.app</a> · Free currency tracker on Telegram <a href="https://t.me/${BOT_USERNAME}">@${BOT_USERNAME}</a></p>
<p>Rates from public CDN (currency-api by fawazahmed0). For information only — not a financial-advice service.</p>
</footer>
</div>

<script>
(function(){
  var FROM='${from.code}',TO='${to.code}',TO_DECIMALS=${to.decimals ?? 2},FROM_DECIMALS=${from.decimals ?? 2};
  var amt=document.getElementById('amount'),res=document.getElementById('result');
  var rateEl=document.getElementById('rate'),invEl=document.getElementById('inverse');
  var rate=${rate ?? 1};
  function fmt(n,d){return new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n)}
  function recompute(){var a=parseFloat(amt.value)||0;res.value=fmt(a*rate,TO_DECIMALS)}
  amt.addEventListener('input',recompute);
  var urls=[
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/'+FROM+'.json',
    'https://'+FROM+'.currency-api.pages.dev/v1/currencies/'+FROM+'.json'
  ];
  function tryFetch(i){
    if(i>=urls.length)return;
    fetch(urls[i]).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(d){
      var fresh=d&&d[FROM]&&d[FROM][TO];
      if(typeof fresh==='number'){
        rate=fresh;
        rateEl.textContent=fmt(fresh,4)+' ${to.iso}';
        if(fresh>0)invEl.textContent=fmt(1/fresh,4);
        recompute();
      }
    }).catch(function(){tryFetch(i+1)});
  }
  tryFetch(0);
})();
</script>
</body>
</html>
`;
}

export function sitemapXml(slugs) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = slugs
    .map((slug) =>
      `  <url><loc>${SITE_BASE}/pair/${slug}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_BASE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
${urls}
</urlset>
`;
}

export function robotsTxt() {
  return `User-agent: *
Allow: /
Sitemap: ${SITE_BASE}/sitemap.xml
`;
}

export function indexHtml(pairCount) {
  const today = new Date().toISOString().slice(0, 10);
  const list = Object.values(CURRENCY_BY_CODE)
    .slice(0, 60)
    .map((c) => MAJORS.filter((m) => m !== c.code).slice(0, 4).map((m) => {
      const other = CURRENCY_BY_CODE[m];
      return `<li><a href="${c.code}-to-${m}/">${c.iso} → ${other.iso}</a></li>`;
    }).join(''))
    .join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Currency Exchange Rates · BigRate</title>
<meta name="description" content="Live exchange rates for ${pairCount}+ currency pairs. USD, EUR, GBP, JPY, and many more. Track on Telegram.">
<link rel="canonical" href="${SITE_BASE}/pair/">
<style>
body{margin:0;background:#0f0f12;color:#f0f0f3;font:16px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;padding:24px 16px}
.wrap{max-width:720px;margin:0 auto}
h1{font-size:24px;margin:0 0 6px}
.dim{color:#9a9aa3;font-size:14px}
ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}
li a{display:block;background:#18181c;padding:10px 12px;border-radius:8px;color:#3390ec;text-decoration:none;font-size:14px}
li a:hover{background:#1f1f24}
</style>
</head>
<body>
<div class="wrap">
<h1>Currency exchange rates</h1>
<p class="dim">${pairCount} live pairs · updated ${today} · <a href="https://t.me/${BOT_USERNAME}" style="color:#3390ec">Open on Telegram</a></p>
<ul>${list}</ul>
</div>
</body>
</html>
`;
}
