import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesInsert } from "@/lib/database.types";
import { addDemoSaving, getDemoSavings } from "@/lib/mocks/store";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    return NextResponse.json(getDemoSavings());
  }

  const { data, error } = await supabase
    .from("savings")
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
    TablesInsert<'savings'>,
    "goal_name" | "target_amount" | "current_amount" | "deadline"
  >;

  if (!householdId) {
    const demoSaving = addDemoSaving({
      ...payload,
      current_amount: payload.current_amount ?? 0,
      deadline: payload.deadline ?? null,
    });
    return NextResponse.json(demoSaving, { status: 201 });
  }

  const insertPayload: TablesInsert<'savings'> = {
    ...payload,
    household_id: householdId,
  };

  const { data, error } = await supabase
    .from("savings")
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
