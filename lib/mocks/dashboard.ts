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

  return {
    totals: {
      incomes: totalIncomes,
      expenses: totalExpenses,
      balance: totalIncomes - totalExpenses,
      monthlyDebtImpact,
      savingsProgress,
    },
    categories,
    transactions,
    budgets,
    debts,
    savings,
  };
}
