import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesInsert } from "@/lib/database.types";
import { addDemoBudget, getDemoBudgets } from "@/lib/mocks/store";
import { isDemoMode } from "@/lib/mocks/config";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const { searchParams } = new URL(request.url);
  const monthKey =
    searchParams.get("monthKey") ?? new Date().toISOString().slice(0, 7);

  if (isDemoMode && !householdId) {
    return NextResponse.json(getDemoBudgets(monthKey));
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  let query = supabase
    .from("budgets")
    .select("*")
    .eq("household_id", householdId);

  if (monthKey) {
    query = query.eq("month_key", monthKey);
  }

  const { data: currentBudgets, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Lazy Copy Logic: If no budgets for this month, try to copy from the most recent previous month
  if ((!currentBudgets || currentBudgets.length === 0) && monthKey) {
    // Find the most recent month with budgets
    const { data: previousBudgets } = await supabase
      .from("budgets")
      .select("*")
      .eq("household_id", householdId)
      .lt("month_key", monthKey)
      .order("month_key", { ascending: false })
      .limit(20); // Fetch a batch to find the latest unique month

    if (previousBudgets && previousBudgets.length > 0) {
      // Get the very last month that had data
      const lastMonthKey = previousBudgets[0].month_key;
      const budgetsToCopy = previousBudgets.filter(b => b.month_key === lastMonthKey);

      if (budgetsToCopy.length > 0) {
        const newBudgetsPayload = budgetsToCopy.map(b => ({
          household_id: householdId,
          month_key: monthKey,
          category: b.category,
          amount: b.amount,
        }));

        const { data: newBudgets, error: copyError } = await supabase
          .from("budgets")
          .insert(newBudgetsPayload)
          .select();

        if (!copyError && newBudgets) {
          return NextResponse.json(newBudgets);
        }
      }
    }
  }

  return NextResponse.json(currentBudgets ?? []);
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const payload = (await request.json()) as Pick<
    TablesInsert<'budgets'>,
    "month_key" | "category" | "amount"
  >;

  if (isDemoMode && !householdId) {
    const demoBudget = addDemoBudget(payload);
    return NextResponse.json(demoBudget, { status: 201 });
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const insertPayload: TablesInsert<'budgets'> = {
    ...payload,
    household_id: householdId,
  };

  const { data, error } = await supabase
    .from("budgets")
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
