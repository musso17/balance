import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "./household";
import type { Debt } from "@/types/database";

export async function getActiveDebts(): Promise<Debt[]> {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    throw new Error("No household found for the current user.");
  }

  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "activa");

  if (error) {
    throw error;
  }

  return (data ?? []) as Debt[];
}
