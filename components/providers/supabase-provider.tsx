"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type SupabaseContextValue = SupabaseClient<Database>;

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createSupabaseBrowserClient());

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const client = useContext(SupabaseContext);

  if (!client) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }

  return client;
}

