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
    .from("transactions")
    .select("*")
    .eq("household_id", householdId)
    .order("date", { ascending: false });

  if (monthKey) {
    const startDate = new Date(`${monthKey}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    query = query
      .gte("date", startDate.toISOString())
      .lt("date", endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
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
    Tables["transactions"]["Insert"],
    "date" | "category" | "monto" | "persona" | "tipo" | "nota" | "metodo"
  >;

  const insertPayload = {
    ...payload,
    household_id: householdId,
  } as Tables["transactions"]["Insert"];

  const { data, error } = await supabase
    .from("transactions")
    .insert([insertPayload] as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
