"use client";

import { useMemo } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useDashboardStore } from "@/store/dashboard-store";
import { formatCurrency } from "@/lib/utils/number";
import { Loader2 } from "lucide-react";

export function SavingsDistribution() {
  const { monthKey } = useDashboardStore();
  const { data: transactions, isLoading } = useTransactions(monthKey);

  const { income, expenses, balance } = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0, balance: 0 };

    const income = transactions
      .filter((t) => t.tipo === "ingreso")
      .reduce((acc, t) => acc + t.monto, 0);

    const expenses = transactions
      .filter((t) => t.tipo === "gasto")
      .reduce((acc, t) => acc + t.monto, 0);

    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const distribution = useMemo(() => {
    const emergencyFundContribution = 2000;
    let remainingBalance = balance - emergencyFundContribution;

    if (remainingBalance < 0) remainingBalance = 0;

    const otherGoalsCount = 3;
    const otherGoalsContribution = remainingBalance / otherGoalsCount;

    return [
      { name: "Fondo emergencia", amount: emergencyFundContribution },
      { name: "Viaje Londres", amount: otherGoalsContribution },
      { name: "Cumple Ana", amount: otherGoalsContribution },
      { name: "Amortización carro", amount: otherGoalsContribution },
    ];
  }, [balance]);

  if (isLoading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm text-muted-foreground backdrop-blur-2xl">
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Calculando distribución de ahorros...
        </span>
      </div>
    );
  }

  return (
    <div className="glass-panel space-y-6 p-6">
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Distribución de Ahorros del Mes
        </h3>
        <p className="text-sm text-muted-foreground">
          Así se distribuirá el balance de este mes entre tus metas.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="subdued-card space-y-1.5 p-4">
          <p className="muted-label">Ingresos del mes</p>
          <p className="text-2xl font-semibold text-emerald-200">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="subdued-card space-y-1.5 p-4">
          <p className="muted-label">Gastos del mes</p>
          <p className="text-2xl font-semibold text-rose-300">
            {formatCurrency(expenses)}
          </p>
        </div>
        <div className="subdued-card space-y-1.5 p-4 sm:col-span-2 lg:col-span-1">
          <p className="muted-label">Balance disponible</p>
          <p className={`text-2xl font-semibold ${balance >= 0 ? "text-primary" : "text-rose-300"}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>
      <div className="subdued-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">
            Distribución sugerida
          </h4>
          <span className="text-xs text-muted-foreground">
            Basado en tu balance disponible
          </span>
        </div>
        <ul className="space-y-2">
          {distribution.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between text-sm text-foreground"
            >
              <span>{item.name}</span>
              <span className="font-semibold">
                {formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="pt-2 text-center text-xs text-muted-foreground">
        Esta es una simulación. El ahorro se acumulará al finalizar el mes.
      </p>
    </div>
  );
}
