"use client";

import { useDashboardStore } from "@/store/dashboard-store";
import { formatMonthKey } from "@/lib/utils/date";

export function MonthHeading() {
  const { monthKey } = useDashboardStore();

  return (
    <p className="text-xs uppercase tracking-wide text-muted-foreground">
      Mes {formatMonthKey(monthKey)}
    </p>
  );
}

