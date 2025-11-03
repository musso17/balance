import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or anon key.");
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      get: async (name: string) => {
        const cookieStore = await cookies();
        return cookieStore.get(name)?.value;
      },
      set: async (name: string, value: string, options: CookieOptions) => {
        try {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove: async (name: string, options: CookieOptions) => {
        try {
          const cookieStore = await cookies();
          const { expires: _, ...cookieOptions } = options ?? {};
          cookieStore.delete?.({ name, ...cookieOptions });
          // Also try setting the cookie with an empty value as a fallback
          // for older browser versions.
          cookieStore.set?.({ name, value: "", ...options });
        } catch (error) {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  });
}

export function createSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase URL or service role key for service role client.",
    );
  }
  return createClient<Database>(url, key);
}