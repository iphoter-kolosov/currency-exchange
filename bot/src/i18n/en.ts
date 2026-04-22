export const en = {
  start: {
    greeting: (name: string) =>
      `Hey ${name} 👋\n\nI'll keep an eye on currency rates for you — live conversions, charts, and a heads-up when the market moves.\n\n<b>Quick try</b>\n• <code>100 usd eur</code> — convert\n• <code>eur usd</code> — current rate\n• <code>50€ in ₴</code> — symbols also work\n\nOr pick something from the menu 👇`,
    menu_convert: '💱 Convert',
    menu_watch: '👁 Watchlist',
    menu_chart: '📈 Chart',
    menu_alerts: '🔔 Alerts',
    menu_settings: '⚙️ Settings',
    menu_help: '❓ Help',
  },
  common: {
    cancel: 'Cancel',
    back: '← Back',
    done: 'Done',
    delete: 'Delete',
    add: '+ Add',
    loading: 'Loading…',
    error: '⚠️ Something went wrong. Try again.',
    unknown_currency: (q: string) => `Unknown currency: <b>${q}</b>`,
  },
  convert: {
    prompt: 'Send me something like <b>100 usd eur</b> or <b>1000 uah to rub</b>.',
    result: (amount: string, from: string, value: string, to: string, rate: string, date: string) =>
      `<b>${amount} ${from}</b> = <b>${value} ${to}</b>\n\n<i>1 ${from} = ${rate} ${to}</i>\n<code>${date}</code>`,
  },
  watchlist: {
    title: '👁 <b>Watchlist</b>',
    empty: 'Your watchlist is empty. Use the menu to add currencies.',
    header: (base: string, amount: number) => `Rates for <b>${amount} ${base}</b>:`,
    add_prompt: 'Send the currency code to add (e.g. <b>JPY</b> or <b>CHF</b>).',
    added: (iso: string) => `Added <b>${iso}</b> to watchlist.`,
    removed: (iso: string) => `Removed <b>${iso}</b> from watchlist.`,
    change_base: '🔁 Change base',
    base_prompt: 'Send the base currency code (e.g. <b>EUR</b>).',
    base_changed: (iso: string) => `Base changed to <b>${iso}</b>.`,
  },
  chart: {
    title: (base: string, target: string, tf: string) => `📈 <b>${target} per 1 ${base}</b> · ${tf}`,
    pick_pair: 'Send the pair to chart (e.g. <b>eur usd</b>).',
    pick_tf: 'Pick a timeframe:',
    no_data: 'No data for this pair/timeframe.',
    current: (price: string, pct: string) => `Current: <b>${price}</b>  ${pct}`,
  },
  alerts: {
    list_title: '🔔 <b>Your alerts</b>',
    list_empty: 'You have no alerts yet. Tap "New alert" to create one.',
    new: '＋ New alert',
    pick_pair: 'Send a pair for the alert (e.g. <b>eur usd</b>).',
    pick_type: 'What should trigger the alert?',
    type_above: '📈 Price above',
    type_below: '📉 Price below',
    type_pct_up: '⬆️ % up in 24h',
    type_pct_down: '⬇️ % down in 24h',
    enter_value: (pair: string, type: string, hint: string) =>
      `Pair: <b>${pair}</b>\nCondition: <b>${type}</b>\n\nSend the value (${hint}):`,
    hint_price: 'e.g. 1.15',
    hint_percent: 'e.g. 2 for 2%',
    created: (summary: string) => `✅ Alert created:\n${summary}`,
    deleted: '🗑 Alert deleted.',
    limit_reached: (limit: number) =>
      `You reached the free limit of ${limit} active alerts. Use /premium to increase.`,
    notification_above: (pair: string, price: string, target: string) =>
      `🔔 <b>${pair}</b> crossed above <b>${target}</b>\n\nCurrent: <b>${price}</b>`,
    notification_below: (pair: string, price: string, target: string) =>
      `🔔 <b>${pair}</b> dropped below <b>${target}</b>\n\nCurrent: <b>${price}</b>`,
    notification_pct_up: (pair: string, pct: string, price: string) =>
      `🔔 <b>${pair}</b> is up ${pct} in 24h\n\nCurrent: <b>${price}</b>`,
    notification_pct_down: (pair: string, pct: string, price: string) =>
      `🔔 <b>${pair}</b> is down ${pct} in 24h\n\nCurrent: <b>${price}</b>`,
  },
  settings: {
    title: '⚙️ <b>Settings</b>',
    language: 'Language',
    language_en: '🇬🇧 English',
    language_ru: '🇷🇺 Русский',
    lang_changed: 'Language updated.',
    timezone: 'Time zone',
    tz_changed: 'Time zone updated.',
    tz_prompt: 'Pick your time zone (used for daily digests):',
    about: 'About',
  },
  digest: {
    menu_new: '📅 Daily digest',
    scope_pair: 'One pair',
    scope_watchlist: 'Whole watchlist',
    pick_scope: 'Pick what to digest:',
    pick_pair: 'Send the pair (e.g. <b>eur usd</b>).',
    pick_time: (tz: string) => `Pick delivery time (${tz}):`,
    pick_time_custom: 'Or send a custom time like <b>09:30</b>.',
    created_pair: (pair: string, time: string, tz: string) =>
      `✅ Daily digest set for <b>${pair}</b> at <b>${time}</b> (${tz}).`,
    created_watchlist: (time: string, tz: string) =>
      `✅ Daily watchlist digest set for <b>${time}</b> (${tz}).`,
    label_pair: (pair: string, time: string) => `📅 ${pair} daily @ ${time}`,
    label_watchlist: (time: string) => `📅 watchlist daily @ ${time}`,
    pair: (pair: string, price: string, change: string, prev: string) =>
      `📅 <b>Daily digest · ${pair}</b>\n\nNow: <b>${price}</b>  ${change}\nYesterday: ${prev}`,
    watchlist: (base: string) => `📅 <b>Daily digest · 1 ${base}</b>`,
    time_invalid: 'Couldn\'t read the time. Send something like <b>09:00</b> or <b>21:30</b>.',
  },
  help: {
    text: `<b>Currency Tracker Bot</b>

💱 <b>Quick convert</b>
Just type it — <code>100 usd eur</code>, <code>1500 uah to rub</code>, <code>50€ в $</code>.

📈 <b>Chart</b>
/chart eur usd 1m — pair + timeframe (1d/1w/1m/3m/6m/1y/2y).

👁 <b>Watchlist</b>
/watch — see all your tracked rates at once.

🔔 <b>Alerts</b>
/alerts — create and manage price alerts.
Triggers: price above/below a level, or ±X% over 24h.

⚙️ <b>Settings</b>
/settings — change language.

Inline mode: type <code>@{username} 100 usd eur</code> in any chat.`,
  },
};

export type Dict = typeof en;
