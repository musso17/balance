"use client";

import type { ReactNode } from "react";

import { IOSTabBar } from "@/components/navigation/ios-tab-bar";
import { ThemeToggle } from "@/components/navigation/theme-toggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="relative min-h-screen">
      {/* Background gradients (Dark Mode Only for cleaner Light Mode) */}
      <div className="pointer-events-none fixed inset-0 hidden dark:block">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-100px] top-20 h-[280px] w-[280px] rounded-full bg-indigo-500/12 blur-[120px]" />
        <div className="absolute bottom-[-200px] left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl" />
      </div>

      {/* Theme Toggle (Fixed Top Right) */}
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <main className="relative z-10 ios-content min-h-screen pb-24">
        {children}
      </main>

      {/* iOS Tab Bar */}
      <IOSTabBar />
    </div>
  );
}
