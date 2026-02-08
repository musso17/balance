"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Landmark,
    PiggyBank,
} from "lucide-react";

const TAB_ITEMS = [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/transacciones", label: "Gastos", icon: Receipt },
    { href: "/presupuestos", label: "Budget", icon: Wallet },
    { href: "/deudas", label: "Deudas", icon: Landmark },
    { href: "/ahorros", label: "Ahorro", icon: PiggyBank },
];

export function IOSTabBar() {
    const pathname = usePathname();

    return (
        <nav className="ios-tab-bar">
            {TAB_ITEMS.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`ios-tab-item ${isActive ? "ios-tab-active" : ""}`}
                    >
                        <Icon className="ios-tab-icon" />
                        <span className="ios-tab-label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
