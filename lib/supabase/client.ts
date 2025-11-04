import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

function resolveCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Supabase env vars faltantes. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    return {
      url: "https://placeholder.supabase.co",
      key: "public-anon-key",
    };
  }

  return { url, key };
}

export function createSupabaseBrowserClient() {
  const { url, key } = resolveCredentials();

  return createBrowserClient<Database>(url, key);
}
