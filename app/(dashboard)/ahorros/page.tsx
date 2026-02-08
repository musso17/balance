"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { useTransactions } from "@/hooks/use-transactions";
import { useDashboardStore } from "@/store/dashboard-store";
import { HouseSavingsTracker } from "@/components/savings/house-savings-tracker";

export default function SavingsPage() {
  const { monthKey } = useDashboardStore();
  const { data: transactions, isLoading } = useTransactions(monthKey);

  const { income, expenses } = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0 };

    const income = transactions
      .filter((t) => t.tipo === "ingreso")
      .reduce((acc, t) => acc + t.monto, 0);

    const expenses = transactions
      .filter((t) => t.tipo === "gasto")
      .reduce((acc, t) => acc + t.monto, 0);

    return { income, expenses };
  }, [transactions]);

  const monthlySavingsRate = Math.max(0, income - expenses);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <HouseSavingsTracker
      monthlySavingsRate={monthlySavingsRate}
    />
  );
}
