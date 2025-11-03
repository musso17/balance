"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";

import { useDashboardStore } from "@/store/dashboard-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrency } from "@/lib/utils/number";
import { formatDate, formatMonthKey } from "@/lib/utils/date";
import type { Transaction } from "@/types/database";

const formatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

export function DashboardView() {
  const { monthKey, setMonthKey, showDebtImpact, toggleDebtImpact } =
    useDashboardStore();
  const { data, isLoading, isError, error } = useDashboardData(monthKey);

  const chartData = useMemo(() => {
    if (!data) return [];

    return data.categories.map((category) => ({
      name: category.category,
      Gastos: category.expense,
      Presupuesto: category.budget ?? 0,
    }));
  }, [data]);

  const transactions = (data?.transactions ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {formatMonthKey(monthKey)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Resumen financiero del hogar en el mes seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">
            Mes
          </label>
          <input
            type="month"
            value={monthKey}
            onChange={(event) => setMonthKey(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </div>
      </header>

      {isLoading && (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando datos del mes...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error instanceof Error
            ? error.message
            : "No pudimos cargar el dashboard"}
        </div>
      )}

      {data && !isLoading && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Ingresos"
              value={formatCurrency(data.totals.incomes)}
              hint="Total de ingresos confirmados"
            />
            <MetricCard
              title="Gastos"
              value={formatCurrency(data.totals.expenses)}
              hint="Gasto acumulado del mes"
            />
            <MetricCard
              title="Balance"
              value={formatCurrency(data.totals.balance)}
              hint="Ingresos menos gastos"
              tone={data.totals.balance >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              title="Ahorro promedio"
              value={`${Math.round(data.totals.savingsProgress * 100)}%`}
              hint="Progreso sobre metas de ahorro"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-4 rounded-2xl border border-border/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Gastos por categoría
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Compara cada categoría con su presupuesto planificado.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showDebtImpact}
                    onChange={toggleDebtImpact}
                    className="size-4 rounded border-border text-foreground focus:ring-foreground/30"
                  />
                  Incluir impacto de deudas
                </label>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value: number) => formatter.format(value)}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Legend />
                    <Bar dataKey="Gastos" fill="#111827" radius={[8, 8, 0, 0]} />
                    <Bar
                      dataKey="Presupuesto"
                      fill="#d1d5db"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/70 p-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Impacto de deudas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pagos mensuales que afectan el flujo de caja.
                </p>
              </div>
              <div className="space-y-3">
                {data.debts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin deudas registradas por ahora.
                  </p>
                )}
                {data.debts.map((debt) => (
                  <article
                    key={debt.id}
                    className="flex items-start justify-between rounded-xl border border-border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {debt.entity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo {formatCurrency(debt.balance)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(debt.monthly_payment)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Presupuesto vs Real
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Seguimiento de cada categoría del mes.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {data.categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Empieza creando transacciones y presupuestos para ver tus
                    avances.
                  </p>
                )}
                {data.categories.map((category) => {
                  const budget = category.budget ?? 0;
                  const progress =
                    budget > 0 ? Math.min(category.expense / budget, 1) : 0;

                  return (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-medium text-foreground">
                        <span>{category.category}</span>
                        <span>
                          {formatCurrency(category.expense)}{" "}
                          <span className="text-xs text-muted-foreground">
                            / {formatCurrency(budget)}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground transition-all"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 p-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Últimas transacciones
                </h3>
                <p className="text-xs text-muted-foreground">
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
  tone = "default",
}: {
  title: string;
  value: string;
  hint: string;
  tone?: "default" | "positive" | "negative";
}) {
  const toneStyles =
    tone === "positive"
      ? "bg-emerald-500/10 text-emerald-700"
      : tone === "negative"
        ? "bg-rose-500/10 text-rose-600"
        : "text-foreground";

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-white/80 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className={`text-xl font-semibold ${toneStyles}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function TransactionItem({ data }: { data: Transaction }) {
  return (
    <article className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          {data.category} · {data.persona}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(data.date)} · {data.metodo}
        </p>
        {data.nota && (
          <p className="mt-1 text-xs text-muted-foreground/80">
            {data.nota}
          </p>
        )}
      </div>
      <div
        className={
          data.tipo === "ingreso"
            ? "text-sm font-semibold text-emerald-600"
            : "text-sm font-semibold text-foreground"
        }
      >
        {formatCurrency(data.monto)}
      </div>
    </article>
  );
}

