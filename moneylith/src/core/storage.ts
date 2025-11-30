import type {
  Account,
  AutomationRule,
  Debt,
  FixedExpense,
  Income,
  VariableBudget,
} from "./types";

const STORAGE_KEYS = {
  incomes: "moneylith:incomes",
  fixedExpenses: "moneylith:fixed-expenses",
  variableBudgets: "moneylith:variable-budgets",
  debts: "moneylith:debts",
  automations: "moneylith:automations",
  accounts: "moneylith:accounts",
} as const;

const defaultIncomes: Income[] = [
  { id: "income-salary", name: "Maandelijks salaris", amount: 3400, dayOfMonth: 27, type: "salary" },
  { id: "income-freelance", name: "Side projects", amount: 620, dayOfMonth: 15, type: "other" },
];

const defaultFixedExpenses: FixedExpense[] = [
  { id: "fixed-housing", name: "Huur + maandelijkse servicekosten", amount: 1120, dayOfMonth: 1, category: "housing", active: true },
  { id: "fixed-subscription", name: "Streaming + opslag", amount: 44, dayOfMonth: 4, category: "subscription", active: true },
  { id: "fixed-utilities", name: "Energie + water", amount: 220, dayOfMonth: 8, category: "utilities", active: true },
];

const defaultVariableBudgets: VariableBudget[] = [
  { id: "variable-food", name: "Boodschappen & huishouden", amount: 360, category: "food" },
  { id: "variable-transport", name: "Openbaar vervoer & deelauto", amount: 160, category: "transport" },
  { id: "variable-fun", name: "Fun & ontspanning", amount: 210, category: "fun" },
];

const defaultDebts: Debt[] = [
  { id: "debt-study", name: "Studielening", total: 12800, monthlyPayment: 230, interestPct: 2.4, priority: 2 },
  { id: "debt-credit", name: "Creditcard", total: 4200, monthlyPayment: 120, interestPct: 16.9, priority: 1 },
  { id: "debt-auto", name: "Autolening", total: 8200, monthlyPayment: 310, interestPct: 5.1, priority: 3 },
];

const defaultAutomations: AutomationRule[] = [
  { id: "automation-space", name: "Check vrije speelruimte", triggerType: "threshold", triggerConfig: { freeToSpend: 300 }, actionType: "notify", enabled: true },
  { id: "automation-save", name: "Plan extra buffer", triggerType: "date", triggerConfig: { day: 20 }, actionType: "createMonthPlan", enabled: false },
];

const defaultAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Zakelijke rekening ING",
    iban: "NL INGB 0398 5669 25",
    type: "Zakelijk",
    bank: "ING",
    active: true,
  },
  {
    id: "acc-2",
    name: "Persoonlijke rekening ING",
    iban: "NL95 INGB 0682 3386 99",
    type: "Persoonlijk",
    bank: "ING",
    active: true,
  },
  {
    id: "acc-3",
    name: "bunq virtuele kaart",
    iban: "NL73 BUNQ 2088 0864 20",
    type: "Virtuele kaart",
    bank: "bunq",
    active: true,
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return clone(fallback);
  }

  const serialized = window.localStorage.getItem(key);
  if (!serialized) {
    return clone(fallback);
  }

  try {
    return JSON.parse(serialized) as T;
  } catch {
    return clone(fallback);
  }
}

function writeToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadIncomes(): Income[] {
  return readFromStorage(STORAGE_KEYS.incomes, defaultIncomes);
}

export function loadFixedExpenses(): FixedExpense[] {
  return readFromStorage(STORAGE_KEYS.fixedExpenses, defaultFixedExpenses);
}

export function loadVariableBudgets(): VariableBudget[] {
  return readFromStorage(STORAGE_KEYS.variableBudgets, defaultVariableBudgets);
}

export function loadDebts(): Debt[] {
  return readFromStorage(STORAGE_KEYS.debts, defaultDebts);
}

export function loadAutomations(): AutomationRule[] {
  return readFromStorage(STORAGE_KEYS.automations, defaultAutomations);
}

export function loadAccounts(): Account[] {
  return readFromStorage(STORAGE_KEYS.accounts, defaultAccounts);
}

export function persistIncomes(incomes: Income[]): void {
  writeToStorage(STORAGE_KEYS.incomes, incomes);
}

export function persistFixedExpenses(expenses: FixedExpense[]): void {
  writeToStorage(STORAGE_KEYS.fixedExpenses, expenses);
}

export function persistVariableBudgets(budgets: VariableBudget[]): void {
  writeToStorage(STORAGE_KEYS.variableBudgets, budgets);
}

export function persistDebts(debts: Debt[]): void {
  writeToStorage(STORAGE_KEYS.debts, debts);
}

export function persistAutomations(rules: AutomationRule[]): void {
  writeToStorage(STORAGE_KEYS.automations, rules);
}

export function persistAccounts(accounts: Account[]): void {
  writeToStorage(STORAGE_KEYS.accounts, accounts);
}
