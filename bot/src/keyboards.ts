import { InlineKeyboard } from 'grammy';
import { t } from './i18n/index.ts';
import type { Lang } from './services/storage.ts';
import { TIMEFRAMES } from './services/dates.ts';

export function mainMenu(lang: Lang): InlineKeyboard {
  const T = t(lang).start;
  return new InlineKeyboard()
    .text(T.menu_convert, 'menu:convert').text(T.menu_watch, 'menu:watch').row()
    .text(T.menu_chart, 'menu:chart').text(T.menu_alerts, 'menu:alerts').row()
    .text(T.menu_settings, 'menu:settings').text(T.menu_help, 'menu:help');
}

export function watchMenu(lang: Lang): InlineKeyboard {
  const C = t(lang).common;
  const W = t(lang).watchlist;
  return new InlineKeyboard()
    .text('🔄', 'watch:refresh').text(C.add, 'watch:add').row()
    .text(W.change_base, 'watch:base').text('➖ ' + C.delete, 'watch:remove').row()
    .text(C.back, 'menu:home');
}

export function watchRemoveList(lang: Lang, codes: string[]): InlineKeyboard {
  const C = t(lang).common;
  const kb = new InlineKeyboard();
  for (let i = 0; i < codes.length; i += 3) {
    const row = codes.slice(i, i + 3);
    for (const code of row) kb.text(code.toUpperCase(), `watch:rm:${code}`);
    kb.row();
  }
  kb.text(C.done, 'menu:watch');
  return kb;
}

export function timeframeKeyboard(base: string, target: string, current?: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const tf of TIMEFRAMES) {
    const label = current === tf ? `▸ ${tf}` : tf;
    kb.text(label, `chart:tf:${base}:${target}:${tf}`);
  }
  kb.row();
  kb.text('🔁 Swap', `chart:swap:${base}:${target}:${current ?? '1M'}`);
  kb.text('← Back', 'menu:home');
  return kb;
}

export function alertsMenu(lang: Lang, alerts: { id: string; label: string }[]): InlineKeyboard {
  const T = t(lang).alerts;
  const C = t(lang).common;
  const kb = new InlineKeyboard();
  for (const a of alerts) {
    kb.text(`🗑 ${a.label}`, `alerts:del:${a.id}`).row();
  }
  kb.text(T.new, 'alerts:new').row();
  kb.text(C.back, 'menu:home');
  return kb;
}

export function alertTypeMenu(lang: Lang, base: string, target: string): InlineKeyboard {
  const T = t(lang).alerts;
  const C = t(lang).common;
  return new InlineKeyboard()
    .text(T.type_above, `alerts:type:above:${base}:${target}`)
    .text(T.type_below, `alerts:type:below:${base}:${target}`).row()
    .text(T.type_pct_up, `alerts:type:pct_up:${base}:${target}`)
    .text(T.type_pct_down, `alerts:type:pct_down:${base}:${target}`).row()
    .text(C.cancel, 'menu:alerts');
}

export function settingsMenu(lang: Lang): InlineKeyboard {
  const T = t(lang).settings;
  const C = t(lang).common;
  return new InlineKeyboard()
    .text(
      (lang === 'ru' ? '✓ ' : '') + T.language_ru,
      'settings:lang:ru',
    )
    .text(
      (lang === 'en' ? '✓ ' : '') + T.language_en,
      'settings:lang:en',
    ).row()
    .text(C.back, 'menu:home');
}
