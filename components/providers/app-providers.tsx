"use client";

import { ReactNode } from "react";

import { QueryProvider } from "./query-provider";
import { SupabaseProvider } from "./supabase-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SupabaseProvider>
      <QueryProvider>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
        <ToastProvider />
      </QueryProvider>
    </SupabaseProvider>
  );
}
