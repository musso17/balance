"use client";

import { useMemo } from "react";
import { Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, CircleDollarSign } from "lucide-react";

import { useDashboardStore } from "@/store/dashboard-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrencyNoDecimals } from "@/lib/utils/number";
import { formatDate, formatMonthKey } from "@/lib/utils/date";
import type { Tables } from "@/lib/database.types";

export function DashboardView() {
  const { monthKey, setMonthKey } = useDashboardStore();
  const { data, isLoading, isError, error } = useDashboardData(monthKey);

  const transactions = (data?.transactions ?? []).slice(0, 5);
  const budgetPreview = useMemo(() => {
    if (!data?.categories) return [];

    return data.categories
      .filter((category) => (category.budget ?? 0) > 0)
      .map((category) => {
        const planned = category.budget ?? 0;
        const actual = category.expense ?? 0;
        const usage = planned > 0 ? Math.min(actual / planned, 1) : 0;
        return {
          name: category.category,
          planned,
          actual,
          usage,
        };
      })
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3);
  }, [data]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg lg:text-xl">
            {formatMonthKey(monthKey)}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Resumen financiero del hogar en el mes seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
            Mes
          </label>
          <input
            type="month"
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </header>

      {isLoading && (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))]">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando datos del mes...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error instanceof Error
            ? error.message
            : "No pudimos cargar el dashboard"}
        </div>
      )}

      {data && !isLoading && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <MetricCard
              title="Ingresos"
              value={formatCurrencyNoDecimals(data.totals.incomes)}
              hint="Total de ingresos confirmados"
              icon={ArrowUpRight}
              tone="positive"
            />
            <MetricCard
              title="Gastos"
              value={formatCurrencyNoDecimals(data.totals.expenses)}
              hint="Gasto acumulado del mes"
              icon={ArrowDownRight}
              tone="negative"
            />
            <MetricCard
              title="Balance"
              value={formatCurrencyNoDecimals(data.totals.balance)}
              hint="Ingresos menos gastos"
              icon={CircleDollarSign}
              tone={data.totals.balance >= 0 ? "default" : "negative"}
            />
            <MetricCard
              title="Ahorro promedio"
              value={`${Math.round(data.totals.savingsProgress * 100)}%`}
              hint="Progreso sobre metas de ahorro"
              icon={TrendingUp}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="glass-panel space-y-4 p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Últimas transacciones
                </h3>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Los últimos movimientos registrados por la pareja.
                </p>
              </div>
              <div className="space-y-3">
                {transactions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aún no hay transacciones en este mes.
                  </p>
                )}
                {transactions.map((transaction) => (
                  <TransactionItem key={transaction.id} data={transaction} />
                ))}
              </div>
            </div>
            <div className="glass-panel space-y-4 p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Presupuestos en tiempo real
                </h3>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Cómo va el consumo de tus presupuestos más activos.
                </p>
              </div>
              <div className="space-y-3">
                {budgetPreview.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aún no registras presupuestos este mes.
                  </p>
                )}
                {budgetPreview.map((item) => (
                  <article key={item.name} className="subdued-card space-y-2 p-3 sm:p-4">
                    <div className="flex flex-col gap-1 text-sm font-medium text-foreground sm:flex-row sm:items-center sm:justify-between">
                      <span>{item.name}</span>
                      <span className="text-sm font-semibold">
                        {formatCurrencyNoDecimals(item.actual)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          / {formatCurrencyNoDecimals(item.planned)}
                        </span>
                      </span>
                    </div>
                    <div className="budget-progress-track">
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${item.usage * 100}%`,
                          backgroundColor:
                            item.usage >= 1 ? "hsl(var(--danger))" : "hsl(var(--primary))",
                        }}
                      />
                      <span className="budget-progress-label">
                        {Math.round(item.usage * 100)}%
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative";
}) {
  const tones = {
    positive: {
      badge: "bg-emerald-500/15 text-emerald-600",
      value: "text-emerald-600",
    },
    negative: {
      badge: "bg-rose-500/15 text-rose-600",
      value: "text-rose-600",
    },
    default: {
      badge: "bg-sky-500/15 text-primary",
      value: "text-primary",
    },
  } as const;

  const toneStyles = tones[tone];

  return (
    <div className="subdued-card space-y-3 p-4 sm:p-5 transition hover:shadow-lg">
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs ${toneStyles.badge}`}>
        <Icon className="size-4" />
        {title}
      </span>
      <p className={`text-2xl font-semibold tracking-tight sm:text-3xl ${toneStyles.value}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p>
    </div>
  );
}

function TransactionItem({ data }: { data: Tables<'transactions'> }) {
  return (
    <article className="subdued-card flex flex-col gap-3 px-4 py-3 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground sm:text-base">
          {data.category}
        </p>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {formatDate(data.date)} · {data.persona} · {data.metodo ?? "—"}
        </p>
        {data.nota && (
          <p className="text-xs text-muted-foreground/80 sm:text-sm">
            {data.nota}
          </p>
        )}
      </div>
      <p
        className={`text-sm font-semibold sm:text-base ${data.tipo === "ingreso" ? "text-emerald-600" : "text-rose-500"}`}
      >
        {data.tipo === "gasto" ? "-" : "+"} {formatCurrencyNoDecimals(data.monto)}
      </p>
    </article>
  );
}
