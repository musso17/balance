import type { DashboardData } from "@/lib/supabase/dashboard";
import { mockBudgets } from "@/components/budgets/mock-data";
import { mockTransactions } from "@/components/transactions/mock-data";
import { mockSavings } from "@/components/savings/mock-data";
import { mockDebts } from "@/components/debts/mock-data";

export function getDemoDashboard(monthKey: string): DashboardData {
  const transactions = mockTransactions.filter((item) =>
    item.date.startsWith(monthKey),
  );

  const availableMonths = Object.keys(mockBudgets);
  const safeMonth =
    (monthKey && Object.prototype.hasOwnProperty.call(mockBudgets, monthKey)
      ? monthKey
      : undefined) ??
    (availableMonths.length > 0 ? availableMonths[0] : undefined);
  const rawBudgets = safeMonth
    ? mockBudgets[safeMonth as keyof typeof mockBudgets] ?? []
    : [];
  const budgets = rawBudgets.map((item, index) => ({
    ...item,
    household_id: "",
    created_at: new Date(
      `${(safeMonth ?? monthKey) ?? "2025-11"}-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    ).toISOString(),
  }));
  const debts = mockDebts;
  const savings = mockSavings;

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
