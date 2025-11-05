import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesInsert } from "@/lib/database.types";
import { addDemoDebt, getDemoDebts } from "@/lib/mocks/store";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    return NextResponse.json(getDemoDebts());
  }

  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("household_id", householdId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();
  const payload = (await request.json()) as Pick<
    TablesInsert<'debts'>,
    "entity" | "balance" | "monthly_payment" | "interest_rate" | "status"
  >;

  if (!householdId) {
    const demoDebt = addDemoDebt({
      ...payload,
      interest_rate: payload.interest_rate ?? null,
      status: payload.status ?? "activa",
    });
    return NextResponse.json(demoDebt, { status: 201 });
  }

  const insertPayload: TablesInsert<'debts'> = {
    ...payload,
    household_id: householdId,
  };

  const { data, error } = await supabase
    .from("debts")
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
