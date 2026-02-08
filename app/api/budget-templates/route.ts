import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";

// Special month_key value for global budget templates
const GLOBAL_TEMPLATE_KEY = "global";

export async function GET() {
    const supabase = createSupabaseServerClient();
    const householdId = await getHouseholdId();

    if (!householdId) {
        return NextResponse.json(
            { error: "No se encontró el hogar" },
            { status: 400 },
        );
    }

    // First, check if we have any templates (month_key = 'global')
    const { data: templates, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("household_id", householdId)
        .eq("month_key", GLOBAL_TEMPLATE_KEY);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If we have templates, return them
    if (templates && templates.length > 0) {
        return NextResponse.json(templates);
    }

    // No templates exist - migrate from most recent month's budgets
    const { data: existingBudgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("household_id", householdId)
        .neq("month_key", GLOBAL_TEMPLATE_KEY)
        .order("month_key", { ascending: false });

    if (existingBudgets && existingBudgets.length > 0) {
        // Get the most recent month's budgets
        const latestMonthKey = existingBudgets[0].month_key;
        const budgetsToMigrate = existingBudgets.filter(b => b.month_key === latestMonthKey);

        // Create templates from these budgets
        const newTemplates = budgetsToMigrate.map(b => ({
            category: b.category,
            amount: b.amount,
            household_id: householdId,
            month_key: GLOBAL_TEMPLATE_KEY,
        }));

        const { data: createdTemplates, error: insertError } = await supabase
            .from("budgets")
            .insert(newTemplates)
            .select();

        if (!insertError && createdTemplates) {
            return NextResponse.json(createdTemplates);
        }
    }

    return NextResponse.json([]);
}

export async function POST(request: Request) {
    const supabase = createSupabaseServerClient();
    const householdId = await getHouseholdId();

    const payload = (await request.json()) as { category: string; amount: number };

    if (!householdId) {
        return NextResponse.json(
            { error: "No se encontró el hogar" },
            { status: 400 },
        );
    }

    // Check if template already exists for this category
    const { data: existing } = await supabase
        .from("budgets")
        .select("id")
        .eq("household_id", householdId)
        .eq("month_key", GLOBAL_TEMPLATE_KEY)
        .ilike("category", payload.category)
        .single();

    if (existing) {
        return NextResponse.json(
            { error: "Ya existe un presupuesto para esta categoría" },
            { status: 409 },
        );
    }

    const { data, error } = await supabase
        .from("budgets")
        .insert([{
            category: payload.category,
            amount: payload.amount,
            household_id: householdId,
            month_key: GLOBAL_TEMPLATE_KEY,
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
