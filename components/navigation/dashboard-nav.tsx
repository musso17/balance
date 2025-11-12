"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/style";
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Landmark,
  PiggyBank,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transacciones", label: "Registro de gasto", icon: ReceiptText },
  { href: "/presupuestos", label: "Presupuestos", icon: Wallet },
  { href: "/deudas", label: "Deudas", icon: Landmark },
  { href: "/ahorros", label: "Ahorros & Metas", icon: PiggyBank },
];

interface DashboardNavProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

export function DashboardNav({ isCollapsed = false, onNavigate }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              isActive
                ? "bg-white/10 text-foreground shadow-[0_15px_40px_-30px_rgba(16,185,129,1)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              isCollapsed && "justify-center px-3",
            )}
            onClick={onNavigate}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg transition",
                isActive && "border-primary/60 bg-primary/15 text-primary",
              )}
            >
              <Icon className="size-5" />
            </span>
            {!isCollapsed && (
              <span className="flex flex-1 items-center justify-between">
                {item.label}
                {isActive && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Ahora
                  </span>
                )}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-y-2 right-[-6px] w-1 rounded-full bg-primary/80" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
