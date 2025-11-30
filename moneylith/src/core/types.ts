export type Currency = number;

export interface Income {
  id: string;
  name: string;
  amount: Currency;
  dayOfMonth: number;
  type: "salary" | "benefit" | "other";
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: Currency;
  dayOfMonth: number;
  category: "housing" | "utilities" | "insurance" | "subscription" | "other";
  active: boolean;
}

export interface VariableBudget {
  id: string;
  name: string;
  amount: Currency;
  category: "food" | "transport" | "fun" | "health" | "other";
}

export interface Debt {
  id: string;
  name: string;
  total: Currency;
  monthlyPayment: Currency;
  interestPct?: number;
  priority: 1 | 2 | 3;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: "date" | "threshold";
  triggerConfig: Record<string, unknown>;
  actionType: "notify" | "createMonthPlan";
  enabled: boolean;
}

export interface MonthPlan {
  year: number;
  month: number;
  totalIncome: Currency;
  totalFixedExpenses: Currency;
  totalVariableBudget: Currency;
  freeToSpend: Currency;
  weeklyBreakdown: Currency[];
}

export interface Account {
  id: string;
  name: string;
  iban: string;
  type: "Persoonlijk" | "Zakelijk" | "Virtuele kaart" | "Overig";
  bank: string;
  active: boolean;
}
