import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesUpdate } from "@/lib/database.types";
import { deleteDemoSaving, updateDemoSaving } from "@/lib/mocks/store";


interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  const payload = (await request.json()) as TablesUpdate<'savings'>;
  const { household_id: _householdToIgnore, id: _idToIgnore, ...rest } = payload;
  void _householdToIgnore;
  void _idToIgnore;
  const updatePayload = rest as TablesUpdate<'savings'>;

  if (!householdId) {
    const updated = updateDemoSaving(id, updatePayload);
    if (!updated) {
      return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  const { data, error } = await supabase
    .from("savings")
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
    const removed = deleteDemoSaving(id);
    if (!removed) {
      return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("savings")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
