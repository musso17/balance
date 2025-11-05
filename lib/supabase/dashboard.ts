import { addMonths } from "date-fns";

import { getHouseholdId } from "./household";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Budget,
  Debt,
  Tables,
} from "@/lib/database.types";
import { calculateBalance } from "@/lib/utils/number";

export interface DashboardData {
  totals: {
    incomes: number;
    expenses: number;
    balance: number;
    monthlyDebtImpact: number;
    savingsProgress: number;
  };
  categories: Array<{
    category: string;
    expense: number;
    budget?: number;
  }>;
  transactions: Tables<'transactions'>[];
  budgets: Budget[];
  debts: Debt[];
  savings: Tables<'savings'>[];
}

export async function getDashboardData(monthKey: string): Promise<DashboardData> {
  const supabase = createSupabaseServerClient(); // Correct client
  const householdId = await getHouseholdId(); // Added await

  if (!householdId) {
    throw new Error("No household found for the current user.");
  }

  const startDate = new Date(`${monthKey}-01T00:00:00.000Z`);
  const endDate = addMonths(startDate, 1);

  const [{ data: transactions, error: transactionsError }, { data: budgets, error: budgetsError }, { data: debts, error: debtsError }, { data: savings, error: savingsError }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("household_id", householdId)
        .gte("date", startDate.toISOString())
        .lt("date", endDate.toISOString())
        .order("date", { ascending: false }),
      supabase
        .from("budgets")
        .select("*")
        .eq("household_id", householdId)
        .eq("month_key", monthKey),
      supabase
        .from("debts")
        .select("*")
        .eq("household_id", householdId),
      supabase
        .from("savings")
        .select("*")
        .eq("household_id", householdId),
    ]);

  if (transactionsError) throw transactionsError;
  if (budgetsError) throw budgetsError;
  if (debtsError) throw debtsError;
  if (savingsError) throw savingsError;

  const transactionList = (transactions ?? []) as Tables<'transactions'>[];
  const budgetList = (budgets ?? []) as Budget[];
  const debtList = (debts ?? []) as Debt[];
  const savingsList = (savings ?? []) as Tables<'savings'>[];

  const incomes = transactionList.filter((item) => item.tipo === "ingreso");
  const expenses = transactionList.filter(
    (item) => item.tipo === "gasto" || item.tipo === "deuda",
  );

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.monto, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.monto, 0);
  const monthlyDebtImpact = debtList.reduce(
    (acc, curr) => acc + curr.monthly_payment,
    0,
  );

  const categoriesMap = new Map<string, number>();

  for (const expense of transactionList) {
    if (expense.tipo !== "gasto") continue;
    const current = categoriesMap.get(expense.category) ?? 0;
    categoriesMap.set(expense.category, current + expense.monto);
  }

  const budgetMap = new Map<string, number>();
  budgetList.forEach((budget) => {
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
    savingsList.length > 0
      ? savingsList.reduce((acc, goal) => {
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
      balance: calculateBalance(totalIncomes, totalExpenses),
      monthlyDebtImpact,
      savingsProgress,
    },
    categories,
    transactions: transactionList,
    budgets: budgetList,
    debts: debtList,
    savings: savingsList,
  };
}
