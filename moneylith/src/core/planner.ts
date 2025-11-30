import type { Currency, FixedExpense, Income, MonthPlan, VariableBudget } from "./types";

function buildWeeklyBreakdown(freeToSpend: Currency, weeks = 4): Currency[] {
  const base = Math.round((freeToSpend / weeks) * 100) / 100;
  const remainder = Number((freeToSpend - base * weeks).toFixed(2));
  const breakdown = new Array(weeks).fill(base);
  breakdown[breakdown.length - 1] += remainder;
  return breakdown;
}

export function generateMonthPlan(
  year: number,
  month: number,
  incomes: Income[],
  fixed: FixedExpense[],
  variable: VariableBudget[]
): MonthPlan {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalFixedExpenses = fixed
    .filter((expense) => expense.active)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalVariableBudget = variable.reduce((sum, budget) => sum + budget.amount, 0);
  const freeToSpend = totalIncome - totalFixedExpenses - totalVariableBudget;

  return {
    year,
    month,
    totalIncome,
    totalFixedExpenses,
    totalVariableBudget,
    freeToSpend,
    weeklyBreakdown: buildWeeklyBreakdown(freeToSpend, 4),
  };
}
