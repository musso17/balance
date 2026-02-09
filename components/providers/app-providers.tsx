"use client";

import { ReactNode } from "react";

import { QueryProvider } from "./query-provider";
import { SupabaseProvider } from "./supabase-provider";
import { ToastProvider } from "./toast-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        <QueryProvider>
          <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8">{children}</div>
          <ToastProvider />
        </QueryProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}
