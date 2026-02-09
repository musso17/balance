import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesInsert } from "@/lib/database.types";
import { addDemoTransaction, getDemoTransactions } from "@/lib/mocks/store";
import { isDemoMode } from "@/lib/mocks/config";
import { createTransactionSchema, parseTransactionPayload } from "@/lib/validations/transaction";

export const revalidate = 0;

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();
  const { searchParams } = new URL(request.url);
  const monthKey = searchParams.get("monthKey");

  if (isDemoMode && !householdId) {
    return NextResponse.json(getDemoTransactions(monthKey));
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("household_id", householdId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: true });

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

  const rawPayload = await request.json();

  // Validate payload with Zod
  const validation = parseTransactionPayload(createTransactionSchema, rawPayload);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const payload = validation.data;

  if (isDemoMode && !householdId) {
    const demoTransaction = addDemoTransaction({
      ...payload,
      metodo: payload.metodo ?? null,
      nota: payload.nota ?? null,
    });
    return NextResponse.json(demoTransaction, { status: 201 });
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
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
