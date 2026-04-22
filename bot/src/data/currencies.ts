export type Currency = {
  code: string;
  iso: string;
  flag: string;
  symbol: string;
  name_en: string;
  name_ru: string;
  decimals?: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'usd', iso: 'USD', flag: '🇺🇸', symbol: '$', name_en: 'United States Dollar', name_ru: 'Доллар США' },
  { code: 'eur', iso: 'EUR', flag: '🇪🇺', symbol: '€', name_en: 'Euro', name_ru: 'Евро' },
  { code: 'gbp', iso: 'GBP', flag: '🇬🇧', symbol: '£', name_en: 'British Pound', name_ru: 'Британский фунт' },
  { code: 'jpy', iso: 'JPY', flag: '🇯🇵', symbol: '¥', name_en: 'Japanese Yen', name_ru: 'Японская иена', decimals: 0 },
  { code: 'chf', iso: 'CHF', flag: '🇨🇭', symbol: 'Fr', name_en: 'Swiss Franc', name_ru: 'Швейцарский франк' },
  { code: 'cny', iso: 'CNY', flag: '🇨🇳', symbol: '¥', name_en: 'Chinese Yuan', name_ru: 'Китайский юань' },
  { code: 'aud', iso: 'AUD', flag: '🇦🇺', symbol: 'A$', name_en: 'Australian Dollar', name_ru: 'Австралийский доллар' },
  { code: 'cad', iso: 'CAD', flag: '🇨🇦', symbol: 'C$', name_en: 'Canadian Dollar', name_ru: 'Канадский доллар' },
  { code: 'nzd', iso: 'NZD', flag: '🇳🇿', symbol: 'NZ$', name_en: 'New Zealand Dollar', name_ru: 'Новозеландский доллар' },
  { code: 'sek', iso: 'SEK', flag: '🇸🇪', symbol: 'kr', name_en: 'Swedish Krona', name_ru: 'Шведская крона' },
  { code: 'nok', iso: 'NOK', flag: '🇳🇴', symbol: 'kr', name_en: 'Norwegian Krone', name_ru: 'Норвежская крона' },
  { code: 'dkk', iso: 'DKK', flag: '🇩🇰', symbol: 'kr', name_en: 'Danish Krone', name_ru: 'Датская крона' },
  { code: 'pln', iso: 'PLN', flag: '🇵🇱', symbol: 'zł', name_en: 'Polish Zloty', name_ru: 'Польский злотый' },
  { code: 'czk', iso: 'CZK', flag: '🇨🇿', symbol: 'Kč', name_en: 'Czech Koruna', name_ru: 'Чешская крона' },
  { code: 'huf', iso: 'HUF', flag: '🇭🇺', symbol: 'Ft', name_en: 'Hungarian Forint', name_ru: 'Венгерский форинт', decimals: 0 },
  { code: 'ron', iso: 'RON', flag: '🇷🇴', symbol: 'lei', name_en: 'Romanian Leu', name_ru: 'Румынский лей' },
  { code: 'bgn', iso: 'BGN', flag: '🇧🇬', symbol: 'лв', name_en: 'Bulgarian Lev', name_ru: 'Болгарский лев' },
  { code: 'try', iso: 'TRY', flag: '🇹🇷', symbol: '₺', name_en: 'Turkish Lira', name_ru: 'Турецкая лира' },
  { code: 'uah', iso: 'UAH', flag: '🇺🇦', symbol: '₴', name_en: 'Ukrainian Hryvnia', name_ru: 'Украинская гривна' },
  { code: 'rub', iso: 'RUB', flag: '🇷🇺', symbol: '₽', name_en: 'Russian Ruble', name_ru: 'Российский рубль' },
  { code: 'byn', iso: 'BYN', flag: '🇧🇾', symbol: 'Br', name_en: 'Belarusian Ruble', name_ru: 'Белорусский рубль' },
  { code: 'kzt', iso: 'KZT', flag: '🇰🇿', symbol: '₸', name_en: 'Kazakhstani Tenge', name_ru: 'Казахстанский тенге' },
  { code: 'gel', iso: 'GEL', flag: '🇬🇪', symbol: '₾', name_en: 'Georgian Lari', name_ru: 'Грузинский лари' },
  { code: 'amd', iso: 'AMD', flag: '🇦🇲', symbol: '֏', name_en: 'Armenian Dram', name_ru: 'Армянский драм', decimals: 0 },
  { code: 'azn', iso: 'AZN', flag: '🇦🇿', symbol: '₼', name_en: 'Azerbaijani Manat', name_ru: 'Азербайджанский манат' },
  { code: 'ils', iso: 'ILS', flag: '🇮🇱', symbol: '₪', name_en: 'Israeli Shekel', name_ru: 'Израильский шекель' },
  { code: 'aed', iso: 'AED', flag: '🇦🇪', symbol: 'د.إ', name_en: 'UAE Dirham', name_ru: 'Дирхам ОАЭ' },
  { code: 'sar', iso: 'SAR', flag: '🇸🇦', symbol: 'ر.س', name_en: 'Saudi Riyal', name_ru: 'Саудовский риял' },
  { code: 'inr', iso: 'INR', flag: '🇮🇳', symbol: '₹', name_en: 'Indian Rupee', name_ru: 'Индийская рупия' },
  { code: 'krw', iso: 'KRW', flag: '🇰🇷', symbol: '₩', name_en: 'South Korean Won', name_ru: 'Южнокорейская вона', decimals: 0 },
  { code: 'sgd', iso: 'SGD', flag: '🇸🇬', symbol: 'S$', name_en: 'Singapore Dollar', name_ru: 'Сингапурский доллар' },
  { code: 'hkd', iso: 'HKD', flag: '🇭🇰', symbol: 'HK$', name_en: 'Hong Kong Dollar', name_ru: 'Гонконгский доллар' },
  { code: 'thb', iso: 'THB', flag: '🇹🇭', symbol: '฿', name_en: 'Thai Baht', name_ru: 'Тайский бат' },
  { code: 'vnd', iso: 'VND', flag: '🇻🇳', symbol: '₫', name_en: 'Vietnamese Dong', name_ru: 'Вьетнамский донг', decimals: 0 },
  { code: 'myr', iso: 'MYR', flag: '🇲🇾', symbol: 'RM', name_en: 'Malaysian Ringgit', name_ru: 'Малайзийский ринггит' },
  { code: 'idr', iso: 'IDR', flag: '🇮🇩', symbol: 'Rp', name_en: 'Indonesian Rupiah', name_ru: 'Индонезийская рупия', decimals: 0 },
  { code: 'php', iso: 'PHP', flag: '🇵🇭', symbol: '₱', name_en: 'Philippine Peso', name_ru: 'Филиппинское песо' },
  { code: 'mxn', iso: 'MXN', flag: '🇲🇽', symbol: 'MX$', name_en: 'Mexican Peso', name_ru: 'Мексиканское песо' },
  { code: 'brl', iso: 'BRL', flag: '🇧🇷', symbol: 'R$', name_en: 'Brazilian Real', name_ru: 'Бразильский реал' },
  { code: 'ars', iso: 'ARS', flag: '🇦🇷', symbol: '$', name_en: 'Argentine Peso', name_ru: 'Аргентинское песо' },
  { code: 'clp', iso: 'CLP', flag: '🇨🇱', symbol: '$', name_en: 'Chilean Peso', name_ru: 'Чилийское песо', decimals: 0 },
  { code: 'zar', iso: 'ZAR', flag: '🇿🇦', symbol: 'R', name_en: 'South African Rand', name_ru: 'Южноафриканский рэнд' },
  { code: 'egp', iso: 'EGP', flag: '🇪🇬', symbol: 'E£', name_en: 'Egyptian Pound', name_ru: 'Египетский фунт' },
  { code: 'ngn', iso: 'NGN', flag: '🇳🇬', symbol: '₦', name_en: 'Nigerian Naira', name_ru: 'Нигерийская найра' },
  { code: 'btc', iso: 'BTC', flag: '₿', symbol: '₿', name_en: 'Bitcoin', name_ru: 'Биткойн', decimals: 8 },
  { code: 'eth', iso: 'ETH', flag: 'Ξ', symbol: 'Ξ', name_en: 'Ethereum', name_ru: 'Эфириум', decimals: 6 },
];

