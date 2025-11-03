import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { Tables } from "@/types/database";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const payload = (await request.json()) as Tables["transactions"]["Update"];
  const { household_id: _ignoredHousehold, id: _ignoredId, ...rest } = payload;
  const updatePayload = rest as Tables["transactions"]["Update"];

  const { data, error } = await supabase
    .from("transactions")
    .update(updatePayload as never)
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
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
