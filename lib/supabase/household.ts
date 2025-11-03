import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "./server";
import { getCurrentUserProfile, getServerSession } from "./auth";
import type { Household } from "@/types/database";

async function createHouseholdForUser(): Promise<string | null> {
  const session = await getServerSession();
  if (!session?.user) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();

  // Check if a profile already exists
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (existingProfileError && existingProfileError.code !== "PGRST116") {
    throw existingProfileError;
  }

  if (existingProfile?.household_id) {
    return existingProfile.household_id;
  }

  // Create a new household
  const householdName =
    session.user.user_metadata?.household?.trim() ||
    session.user.user_metadata?.full_name ||
    session.user.email ||
    "Mi hogar";

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert([{ name: householdName }])
    .select()
    .single();

  if (householdError) throw householdError;

  // Create a new user profile linked to the household
  const profilePayload = {
    auth_user_id: session.user.id,
    household_id: household.id,
    display_name:
      session.user.user_metadata?.full_name || session.user.email || null,
  };

  const { data: newProfile, error: profileError } = await supabase
    .from("user_profiles")
    .insert([profilePayload])
    .select()
    .single();

  if (profileError) throw profileError;

  return newProfile.household_id;
}

export async function getHouseholdId(
  options: { createIfMissing?: boolean } = {},
) {
  const { createIfMissing = true } = options;
  const profile = await getCurrentUserProfile();

  if (profile?.household_id) {
    return profile.household_id;
  }

  if (!createIfMissing) {
    return null;
  }

  return await createHouseholdForUser();
}

export async function getHouseholdSummary(): Promise<Household | null> {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    return null;
  }

  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
