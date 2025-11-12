import type { DashboardData } from "@/lib/supabase/dashboard";
import {
  getDemoBudgets,
  getDemoDebts,
  getDemoSavings,
  getDemoTransactions,
} from "@/lib/mocks/store";

export function getDemoDashboard(monthKey: string): DashboardData {
  const transactions = getDemoTransactions(monthKey);
  const budgets = getDemoBudgets(monthKey);
  const debts = getDemoDebts();
  const savings = getDemoSavings();

  const incomes = transactions.filter((item) => item.tipo === "ingreso");
  const expenses = transactions.filter(
    (item) => item.tipo === "gasto" || item.tipo === "deuda",
  );

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.monto, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.monto, 0);
  const monthlyDebtImpact = debts.reduce(
    (acc, curr) => acc + curr.monthly_payment,
    0,
  );

  const categoriesMap = new Map<string, number>();

  for (const expense of expenses) {
    const current = categoriesMap.get(expense.category) ?? 0;
    categoriesMap.set(expense.category, current + expense.monto);
  }

  const budgetMap = new Map<string, number>();
  budgets.forEach((budget) => {
    budgetMap.set(budget.category, budget.amount);
  });

  const categories = Array.from(categoriesMap.entries()).map(
    ([category, amount]) => ({
      category,
      expense: amount,
      budget: budgetMap.get(category),
    }),
  );

  const savingsProgress =
    savings.length > 0
      ? savings.reduce((acc, goal) => {
          const progress = goal.target_amount
            ? (goal.current_amount ?? 0) / goal.target_amount
            : 0;
          return acc + progress;
        }, 0) / savings.length
      : 0;
  const savingsRate =
    totalIncomes > 0 ? (totalIncomes - totalExpenses) / totalIncomes : 0;

  const history = Array.from({ length: 6 }).map((_, index) => {
    const offset = 5 - index;
    const monthLabel = `M-${offset}`;
    const modifier = 1 - offset * 0.04;
    const incomesValue = totalIncomes * Math.max(modifier, 0.5);
    const expensesValue = totalExpenses * Math.max(modifier * 0.95, 0.4);
    return {
      month: `${monthKey}-${offset}`,
      label: monthLabel,
      incomes: incomesValue,
      expenses: expensesValue,
      balance: incomesValue - expensesValue,
    };
  });

  return {
    totals: {
      incomes: totalIncomes,
      expenses: totalExpenses,
      balance: totalIncomes - totalExpenses,
      monthlyDebtImpact,
      savingsProgress,
      savingsRate,
    },
    comparisons: {
      previousMonthLabel: "mes anterior",
      incomesDelta: null,
      expensesDelta: null,
      balanceDelta: null,
    },
    projections: {
      projectedMonthEndExpense: totalExpenses,
      dailyAverageExpense: totalExpenses / 30,
    },
    history,
    categories,
    transactions,
    budgets,
    debts,
    savings,
  };
}
