"use client";

import { addMonths, format } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useDashboardStore } from "@/store/dashboard-store";
import { formatMonthKey } from "@/lib/utils/date";

export function MonthSelector() {
    const { monthKey, setMonthKey } = useDashboardStore();

    const handleShiftMonth = (step: number) => {
        const baseDate = new Date(`${monthKey}-15T12:00:00.000Z`);
        const nextDate = addMonths(baseDate, step);
        setMonthKey(format(nextDate, "yyyy-MM"));
    };

    return (
        <div className="flex items-center gap-2 rounded-[28px] border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-foreground shadow-inner backdrop-blur">
            <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => handleShiftMonth(-1)}
                className="rounded-2xl border border-transparent p-2 text-muted-foreground transition hover:border-white/30 hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
            </button>
            <span className="px-2 text-base">{formatMonthKey(monthKey)}</span>
            <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => handleShiftMonth(1)}
                className="rounded-2xl border border-transparent p-2 text-muted-foreground transition hover:border-white/30 hover:text-foreground"
            >
                <ArrowRight className="size-4" />
            </button>
        </div>
    );
}