export const CURRENCY_BY_CODE: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
);

export const CURRENCY_BY_ISO: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map((c) => [c.iso, c]),
);

export const DEFAULT_WATCHLIST = ['eur', 'usd', 'uah', 'rub', 'pln'];

/** Native-language aliases mapped to ISO codes. Used by findCurrency so
 * common forms like "форинт", "евро", "dollar" resolve without a trip
 * to the LLM. Russian forms include case variants (именительный,
 * родительный, множественное) because users don't dictionary-form
 * their typing. Kept intentionally focused on the currencies people
 * actually say by name — obscure ones fall back to ISO codes. */
export const CURRENCY_ALIASES: Record<string, string> = {
  // USD
  dollar: 'usd', dollars: 'usd', usd$: 'usd', buck: 'usd', bucks: 'usd',
  'доллар': 'usd', 'доллара': 'usd', 'доллары': 'usd', 'долларов': 'usd',
  'доллару': 'usd', 'долларе': 'usd', 'долларом': 'usd',
  'бакс': 'usd', 'бакса': 'usd', 'баксы': 'usd', 'баксов': 'usd',
  // EUR
  euro: 'eur', euros: 'eur',
  'евро': 'eur', 'еврик': 'eur', 'еврики': 'eur',
  // GBP
  pound: 'gbp', pounds: 'gbp', sterling: 'gbp',
  'фунт': 'gbp', 'фунта': 'gbp', 'фунты': 'gbp', 'фунтов': 'gbp',
  // JPY
  yen: 'jpy',
  'йена': 'jpy', 'йены': 'jpy', 'йен': 'jpy', 'йену': 'jpy',
  'иена': 'jpy', 'иены': 'jpy', 'иен': 'jpy',
  // CHF
  franc: 'chf', francs: 'chf',
  'франк': 'chf', 'франка': 'chf', 'франки': 'chf', 'франков': 'chf',
  // CNY
  yuan: 'cny', yuans: 'cny', renminbi: 'cny', rmb: 'cny',
  'юань': 'cny', 'юаня': 'cny', 'юани': 'cny', 'юаней': 'cny',
  // UAH
  hryvnia: 'uah', hryvnias: 'uah', grivna: 'uah',
  'гривна': 'uah', 'гривны': 'uah', 'гривне': 'uah', 'гривен': 'uah',
  'гривну': 'uah', 'гривной': 'uah', 'грн': 'uah', 'гривн': 'uah',
  // RUB
  ruble: 'rub', rouble: 'rub', rubles: 'rub', roubles: 'rub',
  'рубль': 'rub', 'рубля': 'rub', 'рубли': 'rub', 'рублей': 'rub',
  'рублю': 'rub', 'рублем': 'rub',
  // BYN
  'белрубль': 'byn',
  // PLN
  zloty: 'pln', zlotys: 'pln', zl: 'pln',
  'злотый': 'pln', 'злотые': 'pln', 'злотых': 'pln', 'злот': 'pln',
  // HUF
  forint: 'huf', forints: 'huf', ft: 'huf',
  'форинт': 'huf', 'форинта': 'huf', 'форинты': 'huf', 'форинтов': 'huf',
  'форинту': 'huf', 'форинтом': 'huf',
  // CZK
  koruna: 'czk',
  // TRY
  lira: 'try', liras: 'try',
  'лира': 'try', 'лиры': 'try', 'лир': 'try',
  // KZT
  tenge: 'kzt',
  'тенге': 'kzt',
  // AED
  dirham: 'aed', dirhams: 'aed',
  'дирхам': 'aed', 'дирхама': 'aed', 'дирхамы': 'aed',
  // SAR
  riyal: 'sar', riyals: 'sar',
  'риял': 'sar', 'рияла': 'sar', 'риялы': 'sar',
  // ILS
  shekel: 'ils', shekels: 'ils',
  'шекель': 'ils', 'шекеля': 'ils', 'шекели': 'ils', 'шекелей': 'ils',
  // INR
  rupee: 'inr', rupees: 'inr',
  'рупия': 'inr', 'рупии': 'inr', 'рупий': 'inr',
  // KRW
  won: 'krw',
  'вона': 'krw', 'воны': 'krw', 'вон': 'krw',
  // THB
  baht: 'thb',
  'бат': 'thb', 'баты': 'thb', 'батов': 'thb',
  // BRL
  real: 'brl', reais: 'brl',
  'реал': 'brl', 'реалы': 'brl', 'реалов': 'brl',
  // ZAR
  rand: 'zar', rands: 'zar',
  'рэнд': 'zar', 'рэнды': 'zar',
  // BTC
  bitcoin: 'btc', bitcoins: 'btc',
  'биткоин': 'btc', 'биткоины': 'btc', 'биткойн': 'btc', 'биткойны': 'btc',
  'биток': 'btc', 'битка': 'btc', 'битки': 'btc',
  // ETH
  ether: 'eth', ethereum: 'eth', eth$: 'eth',
  'эфир': 'eth', 'эфира': 'eth', 'эфиру': 'eth', 'эфириум': 'eth', 'эфирка': 'eth',
};

export function findCurrency(query: string): Currency | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const aliased = CURRENCY_ALIASES[q];
  if (aliased && CURRENCY_BY_CODE[aliased]) return CURRENCY_BY_CODE[aliased];
  return (
    CURRENCY_BY_CODE[q] ||
    CURRENCIES.find((c) => c.iso.toLowerCase() === q) ||
    CURRENCIES.find((c) => c.name_en.toLowerCase() === q) ||
    CURRENCIES.find((c) => c.name_ru.toLowerCase() === q) ||
    null
  );
}
