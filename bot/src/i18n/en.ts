/** Every leaf is a plain string. Parametric strings use {name} style
 * placeholders and are rendered via the tpl() helper. */
export type Dict = {
  start: {
    greeting: string;
    menu_convert: string;
    menu_watch: string;
    menu_chart: string;
    menu_alerts: string;
    menu_settings: string;
    menu_help: string;
  };
  common: {
    cancel: string;
    back: string;
    done: string;
    delete: string;
    add: string;
    loading: string;
    error: string;
    unknown_currency: string;
    llm_unavailable: string;
  };
  convert: {
    prompt: string;
    result: string;
  };
  watchlist: {
    title: string;
    empty: string;
    header: string;
    add_prompt: string;
    added: string;
    removed: string;
    change_base: string;
    base_prompt: string;
    base_changed: string;
  };
  chart: {
    title: string;
    pick_pair: string;
    pick_tf: string;
    no_data: string;
    current: string;
  };
  alerts: {
    list_title: string;
    list_empty: string;
    new: string;
    pick_pair: string;
    pick_type: string;
    type_above: string;
    type_below: string;
    type_pct_up: string;
    type_pct_down: string;
    enter_value: string;
    hint_price: string;
    hint_percent: string;
    created: string;
    deleted: string;
    limit_reached: string;
    notification_above: string;
    notification_below: string;
    notification_pct_up: string;
    notification_pct_down: string;
  };
  settings: {
    title: string;
    language: string;
    lang_changed: string;
    lang_unsupported: string;
    timezone: string;
    tz_changed: string;
    tz_prompt: string;
    tz_custom: string;
    tz_custom_prompt: string;
    about: string;
  };
  digest: {
    menu_new: string;
    scope_pair: string;
    scope_watchlist: string;
    pick_scope: string;
    pick_pair: string;
    pick_time: string;
    pick_time_custom: string;
    created_pair: string;
    created_watchlist: string;
    label_pair: string;
    label_watchlist: string;
    pair: string;
    watchlist: string;
    time_invalid: string;
  };
  reset: {
    prompt: string;
    confirm: string;
    cancel: string;
    done: string;
    done_toast: string;
    cancelled: string;
  };
  help: {
    text: string;
  };
};

