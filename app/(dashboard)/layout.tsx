import type { ReactNode } from "react";

import { DashboardNav } from "@/components/navigation/dashboard-nav";
import { getHouseholdSummary } from "@/lib/supabase/household";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const household = await getHouseholdSummary();

  const today = format(new Date(), "d MMMM yyyy", { locale: es });

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-10 md:px-8">
        <aside className="hidden min-w-[220px] rounded-3xl border border-border bg-white/80 p-6 shadow-sm backdrop-blur md:flex md:flex-col md:justify-between">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Balance Compartido
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                {household?.name ?? "Tu hogar"}
              </h1>
            </div>
            <DashboardNav />
          </div>
          <div className="rounded-2xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
            <p className="mt-1 font-medium text-foreground">{today}</p>
          </div>
        </aside>
        <main className="flex-1 space-y-6 pb-12">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Balance Compartido
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                {household?.name ?? "Tu hogar"}
              </h1>
            </div>
          </div>
          <div className="md:hidden">
            <DashboardNav />
          </div>
          <div className="min-h-[70vh] rounded-3xl border border-border bg-white/90 p-6 shadow-sm backdrop-blur">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
