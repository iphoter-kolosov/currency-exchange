import type { Dict } from './en.ts';

export const ru: Dict = {
  start: {
    greeting:
      `Привет, {name} 👋\n\nЯ — твой валютный ассистент: курсы в реальном времени, графики, алерты, ежедневные сводки.\n\n<b>Просто напиши — я пойму</b>\n• <code>100 usd eur</code> — конвертнуть\n• <code>eur</code> — курсы всех валют к евро\n• <code>график евро к доллару за год</code>\n• <code>каждый день в 9 утра евро к гривне</code>\n\nИли жми кнопку в меню 👇`,
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
    unknown_currency: 'Не знаю такую валюту: <b>{q}</b>',
    llm_unavailable: 'Не уловил мысль — связь с моделью пропала. Попробуй переформулировать или открой настройки.',
  },
  convert: {
    prompt: 'Напиши что-то вроде <b>100 usd eur</b> или <b>1000 uah в rub</b>.',
    result: '<b>{amount} {from}</b> = <b>{value} {to}</b>\n\n<i>1 {from} = {rate} {to}</i>\n<code>{date}</code>',
  },
  watchlist: {
    title: '👁 <b>Список</b>',
    empty: 'Пока пусто. Добавь валюты через меню.',
    header: 'Курсы для <b>{amount} {base}</b>:',
    add_prompt: 'Пришли код валюты для добавления (например <b>JPY</b> или <b>CHF</b>).',
    added: '<b>{iso}</b> добавлена в список.',
    removed: '<b>{iso}</b> убрана из списка.',
    change_base: '🔁 Сменить базу',
    base_prompt: 'Пришли код базовой валюты (например <b>EUR</b>).',
    base_changed: 'Базовая валюта теперь <b>{iso}</b>.',
  },
  chart: {
    title: '📈 <b>{target} за 1 {base}</b> · {tf}',
    pick_pair: 'Напиши пару для графика (например <b>eur usd</b>).',
    pick_tf: 'Выбери период:',
    no_data: 'Нет данных для этой пары/периода.',
    current: 'Сейчас: <b>{price}</b>  {pct}',
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
    enter_value: 'Пара: <b>{pair}</b>\nУсловие: <b>{type}</b>\n\nПришли значение ({hint}):',
    hint_price: 'например 1.15',
    hint_percent: 'например 2 для 2%',
    created: '✅ Алерт создан:\n{summary}',
    deleted: '🗑 Алерт удалён.',
    limit_reached: 'Бесплатный лимит — {limit} активных алертов. /premium чтобы расширить.',
    notification_above: '🔔 <b>{pair}</b> пробила <b>{target}</b> вверх\n\nТекущий курс: <b>{price}</b>',
    notification_below: '🔔 <b>{pair}</b> упала ниже <b>{target}</b>\n\nТекущий курс: <b>{price}</b>',
    notification_pct_up: '🔔 <b>{pair}</b> выросла на {pct} за 24ч\n\nТекущий курс: <b>{price}</b>',
    notification_pct_down: '🔔 <b>{pair}</b> упала на {pct} за 24ч\n\nТекущий курс: <b>{price}</b>',
  },
  settings: {
    title: '⚙️ <b>Настройки</b>',
    language: 'Язык',
    lang_changed: 'Язык обновлён.',
    lang_unsupported: 'Этот язык пока не поддерживается. Доступны: {supported}.',
    timezone: 'Часовой пояс',
    tz_changed: 'Часовой пояс обновлён.',
    tz_prompt: 'Выбери свой часовой пояс (нужен для ежедневных сводок):',
    tz_custom: '✏️ Другой город',
    tz_custom_prompt: 'Пришли название города (английский работает надёжнее): <b>Prague</b>, <b>Tel Aviv</b>, <b>Seoul</b>…',
    about: 'О боте',
  },
  digest: {
    menu_new: '📅 Ежедневная сводка',
    scope_pair: 'Одна пара',
    scope_watchlist: 'Весь список',
    pick_scope: 'Что присылать в сводке:',
    pick_pair: 'Пришли пару (например <b>eur usd</b>).',
    pick_time: 'Время отправки ({tz}):',
    pick_time_custom: 'Или пришли своё время, например <b>09:30</b>.',
    created_pair: '✅ Сводка по <b>{pair}</b> будет приходить в <b>{time}</b> ({tz}).',
    created_watchlist: '✅ Ежедневная сводка по списку — в <b>{time}</b> ({tz}).',
    label_pair: '📅 {pair} ежедневно @ {time}',
    label_watchlist: '📅 список ежедневно @ {time}',
    pair: '📅 <b>Сводка · {pair}</b>\n\nСейчас: <b>{price}</b>  {change}\nВчера: {prev}',
    watchlist: '📅 <b>Сводка · 1 {base}</b>',
    time_invalid: 'Не разобрал время. Пришли в формате <b>09:00</b> или <b>21:30</b>.',
  },
  reset: {
    prompt: '⚠️ Это удалит всё: язык, часовой пояс, список валют, все алерты. Продолжить?',
    confirm: '🗑 Да, сбросить',
    cancel: 'Отмена',
    done: '✅ Всё очищено. Выбери язык, чтобы начать заново.',
    done_toast: 'Сброс выполнен',
    cancelled: 'Отменено — ничего не изменилось.',
  },
  help: {
    text: `<b>Что я умею</b>

💱 <b>Конвертация</b>
Пиши естественно: <code>100 usd eur</code>, <code>1500 uah в rub</code>, <code>50€ в ₴</code>, <code>тысячу долларов в гривны</code>.

👁 <b>Список курсов</b>
Отправь код валюты (<code>eur</code>) — увидишь все отслеживаемые курсы к ней. /watch — управлять списком.

📈 <b>График</b>
<code>график eur usd</code> или <code>динамика евро к доллару за год</code>. Кнопки 1D/1W/1M/3M/6M/1Y/2Y под графиком — одна и та же карточка обновляется.

🔔 <b>Ценовые алерты</b>
/alerts → Новый алерт. Пинг, когда пара пересекла цену или двинулась на ±X% за 24ч.

📅 <b>Ежедневные сводки</b>
/alerts → 📅 Ежедневная сводка. Одна пара или весь список, время в твоём поясе — и утром приходит курс с изменением за сутки.
Или напрямую: <code>каждый день в 9 утра евро к гривне</code>.

⚙️ <b>Настройки</b>
/settings — язык и часовой пояс (нужен для сводок).

<i>Inline: <code>@{username} 100 usd eur</code> в любом чате — готовая карточка с курсом.</i>`,
  },
};
