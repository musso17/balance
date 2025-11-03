"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/style";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transacciones", label: "Registro de gasto" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/deudas", label: "Deudas" },
  { href: "/ahorros", label: "Ahorros & Metas" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-xl px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

