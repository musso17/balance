"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { DashboardNav } from "@/components/navigation/dashboard-nav";
import { useMediaQuery } from "@/hooks/use-media-query";
// import { getHouseholdSummary } from "@/lib/supabase/household"; // Temporarily removed
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Placeholder for household data
  const household = { name: "Tu hogar" }; // Replace with actual data fetching

  const today = format(new Date(), "d MMMM yyyy", { locale: es });

  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDesktop) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDesktop]);

  const handleSwipeStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleSwipeEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    if (touchStartX - endX > 60) {
      setIsSidebarOpen(false);
    }
    setTouchStartX(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-160px] top-32 h-[320px] w-[320px] rounded-full bg-indigo-500/15 blur-[140px]" />
        <div className="absolute bottom-[-240px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row md:px-8 lg:px-12 xl:px-16">
        {isSidebarOpen && !isDesktop && (
          <button
            type="button"
            aria-label="Ocultar navegación"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm transition-opacity"
          />
        )}
        <aside
          className={`pointer-events-auto fixed inset-y-4 left-3 z-30 flex h-[calc(100vh-2rem)] w-[min(260px,88vw)] flex-col gap-10 rounded-[26px] border border-white/10 bg-white/5 px-4 py-6 shadow-[0_25px_65px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-transform duration-300 ease-in-out md:static md:h-auto md:min-w-[240px] md:w-[260px] md:px-5 md:py-8 ${isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 md:translate-x-0 md:opacity-100"}`}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          <div className="flex items-center justify-between md:block">
            <div>
              <p className="muted-label">Balance Compartido</p>
              <h1 className="text-base font-semibold text-foreground sm:text-lg">
                {household?.name ?? "Tu hogar"}
              </h1>
            </div>
            {!isDesktop && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground shadow-sm transition hover:text-foreground"
                aria-label="Cerrar navegación"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <DashboardNav
            isCollapsed={false}
            onNavigate={() => {
              if (!isDesktop) setIsSidebarOpen(false);
            }}
          />
          <div className="mt-auto text-xs text-muted-foreground">
            <p>{today}</p>
          </div>
        </aside>
        <main className="flex-1 space-y-6 pb-12 md:pl-4">
          <div className="flex items-center justify-between gap-4 md:hidden">
            <div>
              <p className="muted-label">Balance Compartido</p>
              <h1 className="text-base font-semibold text-foreground sm:text-lg">
                {household?.name ?? "Tu hogar"}
              </h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground"
              aria-label="Abrir navegación"
            >
              <Menu className="size-5" />
            </button>
          </div>

          <div className="glass-panel min-h-[70vh] p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
