import { NextResponse } from "next/server";

import { mockBudgets } from "@/components/budgets/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { Tables, TablesInsert } from "@/lib/database.types";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const { searchParams } = new URL(request.url);
  const monthKey =
    searchParams.get("monthKey") ?? new Date().toISOString().slice(0, 7);

  if (!householdId) {
    const availableMonths = Object.keys(mockBudgets);
    const safeMonth =
      (monthKey && Object.prototype.hasOwnProperty.call(mockBudgets, monthKey)
        ? monthKey
        : undefined) ??
      (availableMonths.length > 0 ? availableMonths[0] : undefined);
    const fallback = safeMonth
      ? [...(mockBudgets[safeMonth as keyof typeof mockBudgets] ?? [])]
      : [];
    const enriched = fallback.map((item, index) => ({
      ...item,
      household_id: "",
      created_at: new Date(
        `${(safeMonth ?? monthKey) ?? "2025-11"}-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      ).toISOString(),
    })) as Tables<"budgets">[];
    return NextResponse.json(enriched);
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

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const payload = (await request.json()) as Pick<
    TablesInsert<'budgets'>,
    "month_key" | "category" | "amount"
  >;

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
