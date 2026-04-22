import type { Dict } from './en.ts';

export const zh: Dict = {
  start: {
    greeting:
      `你好，{name} 👋\n\n我是你的汇率助手：实时汇率、图表、提醒和每日简报。\n\n<b>直接写，我能听懂</b>\n• <code>100 usd eur</code> — 换算\n• <code>eur</code> — 所有汇率对欧元\n• <code>欧元对美元一年的图表</code>\n• <code>每天早上 9 点 欧元到美元</code>\n\n或者点下面的按钮 👇`,
    menu_convert: '💱 换算',
    menu_watch: '👁 列表',
    menu_chart: '📈 图表',
    menu_alerts: '🔔 提醒',
    menu_settings: '⚙️ 设置',
    menu_help: '❓ 帮助',
  },
  common: {
    cancel: '取消',
    back: '← 返回',
    done: '完成',
    delete: '删除',
    add: '+ 添加',
    loading: '加载中…',
    error: '⚠️ 出错了，请再试一次。',
    unknown_currency: '未知货币：<b>{q}</b>',
  },
  convert: {
    prompt: '发送类似 <b>100 usd eur</b> 或 <b>1000 uah to rub</b> 的内容。',
    result: '<b>{amount} {from}</b> = <b>{value} {to}</b>\n\n<i>1 {from} = {rate} {to}</i>\n<code>{date}</code>',
  },
  watchlist: {
    title: '👁 <b>列表</b>',
    empty: '列表是空的。通过菜单添加货币。',
    header: '<b>{amount} {base}</b> 的汇率：',
    add_prompt: '发送要添加的货币代码（如 <b>JPY</b> 或 <b>CHF</b>）。',
    added: '已将 <b>{iso}</b> 加入列表。',
    removed: '已从列表移除 <b>{iso}</b>。',
    change_base: '🔁 更换基准',
    base_prompt: '发送基准货币代码（如 <b>EUR</b>）。',
    base_changed: '基准已改为 <b>{iso}</b>。',
  },
  chart: {
    title: '📈 <b>1 {base} 兑 {target}</b> · {tf}',
    pick_pair: '发送要画图的货币对（如 <b>eur usd</b>）。',
    pick_tf: '选择时间段：',
    no_data: '此货币对/时间段没有数据。',
    current: '当前：<b>{price}</b>  {pct}',
  },
  alerts: {
    list_title: '🔔 <b>你的提醒</b>',
    list_empty: '还没有提醒。点击「新建提醒」来创建。',
    new: '＋ 新建提醒',
    pick_pair: '发送提醒的货币对（如 <b>eur usd</b>）。',
    pick_type: '什么时候触发提醒？',
    type_above: '📈 价格高于',
    type_below: '📉 价格低于',
    type_pct_up: '⬆️ 24 小时涨幅',
    type_pct_down: '⬇️ 24 小时跌幅',
    enter_value: '货币对：<b>{pair}</b>\n条件：<b>{type}</b>\n\n发送数值（{hint}）：',
    hint_price: '如 1.15',
    hint_percent: '如 2 表示 2%',
    created: '✅ 已创建提醒：\n{summary}',
    deleted: '🗑 提醒已删除。',
    limit_reached: '已达到免费上限：{limit} 条活动提醒。使用 /premium 提升。',
    notification_above: '🔔 <b>{pair}</b> 突破 <b>{target}</b>\n\n当前：<b>{price}</b>',
    notification_below: '🔔 <b>{pair}</b> 跌破 <b>{target}</b>\n\n当前：<b>{price}</b>',
    notification_pct_up: '🔔 <b>{pair}</b> 24 小时上涨 {pct}\n\n当前：<b>{price}</b>',
    notification_pct_down: '🔔 <b>{pair}</b> 24 小时下跌 {pct}\n\n当前：<b>{price}</b>',
  },
  settings: {
    title: '⚙️ <b>设置</b>',
    language: '语言',
    lang_changed: '语言已更新。',
    lang_unsupported: '暂不支持该语言。可选：{supported}。',
    timezone: '时区',
    tz_changed: '时区已更新。',
    tz_prompt: '选择你的时区（用于每日简报）：',
    tz_custom: '✏️ 其他城市',
    tz_custom_prompt: '发送城市名（英文更准）：<b>Prague</b>、<b>Seoul</b>、<b>Tel Aviv</b>…',
    about: '关于',
  },
  digest: {
    menu_new: '📅 每日简报',
    scope_pair: '单个货币对',
    scope_watchlist: '整个列表',
    pick_scope: '选择简报内容：',
    pick_pair: '发送货币对（如 <b>eur usd</b>）。',
    pick_time: '选择发送时间（{tz}）：',
    pick_time_custom: '或发送自定义时间，如 <b>09:30</b>。',
    created_pair: '✅ 每日简报 <b>{pair}</b> 已设置在 <b>{time}</b>（{tz}）。',
    created_watchlist: '✅ 每日列表简报已设置在 <b>{time}</b>（{tz}）。',
    label_pair: '📅 {pair} 每日 @ {time}',
    label_watchlist: '📅 列表每日 @ {time}',
    pair: '📅 <b>每日简报 · {pair}</b>\n\n当前：<b>{price}</b>  {change}\n昨日：{prev}',
    watchlist: '📅 <b>每日简报 · 1 {base}</b>',
    time_invalid: '没看懂时间。请发类似 <b>09:00</b> 或 <b>21:30</b> 的格式。',
  },
  reset: {
    prompt: '⚠️ 这会清除所有数据：语言、时区、列表和全部提醒。继续吗？',
    confirm: '🗑 是的，重置',
    cancel: '取消',
    done: '✅ 全部清除。选择一种语言重新开始。',
    done_toast: '已重置',
    cancelled: '已取消 — 没有任何改动。',
  },
  help: {
    text: `<b>我能做什么</b>

💱 <b>换算</b>
自然地写：<code>100 usd eur</code>、<code>1500 uah to rub</code>、<code>50€ in ₴</code>、<code>一千美元换人民币</code>。

👁 <b>列表</b>
发送货币代码（如 <code>eur</code>）查看所有追踪汇率。/watch 管理列表。

📈 <b>图表</b>
<code>chart eur usd</code> 或 <code>过去一年欧元对美元的走势</code>。图表下方的 1D/1W/1M/3M/6M/1Y/2Y 可切换时段，同一张卡片就地更新。

🔔 <b>价格提醒</b>
/alerts → 新建提醒。货币对跨越某价格或 24 小时内波动 ±X% 时通知你。

📅 <b>每日简报</b>
/alerts → 📅 每日简报。选一个货币对或整个列表，设好本地时间 — 早上就会收到含昨日变化的摘要。
也可以直接说：<code>每天早上 9 点 eur 到 usd</code>。

⚙️ <b>设置</b>
/settings — 语言和时区（简报时间需要）。

<i>Inline 模式：在任意聊天中输入 <code>@{username} 100 usd eur</code> 分享换算卡片。</i>`,
  },
};
