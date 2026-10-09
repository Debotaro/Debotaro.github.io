export type TransactionType = 'expense' | 'income';
export interface Transaction {
  id: string;
  merchant: string;
  note: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
}
export interface LedgerState {
  transactions: Transaction[];
  budgets: Record<string, number>;
  name: string;
}
export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food & dining',
  'Shopping',
  'Transport',
  'Health',
  'Experiences',
  'Subscriptions',
];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Other income'];
export const CATEGORY_COLOURS: Record<string, string> = {
  Housing: '#214f41',
  'Food & dining': '#669078',
  Shopping: '#c1cd8b',
  Transport: '#d7b579',
  Health: '#9daba3',
  Experiences: '#b4947d',
  Subscriptions: '#d6ddd0',
};
export const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
export const DEFAULT_MONTH = '2026-10';
export const OPENING_BALANCE = 284000;
export const STORAGE_KEY = 'nila-ledger-v1';
const expenses: [string, string, number, number, string][] = [
  ['The Foundry Apartments', 'Housing', 135000, 1, 'Monthly rent'],
  ['Octopus Energy', 'Housing', 9400, 2, 'Electricity and gas'],
  ['Waitrose & Partners', 'Food & dining', 6475, 3, 'Weekly groceries'],
  ['Transport for London', 'Transport', 4200, 3, 'Travel card top-up'],
  ['Studio Nicholson', 'Shopping', 18500, 4, 'Autumn wardrobe'],
  ['The Modern House', 'Subscriptions', 1200, 4, 'Design journal'],
  ['PureGym', 'Health', 3500, 5, 'Monthly membership'],
  ['Ozone Coffee', 'Food & dining', 1850, 5, 'Saturday brunch'],
  ['Spotify', 'Subscriptions', 1199, 6, 'Individual plan'],
  ['Sainsbury’s', 'Food & dining', 7820, 6, 'Weekly groceries'],
  ['Aesop', 'Shopping', 6500, 7, 'Personal care'],
  ['Dishoom', 'Food & dining', 8650, 7, 'Dinner with friends'],
  ['Curzon Cinema', 'Experiences', 3200, 7, 'Two cinema tickets'],
  ['National Rail', 'Transport', 5800, 7, 'Weekend in Brighton'],
  ['Apple iCloud', 'Subscriptions', 299, 7, 'Cloud storage'],
  ['Neighbourhood Studio', 'Health', 2800, 7, 'Yoga workshop'],
];
export function seedState(): LedgerState {
  const transactions: Transaction[] = [];
  MONTHS.forEach((month, monthIndex) => {
    transactions.push({
      id: `${month}-salary`,
      merchant: 'Form & Field Studio',
      note: 'Monthly salary',
      date: `${month}-01`,
      type: 'income',
      category: 'Salary',
      amount: 460000,
    });
    transactions.push({
      id: `${month}-freelance`,
      merchant: 'Northstar Creative',
      note: 'Brand consultancy',
      date: `${month}-04`,
      type: 'income',
      category: 'Freelance',
      amount: 65000 + monthIndex * 2500,
    });
    expenses.forEach(([merchant, category, amount, day, note], index) => {
      const change =
        category === 'Housing' || category === 'Subscriptions'
          ? 0
          : (monthIndex - 5) * (index % 3 === 0 ? 320 : -140);
      transactions.push({
        id: `${month}-${index}`,
        merchant,
        category,
        amount: Math.max(100, amount + change),
        date: `${month}-${String(day).padStart(2, '0')}`,
        note,
        type: 'expense',
      });
    });
  });
  return {
    transactions,
    budgets: {
      Housing: 150000,
      'Food & dining': 45000,
      Shopping: 30000,
      Transport: 18000,
      Health: 12000,
      Experiences: 18000,
      Subscriptions: 6500,
    },
    name: 'Alex Morgan',
  };
}
export function money(cents: number, decimals = false): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: decimals ? 2 : 0,
  }).format(cents / 100);
}
export function monthLabel(month: string, short = false): string {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString('en-GB', {
    month: short ? 'short' : 'long',
    ...(short ? {} : { year: 'numeric' }),
  });
}
export function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
export function sums(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((total, t) => total + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((total, t) => total + t.amount, 0);
  return {
    income,
    expense,
    net: income - expense,
    savingsRate: income ? Math.round(((income - expense) / income) * 100) : 0,
  };
}
export function categoryTotals(transactions: Transaction[]) {
  return EXPENSE_CATEGORIES.map((name) => ({
    name,
    value: transactions
      .filter((t) => t.type === 'expense' && t.category === name)
      .reduce((sum, t) => sum + t.amount, 0),
    colour: CATEGORY_COLOURS[name],
  }));
}
export function loadState(): LedgerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return seedState();
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') return seedState();
    const candidate = parsed as LedgerState;
    if (
      !Array.isArray(candidate.transactions) ||
      typeof candidate.name !== 'string' ||
      !candidate.budgets ||
      typeof candidate.budgets !== 'object'
    )
      return seedState();
    const validTransaction = (t: Transaction) =>
      t &&
      typeof t.id === 'string' &&
      typeof t.merchant === 'string' &&
      typeof t.note === 'string' &&
      typeof t.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
      Number.isFinite(new Date(t.date).getTime()) &&
      Number.isSafeInteger(t.amount) &&
      t.amount > 0 &&
      (t.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).includes(t.category);
    if (
      !candidate.transactions.every(
        (t) => validTransaction(t) && (t.type === 'income' || t.type === 'expense'),
      )
    )
      return seedState();
    if (
      !EXPENSE_CATEGORIES.every(
        (category) =>
          Number.isSafeInteger(candidate.budgets[category]) && candidate.budgets[category] > 0,
      )
    )
      return seedState();
    return candidate;
  } catch {
    return seedState();
  }
}
export function downloadCsv(transactions: Transaction[], filename: string) {
  const cell = (value: string) =>
    '"' + value.replace(/^[=+\-@\t\r]/, (match) => `'${match}`).replace(/"/g, '""') + '"';
  const rows = [
    ['Date', 'Merchant', 'Type', 'Category', 'Amount (GBP)', 'Note'],
    ...transactions.map((t) => [
      t.date,
      t.merchant,
      t.type,
      t.category,
      (t.amount / 100).toFixed(2),
      t.note,
    ]),
  ];
  const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
