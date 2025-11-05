import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesInsert } from "@/lib/database.types";
import { addDemoTransaction, getDemoTransactions } from "@/lib/mocks/store";

export const revalidate = 0;

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();
  const { searchParams } = new URL(request.url);
  const monthKey = searchParams.get("monthKey");

  if (!householdId) {
    return NextResponse.json(getDemoTransactions(monthKey));
  }

  let query = supabase
    .from("transactions")
    .select("*")
    .eq("household_id", householdId)
    .order("date", { ascending: false });

  if (monthKey) {
    const startDate = new Date(`${monthKey}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    query = query
      .gte("date", formatDate(startDate))
      .lt("date", formatDate(endDate));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? [], {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const payload = (await request.json()) as Pick<
    TablesInsert<'transactions'>,
    "date" | "category" | "monto" | "persona" | "tipo" | "nota" | "metodo"
  >;

  if (!householdId) {
    const demoTransaction = addDemoTransaction({
      ...payload,
      metodo: payload.metodo ?? null,
      nota: payload.nota ?? null,
    });
    return NextResponse.json(demoTransaction, { status: 201 });
  }

  const insertPayload: TablesInsert<'transactions'> = {
    ...payload,
    household_id: householdId,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert([insertPayload])
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