export const en: Dict = {
  start: {
    greeting:
      `Hey {name} 👋\n\nI'm your currency assistant: live rates, charts, alerts, and daily digests.\n\n<b>Just write — I'll understand</b>\n• <code>100 usd eur</code> — convert\n• <code>eur</code> — see all your rates vs EUR\n• <code>chart euro to dollar for a year</code>\n• <code>every day at 9am euro to dollar</code>\n\nOr tap a button below 👇`,
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
    unknown_currency: 'Unknown currency: <b>{q}</b>',
    llm_unavailable: "Didn't catch that — the model may be slow right now. Try rephrasing, or open settings for direct options.",
  },
  convert: {
    prompt: 'Send me something like <b>100 usd eur</b> or <b>1000 uah to rub</b>.',
    result: '<b>{amount} {from}</b> = <b>{value} {to}</b>\n\n<i>1 {from} = {rate} {to}</i>\n<code>{date}</code>',
  },
  watchlist: {
    title: '👁 <b>Watchlist</b>',
    empty: 'Your watchlist is empty. Use the menu to add currencies.',
    header: 'Rates for <b>{amount} {base}</b>:',
    add_prompt: 'Send the currency code to add (e.g. <b>JPY</b> or <b>CHF</b>).',
    added: 'Added <b>{iso}</b> to watchlist.',
    removed: 'Removed <b>{iso}</b> from watchlist.',
    change_base: '🔁 Change base',
    base_prompt: 'Send the base currency code (e.g. <b>EUR</b>).',
    base_changed: 'Base changed to <b>{iso}</b>.',
  },
  chart: {
    title: '📈 <b>{target} per 1 {base}</b> · {tf}',
    pick_pair: 'Send the pair to chart (e.g. <b>eur usd</b>).',
    pick_tf: 'Pick a timeframe:',
    no_data: 'No data for this pair/timeframe.',
    current: 'Current: <b>{price}</b>  {pct}',
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
    enter_value: 'Pair: <b>{pair}</b>\nCondition: <b>{type}</b>\n\nSend the value ({hint}):',
    hint_price: 'e.g. 1.15',
    hint_percent: 'e.g. 2 for 2%',
    created: '✅ Alert created:\n{summary}',
    deleted: '🗑 Alert deleted.',
    limit_reached: 'You reached the free limit of {limit} active alerts. Use /premium to increase.',
    notification_above: '🔔 <b>{pair}</b> crossed above <b>{target}</b>\n\nCurrent: <b>{price}</b>',
    notification_below: '🔔 <b>{pair}</b> dropped below <b>{target}</b>\n\nCurrent: <b>{price}</b>',
    notification_pct_up: '🔔 <b>{pair}</b> is up {pct} in 24h\n\nCurrent: <b>{price}</b>',
    notification_pct_down: '🔔 <b>{pair}</b> is down {pct} in 24h\n\nCurrent: <b>{price}</b>',
  },
  settings: {
    title: '⚙️ <b>Settings</b>',
    language: 'Language',
    lang_changed: 'Language updated.',
    lang_unsupported: 'That language isn\'t supported yet. Available: {supported}.',
    timezone: 'Time zone',
    tz_changed: 'Time zone updated.',
    tz_prompt: 'Pick your time zone (used for daily digests):',
    tz_custom: '✏️ Other city',
    tz_custom_prompt: 'Send a city name (English works best): <b>Prague</b>, <b>Seoul</b>, <b>Tel Aviv</b>…',
    about: 'About',
  },
  digest: {
    menu_new: '📅 Daily digest',
    scope_pair: 'One pair',
    scope_watchlist: 'Whole watchlist',
    pick_scope: 'Pick what to digest:',
    pick_pair: 'Send the pair (e.g. <b>eur usd</b>).',
    pick_time: 'Pick delivery time ({tz}):',
    pick_time_custom: 'Or send a custom time like <b>09:30</b>.',
    created_pair: '✅ Daily digest set for <b>{pair}</b> at <b>{time}</b> ({tz}).',
    created_watchlist: '✅ Daily watchlist digest set for <b>{time}</b> ({tz}).',
    label_pair: '📅 {pair} daily @ {time}',
    label_watchlist: '📅 watchlist daily @ {time}',
    pair: '📅 <b>Daily digest · {pair}</b>\n\nNow: <b>{price}</b>  {change}\nYesterday: {prev}',
    watchlist: '📅 <b>Daily digest · 1 {base}</b>',
    time_invalid: 'Couldn\'t read the time. Send something like <b>09:00</b> or <b>21:30</b>.',
  },
  reset: {
    prompt: '⚠️ This will wipe everything: your language, time zone, watchlist, and all alerts. Continue?',
    confirm: '🗑 Yes, reset',
    cancel: 'Cancel',
    done: '✅ Everything cleared. Pick a language to start fresh.',
    done_toast: 'Reset done',
    cancelled: 'Cancelled — nothing changed.',
  },
  help: {
    text: `<b>What I can do</b>

💱 <b>Convert</b>
Write naturally: <code>100 usd eur</code>, <code>1500 uah to rub</code>, <code>50€ in ₴</code>, <code>a thousand dollars to hryvnia</code>.

👁 <b>Watchlist</b>
Send a currency code (e.g. <code>eur</code>) to see all your tracked rates against it. /watch to manage.

📈 <b>Chart</b>
<code>chart eur usd</code> or <code>trend euro to dollar last year</code>. Tap 1D/1W/1M/3M/6M/1Y/2Y under the chart to switch — the same card updates in place.

🔔 <b>Price alerts</b>
/alerts → New alert. Get pinged when a pair crosses a price or moves ±X% in 24h.

📅 <b>Daily digest</b>
/alerts → 📅 Daily digest. Pick one pair or your whole watchlist, pick a local time — and get a morning summary with yesterday's move.
Or just say it: <code>every day at 9am eur to usd</code>.

⚙️ <b>Settings</b>
/settings — language and time zone (needed for digest timing).

<i>Inline mode: type <code>@{username} 100 usd eur</code> in any chat to share a conversion card.</i>`,
  },
};
