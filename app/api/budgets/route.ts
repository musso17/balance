import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { Tables } from "@/types/database";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const monthKey = searchParams.get("monthKey");

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
    Tables["budgets"]["Insert"],
    "month_key" | "category" | "amount"
  >;

  const insertPayload = {
    ...payload,
    household_id: householdId,
  } as Tables["budgets"]["Insert"];

  const { data, error } = await supabase
    .from("budgets")
    .insert([insertPayload] as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
