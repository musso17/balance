import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesUpdate } from "@/lib/database.types";
import { deleteDemoDebt, updateDemoDebt } from "@/lib/mocks/store";
import { isDemoMode } from "@/lib/mocks/config";


interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const payload = (await request.json()) as TablesUpdate<'debts'>;
  const { household_id: _householdToIgnore, id: _idToIgnore, ...rest } = payload;
  void _householdToIgnore;
  void _idToIgnore;
  const updatePayload = rest as TablesUpdate<'debts'>;

  if (!householdId) {
    if (!isDemoMode) {
      return NextResponse.json(
        { error: "No se encontró el hogar" },
        { status: 400 },
      );
    }
    const updated = updateDemoDebt(id, updatePayload);
    if (!updated) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  const { data, error } = await supabase
    .from("debts")
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

  if (!householdId) {
    if (!isDemoMode) {
      return NextResponse.json(
        { error: "No se encontró el hogar" },
        { status: 400 },
      );
    }
    const removed = deleteDemoDebt(id);
    if (!removed) {
      return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
