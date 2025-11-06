import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesUpdate } from "@/lib/database.types";
import { deleteDemoBudget, updateDemoBudget } from "@/lib/mocks/store";
import { isDemoMode } from "@/lib/mocks/config";


interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const payload = (await request.json()) as TablesUpdate<'budgets'>;
  const { household_id: _ignoredHousehold, id: _ignoredId, ...rest } = payload;
  void _ignoredHousehold;
  void _ignoredId;

  if (isDemoMode && !householdId) {
    const updated = updateDemoBudget(id, rest);
    if (!updated) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const updatePayload = Object.fromEntries(
    Object.entries({
      month_key: rest.month_key,
      category: rest.category,
      amount: rest.amount,
      created_at: rest.created_at ?? undefined,
    }).filter(([, value]) => value !== undefined),
  ) as TablesUpdate<'budgets'>;

  const { data, error } = await supabase
    .from("budgets")
    .update(updatePayload)
    .eq("id", id)
    .eq("household_id", householdId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (isDemoMode && !householdId) {
    const removed = deleteDemoBudget(id);
    if (!removed) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
