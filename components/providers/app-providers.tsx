"use client";

import { ReactNode } from "react";

import { QueryProvider } from "./query-provider";
import { SupabaseProvider } from "./supabase-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <QueryProvider>
        {children}
        <ToastProvider />
      </QueryProvider>
    </SupabaseProvider>
  );
}
