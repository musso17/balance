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
    <nav className="space-y-3">
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
              "group relative flex items-center gap-4 rounded-3xl px-5 py-4 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border-l-4 border-l-primary bg-gradient-to-r from-white/15 via-white/5 to-transparent text-foreground shadow-[0_20px_45px_-35px_rgba(16,185,129,0.9)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              isCollapsed && "justify-center px-3 py-3 border-l-0",
            )}
            onClick={onNavigate}
          >
            <span
              className={cn(
                "icon-ring size-10 text-base",
                isActive && "border-primary/50 bg-primary/15 text-primary",
              )}
            >
              <Icon className="size-5" />
            </span>
            {!isCollapsed && <span className="flex-1">{item.label}</span>}
            {isActive && (
              <span
                className="absolute inset-y-2 right-[-6px] w-1 rounded-full bg-primary/80 transition-all duration-300"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
