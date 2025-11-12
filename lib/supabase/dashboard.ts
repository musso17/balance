import { addMonths, differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

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
    savingsRate: number;
  };
  comparisons: {
    previousMonthLabel: string;
    incomesDelta: number | null;
    expensesDelta: number | null;
    balanceDelta: number | null;
  };
  projections: {
    projectedMonthEndExpense: number;
    dailyAverageExpense: number;
  };
  history: Array<{
    month: string;
    label: string;
    incomes: number;
    expenses: number;
    balance: number;
  }>;
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
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    throw new Error("No household found for the current user.");
  }

  const startDate = new Date(`${monthKey}-01T00:00:00.000Z`);
  const endDate = addMonths(startDate, 1);
  const historyStartDate = addMonths(startDate, -5);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const formatMonthLabel = (d: Date, pattern = "MMMM") =>
    format(d, pattern, { locale: es });
  const monthKeyFromDate = (d: Date) => format(d, "yyyy-MM");

  const [
    { data: transactions, error: transactionsError },
    { data: budgets, error: budgetsError },
    { data: debts, error: debtsError },
    { data: savings, error: savingsError },
    { data: historyTransactions, error: historyTransactionsError },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("household_id", householdId)
      .gte("date", formatDate(startDate))
      .lt("date", formatDate(endDate))
      .order("date", { ascending: false })
      .order("created_at", { ascending: true }),
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
    supabase
      .from("transactions")
      .select("*")
      .eq("household_id", householdId)
      .gte("date", formatDate(historyStartDate))
      .lt("date", formatDate(endDate))
      .order("date", { ascending: true }),
  ]);

  if (transactionsError) throw transactionsError;
  if (budgetsError) throw budgetsError;
  if (debtsError) throw debtsError;
  if (savingsError) throw savingsError;
  if (historyTransactionsError) throw historyTransactionsError;

  const transactionList = (transactions ?? []) as Tables<'transactions'>[];
  const budgetList = (budgets ?? []) as Budget[];
  const debtList = (debts ?? []) as Debt[];
  const savingsList = (savings ?? []) as Tables<'savings'>[];
  const historyTransactionList = (historyTransactions ?? []) as Tables<'transactions'>[];

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

  const balance = calculateBalance(totalIncomes, totalExpenses);
  const savingsRate =
    totalIncomes > 0 ? balance / totalIncomes : 0;

  const monthlyHistoryMap = new Map<string, { incomes: number; expenses: number }>();
  historyTransactionList.forEach((entry) => {
    const key = entry.date.slice(0, 7);
    if (!monthlyHistoryMap.has(key)) {
      monthlyHistoryMap.set(key, { incomes: 0, expenses: 0 });
    }
    const bucket = monthlyHistoryMap.get(key)!;
    if (entry.tipo === "ingreso") {
      bucket.incomes += entry.monto;
    } else if (entry.tipo === "gasto" || entry.tipo === "deuda") {
      bucket.expenses += entry.monto;
    }
  });

  const historyMonths: Date[] = [];
  for (let i = 0; i < 6; i += 1) {
    historyMonths.push(addMonths(historyStartDate, i));
  }
  const history = historyMonths.map((monthDate) => {
    const key = monthKeyFromDate(monthDate);
    const bucket = monthlyHistoryMap.get(key) ?? { incomes: 0, expenses: 0 };
    return {
      month: key,
      label: format(monthDate, "MMM", { locale: es }),
      incomes: bucket.incomes,
      expenses: bucket.expenses,
      balance: calculateBalance(bucket.incomes, bucket.expenses),
    };
  });

  const previousMonthDate = addMonths(startDate, -1);
  const previousMonthKey = monthKeyFromDate(previousMonthDate);
  const previousMonthLabel = formatMonthLabel(previousMonthDate, "MMMM");
  const previousTotals = monthlyHistoryMap.get(previousMonthKey) ?? {
    incomes: 0,
    expenses: 0,
  };
  const previousBalance = calculateBalance(
    previousTotals.incomes,
    previousTotals.expenses,
  );

  const delta = (current: number, prev: number) =>
    prev > 0 ? (current - prev) / prev : null;

  const comparisons = {
    previousMonthLabel,
    incomesDelta: delta(totalIncomes, previousTotals.incomes),
    expensesDelta: delta(totalExpenses, previousTotals.expenses),
    balanceDelta: delta(balance, previousBalance),
  };

  const today = new Date();
  const daysInMonth = differenceInCalendarDays(endDate, startDate);
  const isCurrentMonth = today >= startDate && today < endDate;
  const elapsedDays = isCurrentMonth
    ? Math.max(1, differenceInCalendarDays(today, startDate) + 1)
    : daysInMonth;
  const dailyAverageExpense =
    elapsedDays > 0 ? totalExpenses / elapsedDays : totalExpenses;
  const projectedMonthEndExpense = dailyAverageExpense * daysInMonth;

  return {
    totals: {
      incomes: totalIncomes,
      expenses: totalExpenses,
      balance,
      monthlyDebtImpact,
      savingsProgress,
      savingsRate,
    },
    comparisons,
    projections: {
      projectedMonthEndExpense,
      dailyAverageExpense,
    },
    history,
    categories,
    transactions: transactionList,
    budgets: budgetList,
    debts: debtList,
    savings: savingsList,
  };
}
