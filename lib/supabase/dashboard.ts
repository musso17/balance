import { addMonths } from "date-fns";

import { getHouseholdId } from "./household";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Budget,
  Debt,
  SavingGoal,
  Transaction,
} from "@/types/database";
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
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  savings: SavingGoal[];
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

  const transactionList = (transactions ?? []) as Transaction[];
  const budgetList = (budgets ?? []) as Budget[];
  const debtList = (debts ?? []) as Debt[];
  const savingsList = (savings ?? []) as SavingGoal[];

  const incomes = transactionList.filter((item) => item.tipo === "ingreso");
  const expenses = transactionList.filter((item) => item.tipo === "gasto");

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.monto, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.monto, 0);
  const monthlyDebtImpact = debtList.reduce(
    (acc, curr) => acc + curr.monthly_payment,
    0,
  );

  const categoriesMap = new Map<string, number>();

  for (const expense of expenses) {
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
            ? goal.current_amount / goal.target_amount
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
