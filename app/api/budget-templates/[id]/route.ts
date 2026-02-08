import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { TablesUpdate } from "@/lib/database.types";

// Special month_key value for global budget templates
const GLOBAL_TEMPLATE_KEY = "global";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const supabase = createSupabaseServerClient();
    const householdId = await getHouseholdId();

    const payload = (await request.json()) as TablesUpdate<'budgets'>;

    if (!householdId) {
        return NextResponse.json(
            { error: "No se encontró el hogar" },
            { status: 400 },
        );
    }

    const updatePayload: TablesUpdate<'budgets'> = {};
    if (payload.category !== undefined) updatePayload.category = payload.category;
    if (payload.amount !== undefined) updatePayload.amount = payload.amount;

    const { data, error } = await supabase
        .from("budgets")
        .update(updatePayload)
        .eq("id", id)
        .eq("household_id", householdId)
        .eq("month_key", GLOBAL_TEMPLATE_KEY)
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
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("household_id", householdId)
        .eq("month_key", GLOBAL_TEMPLATE_KEY);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
