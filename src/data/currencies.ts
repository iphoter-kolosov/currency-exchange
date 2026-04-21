export type Currency = {
  code: string;
  iso: string;
  flagCode: string;
  symbol: string;
  name_en: string;
  name_ru: string;
  decimals?: number;
};

export const CURRENCIES: Currency[] = [
  { code: 'usd', iso: 'USD', flagCode: 'us', symbol: '$', name_en: 'United States Dollar', name_ru: 'Доллар США' },
  { code: 'eur', iso: 'EUR', flagCode: 'eu', symbol: '€', name_en: 'Euro', name_ru: 'Евро' },
  { code: 'gbp', iso: 'GBP', flagCode: 'gb', symbol: '£', name_en: 'British Pound', name_ru: 'Британский фунт' },
  { code: 'jpy', iso: 'JPY', flagCode: 'jp', symbol: '¥', name_en: 'Japanese Yen', name_ru: 'Японская иена', decimals: 0 },
  { code: 'chf', iso: 'CHF', flagCode: 'ch', symbol: 'Fr', name_en: 'Swiss Franc', name_ru: 'Швейцарский франк' },
  { code: 'cny', iso: 'CNY', flagCode: 'cn', symbol: '¥', name_en: 'Chinese Yuan', name_ru: 'Китайский юань' },
  { code: 'aud', iso: 'AUD', flagCode: 'au', symbol: 'A$', name_en: 'Australian Dollar', name_ru: 'Австралийский доллар' },
  { code: 'cad', iso: 'CAD', flagCode: 'ca', symbol: 'C$', name_en: 'Canadian Dollar', name_ru: 'Канадский доллар' },
  { code: 'nzd', iso: 'NZD', flagCode: 'nz', symbol: 'NZ$', name_en: 'New Zealand Dollar', name_ru: 'Новозеландский доллар' },
  { code: 'sek', iso: 'SEK', flagCode: 'se', symbol: 'kr', name_en: 'Swedish Krona', name_ru: 'Шведская крона' },
  { code: 'nok', iso: 'NOK', flagCode: 'no', symbol: 'kr', name_en: 'Norwegian Krone', name_ru: 'Норвежская крона' },
  { code: 'dkk', iso: 'DKK', flagCode: 'dk', symbol: 'kr', name_en: 'Danish Krone', name_ru: 'Датская крона' },
  { code: 'pln', iso: 'PLN', flagCode: 'pl', symbol: 'zł', name_en: 'Polish Zloty', name_ru: 'Польский злотый' },
  { code: 'czk', iso: 'CZK', flagCode: 'cz', symbol: 'Kč', name_en: 'Czech Koruna', name_ru: 'Чешская крона' },
  { code: 'huf', iso: 'HUF', flagCode: 'hu', symbol: 'Ft', name_en: 'Hungarian Forint', name_ru: 'Венгерский форинт', decimals: 0 },
  { code: 'ron', iso: 'RON', flagCode: 'ro', symbol: 'lei', name_en: 'Romanian Leu', name_ru: 'Румынский лей' },
  { code: 'bgn', iso: 'BGN', flagCode: 'bg', symbol: 'лв', name_en: 'Bulgarian Lev', name_ru: 'Болгарский лев' },
  { code: 'try', iso: 'TRY', flagCode: 'tr', symbol: '₺', name_en: 'Turkish Lira', name_ru: 'Турецкая лира' },
  { code: 'uah', iso: 'UAH', flagCode: 'ua', symbol: '₴', name_en: 'Ukrainian Hryvnia', name_ru: 'Украинская гривна' },
  { code: 'rub', iso: 'RUB', flagCode: 'ru', symbol: '₽', name_en: 'Russian Ruble', name_ru: 'Российский рубль' },
  { code: 'byn', iso: 'BYN', flagCode: 'by', symbol: 'Br', name_en: 'Belarusian Ruble', name_ru: 'Белорусский рубль' },
  { code: 'kzt', iso: 'KZT', flagCode: 'kz', symbol: '₸', name_en: 'Kazakhstani Tenge', name_ru: 'Казахстанский тенге' },
  { code: 'gel', iso: 'GEL', flagCode: 'ge', symbol: '₾', name_en: 'Georgian Lari', name_ru: 'Грузинский лари' },
  { code: 'amd', iso: 'AMD', flagCode: 'am', symbol: '֏', name_en: 'Armenian Dram', name_ru: 'Армянский драм', decimals: 0 },
  { code: 'azn', iso: 'AZN', flagCode: 'az', symbol: '₼', name_en: 'Azerbaijani Manat', name_ru: 'Азербайджанский манат' },
  { code: 'ils', iso: 'ILS', flagCode: 'il', symbol: '₪', name_en: 'Israeli Shekel', name_ru: 'Израильский шекель' },
  { code: 'aed', iso: 'AED', flagCode: 'ae', symbol: 'د.إ', name_en: 'UAE Dirham', name_ru: 'Дирхам ОАЭ' },
  { code: 'sar', iso: 'SAR', flagCode: 'sa', symbol: 'ر.س', name_en: 'Saudi Riyal', name_ru: 'Саудовский риял' },
  { code: 'inr', iso: 'INR', flagCode: 'in', symbol: '₹', name_en: 'Indian Rupee', name_ru: 'Индийская рупия' },
  { code: 'krw', iso: 'KRW', flagCode: 'kr', symbol: '₩', name_en: 'South Korean Won', name_ru: 'Южнокорейская вона', decimals: 0 },
  { code: 'sgd', iso: 'SGD', flagCode: 'sg', symbol: 'S$', name_en: 'Singapore Dollar', name_ru: 'Сингапурский доллар' },
  { code: 'hkd', iso: 'HKD', flagCode: 'hk', symbol: 'HK$', name_en: 'Hong Kong Dollar', name_ru: 'Гонконгский доллар' },
  { code: 'thb', iso: 'THB', flagCode: 'th', symbol: '฿', name_en: 'Thai Baht', name_ru: 'Тайский бат' },
  { code: 'vnd', iso: 'VND', flagCode: 'vn', symbol: '₫', name_en: 'Vietnamese Dong', name_ru: 'Вьетнамский донг', decimals: 0 },
  { code: 'myr', iso: 'MYR', flagCode: 'my', symbol: 'RM', name_en: 'Malaysian Ringgit', name_ru: 'Малайзийский ринггит' },
  { code: 'idr', iso: 'IDR', flagCode: 'id', symbol: 'Rp', name_en: 'Indonesian Rupiah', name_ru: 'Индонезийская рупия', decimals: 0 },
  { code: 'php', iso: 'PHP', flagCode: 'ph', symbol: '₱', name_en: 'Philippine Peso', name_ru: 'Филиппинское песо' },
  { code: 'mxn', iso: 'MXN', flagCode: 'mx', symbol: 'MX$', name_en: 'Mexican Peso', name_ru: 'Мексиканское песо' },
  { code: 'brl', iso: 'BRL', flagCode: 'br', symbol: 'R$', name_en: 'Brazilian Real', name_ru: 'Бразильский реал' },
  { code: 'ars', iso: 'ARS', flagCode: 'ar', symbol: '$', name_en: 'Argentine Peso', name_ru: 'Аргентинское песо' },
  { code: 'clp', iso: 'CLP', flagCode: 'cl', symbol: '$', name_en: 'Chilean Peso', name_ru: 'Чилийское песо', decimals: 0 },
  { code: 'zar', iso: 'ZAR', flagCode: 'za', symbol: 'R', name_en: 'South African Rand', name_ru: 'Южноафриканский рэнд' },
  { code: 'egp', iso: 'EGP', flagCode: 'eg', symbol: 'E£', name_en: 'Egyptian Pound', name_ru: 'Египетский фунт' },
  { code: 'ngn', iso: 'NGN', flagCode: 'ng', symbol: '₦', name_en: 'Nigerian Naira', name_ru: 'Нигерийская найра' },
];

export const CURRENCY_BY_CODE: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
);

export const DEFAULT_SELECTED_CODES = ['huf', 'eur', 'usd', 'uah', 'pln', 'nok', 'rub', 'czk'];
