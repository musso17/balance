import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesInsert } from "@/lib/database.types";
import { addDemoBudget, getDemoBudgets } from "@/lib/mocks/store";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const { searchParams } = new URL(request.url);
  const monthKey =
    searchParams.get("monthKey") ?? new Date().toISOString().slice(0, 7);

  if (!householdId) {
    return NextResponse.json(getDemoBudgets(monthKey));
  }

  let query = supabase
    .from("budgets")
    .select("*")
    .eq("household_id", householdId);

  if (monthKey) {
    query = query.eq("month_key", monthKey);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const payload = (await request.json()) as Pick<
    TablesInsert<'budgets'>,
    "month_key" | "category" | "amount"
  >;

  if (!householdId) {
    const demoBudget = addDemoBudget(payload);
    return NextResponse.json(demoBudget, { status: 201 });
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
