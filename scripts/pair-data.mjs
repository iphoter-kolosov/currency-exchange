// Currency list duplicated from src/data/currencies.ts so the generator stays
// runnable as a plain Node ESM script with zero TypeScript / bundler deps.
export const CURRENCIES = [
  { code: 'usd', iso: 'USD', name: 'United States Dollar', symbol: '$', country: 'United States', decimals: 2 },
  { code: 'eur', iso: 'EUR', name: 'Euro', symbol: '€', country: 'European Union', decimals: 2 },
  { code: 'gbp', iso: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', decimals: 2 },
  { code: 'jpy', iso: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan', decimals: 0 },
  { code: 'chf', iso: 'CHF', name: 'Swiss Franc', symbol: 'Fr', country: 'Switzerland', decimals: 2 },
  { code: 'cny', iso: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China', decimals: 2 },
  { code: 'aud', iso: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia', decimals: 2 },
  { code: 'cad', iso: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada', decimals: 2 },
  { code: 'nzd', iso: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', country: 'New Zealand', decimals: 2 },
  { code: 'sek', iso: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden', decimals: 2 },
  { code: 'nok', iso: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway', decimals: 2 },
  { code: 'dkk', iso: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark', decimals: 2 },
  { code: 'pln', iso: 'PLN', name: 'Polish Zloty', symbol: 'zł', country: 'Poland', decimals: 2 },
  { code: 'czk', iso: 'CZK', name: 'Czech Koruna', symbol: 'Kč', country: 'Czechia', decimals: 2 },
  { code: 'huf', iso: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', country: 'Hungary', decimals: 0 },
  { code: 'ron', iso: 'RON', name: 'Romanian Leu', symbol: 'lei', country: 'Romania', decimals: 2 },
  { code: 'bgn', iso: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', country: 'Bulgaria', decimals: 2 },
  { code: 'try', iso: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey', decimals: 2 },
  { code: 'uah', iso: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', country: 'Ukraine', decimals: 2 },
  { code: 'rub', iso: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia', decimals: 2 },
  { code: 'byn', iso: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', country: 'Belarus', decimals: 2 },
  { code: 'kzt', iso: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', country: 'Kazakhstan', decimals: 2 },
  { code: 'gel', iso: 'GEL', name: 'Georgian Lari', symbol: '₾', country: 'Georgia', decimals: 2 },
  { code: 'amd', iso: 'AMD', name: 'Armenian Dram', symbol: '֏', country: 'Armenia', decimals: 0 },
  { code: 'azn', iso: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', country: 'Azerbaijan', decimals: 2 },
  { code: 'ils', iso: 'ILS', name: 'Israeli Shekel', symbol: '₪', country: 'Israel', decimals: 2 },
  { code: 'aed', iso: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates', decimals: 2 },
  { code: 'sar', iso: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', country: 'Saudi Arabia', decimals: 2 },
  { code: 'inr', iso: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India', decimals: 2 },
  { code: 'krw', iso: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea', decimals: 0 },
  { code: 'sgd', iso: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore', decimals: 2 },
  { code: 'hkd', iso: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong', decimals: 2 },
  { code: 'thb', iso: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand', decimals: 2 },
  { code: 'vnd', iso: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam', decimals: 0 },
  { code: 'myr', iso: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia', decimals: 2 },
  { code: 'idr', iso: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia', decimals: 0 },
  { code: 'php', iso: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines', decimals: 2 },
  { code: 'mxn', iso: 'MXN', name: 'Mexican Peso', symbol: 'MX$', country: 'Mexico', decimals: 2 },
  { code: 'brl', iso: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil', decimals: 2 },
  { code: 'ars', iso: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina', decimals: 2 },
  { code: 'clp', iso: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile', decimals: 0 },
  { code: 'zar', iso: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa', decimals: 2 },
  { code: 'egp', iso: 'EGP', name: 'Egyptian Pound', symbol: 'E£', country: 'Egypt', decimals: 2 },
  { code: 'ngn', iso: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria', decimals: 2 },
];

export const CURRENCY_BY_CODE = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

/** Eight global majors used for "Related conversions" cross-linking. Picking
 * widely-traded pairs keeps the internal-link graph dense around terms with
 * the heaviest search volume. */
export const MAJORS = ['usd', 'eur', 'gbp', 'jpy', 'chf', 'cny', 'aud', 'cad'];
