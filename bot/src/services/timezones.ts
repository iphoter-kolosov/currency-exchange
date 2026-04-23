import type { Lang } from './storage.ts';

export type TzChoice = {
  id: string;
  label_en: string;
  label_ru: string;
  flag: string;
};

export const TIMEZONES: TzChoice[] = [
  { id: 'Europe/Kyiv', label_en: 'Kyiv', label_ru: 'Киев', flag: '🇺🇦' },
  { id: 'Europe/Moscow', label_en: 'Moscow', label_ru: 'Москва', flag: '🇷🇺' },
  { id: 'Europe/Warsaw', label_en: 'Warsaw', label_ru: 'Варшава', flag: '🇵🇱' },
  { id: 'Europe/Berlin', label_en: 'Berlin', label_ru: 'Берлин', flag: '🇩🇪' },
  { id: 'Europe/London', label_en: 'London', label_ru: 'Лондон', flag: '🇬🇧' },
  { id: 'America/New_York', label_en: 'New York', label_ru: 'Нью-Йорк', flag: '🇺🇸' },
  { id: 'America/Los_Angeles', label_en: 'Los Angeles', label_ru: 'Лос-Анджелес', flag: '🇺🇸' },
  { id: 'Asia/Dubai', label_en: 'Dubai', label_ru: 'Дубай', flag: '🇦🇪' },
  { id: 'Asia/Tbilisi', label_en: 'Tbilisi', label_ru: 'Тбилиси', flag: '🇬🇪' },
  { id: 'Asia/Tokyo', label_en: 'Tokyo', label_ru: 'Токио', flag: '🇯🇵' },
  { id: 'UTC', label_en: 'UTC', label_ru: 'UTC', flag: '🌍' },
];

export const DEFAULT_TZ = 'Europe/Kyiv';

export function tzLabel(tz: string, lang: Lang): string {
  const found = TIMEZONES.find((t) => t.id === tz);
  if (!found) return tz;
  return `${found.flag} ${lang === 'ru' ? found.label_ru : found.label_en}`;
}

export function localParts(tz: string, at: Date = new Date()): {
  ymd: string;
  hour: number;
  minute: number;
} {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
    return {
      ymd: `${get('year')}-${get('month')}-${get('day')}`,
      hour: parseInt(get('hour'), 10),
      minute: parseInt(get('minute'), 10),
    };
  } catch {
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const get = (type: string) => p.find((x) => x.type === type)?.value ?? '00';
    return {
      ymd: `${get('year')}-${get('month')}-${get('day')}`,
      hour: parseInt(get('hour'), 10),
      minute: parseInt(get('minute'), 10),
    };
  }
}
