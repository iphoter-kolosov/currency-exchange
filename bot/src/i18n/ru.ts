import type { Dict } from './en.ts';

export const ru: Dict = {
  start: {
    greeting: (name: string) =>
      `Привет, ${name} 👋\n\nСлежу за курсами валют — конвертация в реальном времени, графики и пинг, когда рынок шевельнётся.\n\n<b>Попробуй прямо сейчас</b>\n• <code>100 usd eur</code> — конвертнуть\n• <code>eur usd</code> — текущий курс\n• <code>50€ в ₴</code> — символы тоже работают\n\nИли выбирай из меню 👇`,
    menu_convert: '💱 Конвертер',
    menu_watch: '👁 Список',
    menu_chart: '📈 График',
    menu_alerts: '🔔 Алерты',
    menu_settings: '⚙️ Настройки',
    menu_help: '❓ Помощь',
  },
  common: {
    cancel: 'Отмена',
    back: '← Назад',
    done: 'Готово',
    delete: 'Удалить',
    add: '+ Добавить',
    loading: 'Загружаю…',
    error: '⚠️ Что-то пошло не так. Попробуй ещё раз.',
    unknown_currency: (q: string) => `Не знаю такую валюту: <b>${q}</b>`,
  },
  convert: {
    prompt: 'Напиши что-то вроде <b>100 usd eur</b> или <b>1000 uah в rub</b>.',
    result: (amount: string, from: string, value: string, to: string, rate: string, date: string) =>
      `<b>${amount} ${from}</b> = <b>${value} ${to}</b>\n\n<i>1 ${from} = ${rate} ${to}</i>\n<code>${date}</code>`,
  },
  watchlist: {
    title: '👁 <b>Список</b>',
    empty: 'Пока пусто. Добавь валюты через меню.',
    header: (base: string, amount: number) => `Курсы для <b>${amount} ${base}</b>:`,
    add_prompt: 'Пришли код валюты для добавления (например <b>JPY</b> или <b>CHF</b>).',
    added: (iso: string) => `<b>${iso}</b> добавлена в список.`,
    removed: (iso: string) => `<b>${iso}</b> убрана из списка.`,
    change_base: '🔁 Сменить базу',
    base_prompt: 'Пришли код базовой валюты (например <b>EUR</b>).',
    base_changed: (iso: string) => `Базовая валюта теперь <b>${iso}</b>.`,
  },
  chart: {
    title: (base: string, target: string, tf: string) => `📈 <b>${target} за 1 ${base}</b> · ${tf}`,
    pick_pair: 'Напиши пару для графика (например <b>eur usd</b>).',
    pick_tf: 'Выбери период:',
    no_data: 'Нет данных для этой пары/периода.',
    current: (price: string, pct: string) => `Сейчас: <b>${price}</b>  ${pct}`,
  },
  alerts: {
    list_title: '🔔 <b>Твои алерты</b>',
    list_empty: 'Алертов пока нет. Нажми «Новый алерт», чтобы создать.',
    new: '＋ Новый алерт',
    pick_pair: 'Пришли пару для алерта (например <b>eur usd</b>).',
    pick_type: 'По какому условию срабатывать?',
    type_above: '📈 Цена выше',
    type_below: '📉 Цена ниже',
    type_pct_up: '⬆️ % роста за 24ч',
    type_pct_down: '⬇️ % падения за 24ч',
    enter_value: (pair: string, type: string, hint: string) =>
      `Пара: <b>${pair}</b>\nУсловие: <b>${type}</b>\n\nПришли значение (${hint}):`,
    hint_price: 'например 1.15',
    hint_percent: 'например 2 для 2%',
    created: (summary: string) => `✅ Алерт создан:\n${summary}`,
    deleted: '🗑 Алерт удалён.',
    limit_reached: (limit: number) =>
      `Бесплатный лимит — ${limit} активных алертов. /premium чтобы расширить.`,
    notification_above: (pair: string, price: string, target: string) =>
      `🔔 <b>${pair}</b> пробила <b>${target}</b> вверх\n\nТекущий курс: <b>${price}</b>`,
    notification_below: (pair: string, price: string, target: string) =>
      `🔔 <b>${pair}</b> упала ниже <b>${target}</b>\n\nТекущий курс: <b>${price}</b>`,
    notification_pct_up: (pair: string, pct: string, price: string) =>
      `🔔 <b>${pair}</b> выросла на ${pct} за 24ч\n\nТекущий курс: <b>${price}</b>`,
    notification_pct_down: (pair: string, pct: string, price: string) =>
      `🔔 <b>${pair}</b> упала на ${pct} за 24ч\n\nТекущий курс: <b>${price}</b>`,
  },
  settings: {
    title: '⚙️ <b>Настройки</b>',
    language: 'Язык',
    language_en: '🇬🇧 English',
    language_ru: '🇷🇺 Русский',
    lang_changed: 'Язык обновлён.',
    about: 'О боте',
  },
  help: {
    text: `<b>Currency Tracker Bot</b>

💱 <b>Быстрая конвертация</b>
Просто напиши — <code>100 usd eur</code>, <code>1500 uah в rub</code>, <code>50€ в $</code>.

📈 <b>График</b>
/chart eur usd 1m — пара и период (1d/1w/1m/3m/6m/1y/2y).

👁 <b>Список</b>
/watch — все отслеживаемые курсы сразу.

🔔 <b>Алерты</b>
/alerts — создать и управлять ценовыми алертами.
Триггеры: цена выше/ниже уровня или ±X% за 24ч.

⚙️ <b>Настройки</b>
/settings — смена языка.

Inline: напиши <code>@{username} 100 usd eur</code> в любом чате.`,
  },
};
