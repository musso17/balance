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
    <nav className="space-y-1.5">
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
              "flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-white/50 hover:bg-white/60 hover:text-foreground",
              isCollapsed && "justify-center",
            )}
            onClick={onNavigate}
          >
            <Icon className="size-5" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
