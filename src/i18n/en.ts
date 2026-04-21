export type Dict = {
  appTitle: string;
  convert: string;
  chart: string;
  addCurrency: string;
  searchPlaceholder: string;
  close: string;
  done: string;
  edit: string;
  remove: string;
  cannotRemoveBase: string;
  settings: string;
  language: string;
  russian: string;
  english: string;
  loading: string;
  updatedAt: string;
  offline: string;
  error: string;
  retry: string;
  perOne: string;
  timeframe: {
    '1D': string;
    '1W': string;
    '1M': string;
    '3M': string;
    '6M': string;
    '1Y': string;
    '2Y': string;
  };
  swap: string;
  from: string;
  to: string;
  empty: string;
};

export const en: Dict = {
  appTitle: 'Currency',
  convert: 'Convert',
  chart: 'Chart',
  addCurrency: 'Add currency',
  searchPlaceholder: 'Search currency or code',
  close: 'Close',
  done: 'Done',
  edit: 'Edit',
  remove: 'Remove',
  cannotRemoveBase: 'Cannot remove — selected as source',
  settings: 'Settings',
  language: 'Language',
  russian: 'Русский',
  english: 'English',
  loading: 'Loading…',
  updatedAt: 'Updated {date}',
  offline: 'Offline — using cached rates',
  error: 'Could not load rates',
  retry: 'Retry',
  perOne: '{target} per 1 {base}',
  timeframe: {
    '1D': '1D',
    '1W': '1W',
    '1M': '1M',
    '3M': '3M',
    '6M': '6M',
    '1Y': '1Y',
    '2Y': '2Y',
  },
  swap: 'Swap',
  from: 'From',
  to: 'To',
  empty: 'No currencies yet. Tap + to add one.',
};
