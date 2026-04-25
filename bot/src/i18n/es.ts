import type { Dict } from './en.ts';

export const es: Dict = {
  start: {
    greeting:
      `¡Hola {name}! 👋\n\nSoy tu asesor personal de divisas — vivo en este ecosistema 24/7: cotizaciones en vivo, gráficos, alertas y resúmenes diarios. Sé hacia dónde va el mercado y hablo tu idioma 🤝\n\nPuedes hablarme <b>como a una persona</b> — solo escribe:\n• <code>100 usd eur</code> — conversión al instante\n• <code>eur</code> — todas las tasas frente al euro\n• <code>gráfico euro a dólar durante un año</code>\n• <code>todos los días a las 9 euro a dólar</code>\n\nO usa los <b>botones</b> de abajo: todo está en el menú ⤵️\n\n<i>Hecho por BigRate.app</i>`,
    menu_convert: '💱 Convertir',
    menu_watch: '👁 Lista',
    menu_chart: '📈 Gráfico',
    menu_alerts: '🔔 Alertas',
    menu_settings: '⚙️ Ajustes',
    menu_help: '❓ Ayuda',
  },
  common: {
    cancel: 'Cancelar',
    back: '← Atrás',
    done: 'Listo',
    delete: 'Eliminar',
    add: '+ Añadir',
    loading: 'Cargando…',
    error: '⚠️ Algo salió mal. Inténtalo de nuevo.',
    unknown_currency: 'Divisa desconocida: <b>{q}</b>',
    llm_unavailable: 'Perdona, no te entendí. Reformúlalo o elige la herramienta adecuada en el menú.',
  },
  convert: {
    prompt: 'Envía algo como <b>100 usd eur</b> o <b>1000 uah a rub</b>.',
    result: '<b>{amount} {from}</b> = <b>{value} {to}</b>\n\n<i>1 {from} = {rate} {to}</i>\n<code>{date}</code>',
  },
  watchlist: {
    title: '👁 <b>Lista</b>',
    empty: 'Tu lista está vacía. Usa el menú para añadir divisas.',
    header: 'Tasas para <b>{amount} {base}</b>:',
    add_prompt: 'Envía el código de la divisa a añadir (p. ej. <b>JPY</b> o <b>CHF</b>).',
    added: 'Añadida <b>{iso}</b> a la lista.',
    removed: 'Eliminada <b>{iso}</b> de la lista.',
    change_base: '🔁 Cambiar base',
    base_prompt: 'Envía el código de la divisa base (p. ej. <b>EUR</b>).',
    base_changed: 'Base cambiada a <b>{iso}</b>.',
  },
  chart: {
    title: '📈 <b>{target} por 1 {base}</b> · {tf}',
    pick_pair: 'Envía el par para el gráfico (p. ej. <b>eur usd</b>).',
    pick_tf: 'Elige un periodo:',
    no_data: 'No hay datos para este par/periodo.',
    current: 'Actual: <b>{price}</b>  {pct}',
  },
  alerts: {
    list_title: '🔔 <b>Tus alertas</b>',
    list_empty: 'Aún no tienes alertas. Toca «Nueva alerta» para crear una.',
    new: '＋ Nueva alerta',
    pick_pair: 'Envía un par para la alerta (p. ej. <b>eur usd</b>).',
    pick_type: '¿Qué debe activar la alerta?',
    type_above: '📈 Precio por encima',
    type_below: '📉 Precio por debajo',
    type_pct_up: '⬆️ % subida en 24 h',
    type_pct_down: '⬇️ % bajada en 24 h',
    enter_value: 'Par: <b>{pair}</b>\nCondición: <b>{type}</b>\n\nEnvía el valor ({hint}):',
    hint_price: 'p. ej. 1.15',
    hint_percent: 'p. ej. 2 para 2%',
    created: '✅ Alerta creada:\n{summary}',
    deleted: '🗑 Alerta eliminada.',
    limit_reached: 'Has alcanzado el límite gratuito de {limit} alertas activas. Usa /premium para ampliar.',
    notification_above: '🔔 <b>{pair}</b> superó <b>{target}</b>\n\nActual: <b>{price}</b>',
    notification_below: '🔔 <b>{pair}</b> cayó por debajo de <b>{target}</b>\n\nActual: <b>{price}</b>',
    notification_pct_up: '🔔 <b>{pair}</b> subió {pct} en 24 h\n\nActual: <b>{price}</b>',
    notification_pct_down: '🔔 <b>{pair}</b> bajó {pct} en 24 h\n\nActual: <b>{price}</b>',
  },
  settings: {
    title: '⚙️ <b>Ajustes</b>',
    language: 'Idioma',
    lang_changed: 'Idioma actualizado.',
    lang_unsupported: 'Ese idioma aún no está disponible. Disponibles: {supported}.',
    timezone: 'Zona horaria',
    tz_changed: 'Zona horaria actualizada.',
    tz_prompt: 'Elige tu zona horaria (se usa para los resúmenes diarios):',
    tz_custom: '✏️ Otra ciudad',
    tz_custom_prompt: 'Envía el nombre de una ciudad (en inglés funciona mejor): <b>Prague</b>, <b>Seoul</b>, <b>Tel Aviv</b>…',
    about: 'Acerca de',
  },
  digest: {
    menu_new: '📅 Resumen diario',
    scope_pair: 'Un par',
    scope_watchlist: 'Toda la lista',
    pick_scope: 'Elige qué resumir:',
    pick_pair: 'Envía el par (p. ej. <b>eur usd</b>).',
    pick_time: 'Elige la hora de envío ({tz}):',
    pick_time_custom: 'O envía una hora personalizada como <b>09:30</b>.',
    created_pair: '✅ Resumen diario fijado para <b>{pair}</b> a las <b>{time}</b> ({tz}).',
    created_watchlist: '✅ Resumen diario de la lista a las <b>{time}</b> ({tz}).',
    label_pair: '📅 {pair} diario @ {time}',
    label_watchlist: '📅 lista diaria @ {time}',
    pair: '📅 <b>Resumen diario · {pair}</b>\n\nAhora: <b>{price}</b>  {change}\nAyer: {prev}',
    watchlist: '📅 <b>Resumen diario · 1 {base}</b>',
    time_invalid: 'No entendí la hora. Envía algo como <b>09:00</b> o <b>21:30</b>.',
  },
  reset: {
    prompt: '⚠️ Esto borrará todo: tu idioma, zona horaria, lista y todas las alertas. ¿Continuar?',
    confirm: '🗑 Sí, restablecer',
    cancel: 'Cancelar',
    done: '✅ Todo borrado. Elige un idioma para empezar de nuevo.',
    done_toast: 'Restablecido',
    cancelled: 'Cancelado — nada cambió.',
  },
  help: {
    text: `<b>Lo que puedo hacer</b>

💱 <b>Convertir</b>
Escribe con naturalidad: <code>100 usd eur</code>, <code>1500 uah a rub</code>, <code>50€ en ₴</code>, <code>mil dólares a grivnas</code>.

👁 <b>Lista</b>
Envía un código de divisa (p. ej. <code>eur</code>) para ver todas tus tasas frente a ella. /watch para gestionar.

📈 <b>Gráfico</b>
<code>gráfico eur usd</code> o <code>tendencia euro a dólar último año</code>. Toca 1D/1W/1M/3M/6M/1Y/2Y bajo el gráfico para cambiar — la misma tarjeta se actualiza en su sitio.

🔔 <b>Alertas de precio</b>
/alerts → Nueva alerta. Recibe un aviso cuando un par cruce un precio o se mueva ±X% en 24 h.

📅 <b>Resumen diario</b>
/alerts → 📅 Resumen diario. Elige un par o toda tu lista, una hora local — y recibe por la mañana el resumen con el movimiento de ayer.
O dilo directamente: <code>todos los días a las 9 eur a usd</code>.

⚙️ <b>Ajustes</b>
/settings — idioma y zona horaria (necesaria para la hora del resumen).

<i>Modo inline: escribe <code>@{username} 100 usd eur</code> en cualquier chat para compartir una tarjeta de conversión.</i>`,
  },
};
