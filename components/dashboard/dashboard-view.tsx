"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addMonths, format, subDays } from "date-fns";
import {
  CircleDollarSign,
  Plus,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Coins,
  Wallet2,
  PiggyBank,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { useDashboardStore } from "@/store/dashboard-store";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { formatCurrencyNoDecimals } from "@/lib/utils/number";
import { formatDate, formatMonthKey } from "@/lib/utils/date";
import type { Tables } from "@/lib/database.types";
import { cn } from "@/lib/utils/style";

const RANGE_FILTERS = [
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "Últimos 3 meses", value: "quarter" },
] as const;

type RangeFilter = (typeof RANGE_FILTERS)[number]["value"];

export function DashboardView() {
  const { monthKey, setMonthKey } = useDashboardStore();
  const { data, isLoading, isError, error } = useDashboardData(monthKey);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("month");

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
      .slice(0, 5);
  }, [data]);

  const summaryTotals = useMemo(() => {
    if (!data) return null;

    if (rangeFilter === "month") {
      return {
        incomes: data.totals.incomes,
        expenses: data.totals.expenses,
        balance: data.totals.balance,
        savingsRate: data.totals.savingsRate,
      };
    }

    if (rangeFilter === "week") {
      const latestTimestamp = data.transactions.reduce((acc, tx) => {
        const ts = new Date(tx.date).getTime();
        return Math.max(acc, ts);
      }, 0);
      const referenceDate = latestTimestamp
        ? new Date(latestTimestamp)
        : new Date(`${monthKey}-01T00:00:00.000Z`);
      const weekStart = subDays(referenceDate, 6);
      const weeklyTransactions = data.transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= weekStart && txDate <= referenceDate;
      });
      const weeklySummary = summarizeTransactions(weeklyTransactions);
      return {
        ...weeklySummary,
        savingsRate:
          weeklySummary.incomes > 0
            ? weeklySummary.balance / weeklySummary.incomes
            : 0,
      };
    }

    // quarter
    const lastThree = (data.history ?? []).slice(-3);
    if (lastThree.length === 0) {
      return {
        incomes: data.totals.incomes,
        expenses: data.totals.expenses,
        balance: data.totals.balance,
        savingsRate: data.totals.savingsRate,
      };
    }
    const incomes = lastThree.reduce((acc, entry) => acc + entry.incomes, 0);
    const expenses = lastThree.reduce((acc, entry) => acc + entry.expenses, 0);
    const balance = incomes - expenses;
    return {
      incomes,
      expenses,
      balance,
      savingsRate: incomes > 0 ? balance / incomes : 0,
    };
  }, [data, rangeFilter, monthKey]);

  const filterLabel =
    RANGE_FILTERS.find((option) => option.value === rangeFilter)?.label ?? "";

  const trendData = useMemo(() => {
    if (!data?.history) return [];
    const dataset =
      rangeFilter === "quarter" && data.history.length > 3
        ? data.history.slice(-3)
        : data.history;
    return dataset.map((item) => ({
      month: item.label,
      ingresos: Math.round(item.incomes),
      gastos: Math.round(item.expenses),
    }));
  }, [data, rangeFilter]);

  const budgetAlerts = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories
      .filter((category) => (category.budget ?? 0) > 0)
      .map((category) => {
        const planned = category.budget ?? 0;
        const usage = planned > 0 ? category.expense / planned : 0;
        return {
          name: category.category,
          usage,
        };
      })
      .filter((item) => item.usage >= 0.8)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 3);
  }, [data]);

  const handleShiftMonth = (step: number) => {
    const baseDate = new Date(`${monthKey}-01T00:00:00.000Z`);
    const nextDate = addMonths(baseDate, step);
    setMonthKey(format(nextDate, "yyyy-MM"));
  };

  const metricConfigs = useMemo(() => {
    if (!data || !summaryTotals) return [];
    const comparisonEnabled = rangeFilter === "month";
    const previousLabel = data.comparisons.previousMonthLabel;
    const comparisonText = (delta: number | null) =>
      comparisonEnabled
        ? formatDeltaLabel(delta, previousLabel)
        : `Basado en ${filterLabel.toLowerCase()}`;
    const savingsRatePercent = Math.round((summaryTotals.savingsRate ?? 0) * 100);

    return [
      {
        key: "incomes",
        title: "Ingresos",
        value: formatCurrencyNoDecimals(summaryTotals.incomes),
        hint: comparisonText(data.comparisons.incomesDelta),
        icon: Coins,
        tone: "positive" as const,
      },
      {
        key: "expenses",
        title: "Gastos",
        value: formatCurrencyNoDecimals(summaryTotals.expenses),
        hint: comparisonText(data.comparisons.expensesDelta),
        icon: Wallet2,
        tone: "negative" as const,
      },
      {
        key: "balance",
        title: "Disponible este mes",
        value: formatCurrencyNoDecimals(summaryTotals.balance),
        hint: comparisonText(data.comparisons.balanceDelta),
        subcopy: `Tasa de ahorro: ${Math.max(0, savingsRatePercent)}%`,
        icon: CircleDollarSign,
        tone: "info" as const,
        highlight: true,
      },
      {
        key: "savings",
        title: "Ahorro promedio",
        value: `${Math.round((data.totals.savingsProgress ?? 0) * 100)}%`,
        hint:
          data.savings.length > 0
            ? `Promedio sobre ${data.savings.length} metas activas`
            : "Registra metas para medir tu progreso",
        icon: PiggyBank,
        tone: "default" as const,
      },
    ];
  }, [data, summaryTotals, rangeFilter, filterLabel]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
            <span className="size-2 rounded-full bg-emerald-300" />
            Panel financiero
          </span>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Dashboard
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Analiza tus ingresos, gastos y disponibilidad para tomar decisiones más inteligentes cada mes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 rounded-[26px] border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-foreground shadow-inner backdrop-blur">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => handleShiftMonth(-1)}
              className="rounded-2xl border border-transparent p-2 text-muted-foreground transition hover:border-white/20 hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <span className="px-2 text-base">{formatMonthKey(monthKey)}</span>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => handleShiftMonth(1)}
              className="rounded-2xl border border-transparent p-2 text-muted-foreground transition hover:border-white/20 hover:text-foreground"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
          <Link
            href="/transacciones"
            className="cta-button inline-flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <Plus className="size-4" />
            Registrar transacción
          </Link>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={rangeFilter === option.value}
            onClick={() => setRangeFilter(option.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
              rangeFilter === option.value
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading && !data && <DashboardSkeleton />}

      {isError && (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error instanceof Error
            ? error.message
            : "No pudimos cargar el dashboard"}
        </div>
      )}

      {data && !isLoading && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricConfigs.map(({ key, ...card }) => (
              <MetricCard key={key} {...card} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <InsightCard
              title="Proyección fin de mes"
              value={formatCurrencyNoDecimals(
                data.projections?.projectedMonthEndExpense ?? data.totals.expenses,
              )}
              description="Si mantienes el ritmo actual."
            />
            <InsightCard
              title="Gasto diario promedio"
              value={formatCurrencyNoDecimals(
                data.projections?.dailyAverageExpense ?? data.totals.expenses,
              )}
              description="Calculado según los días contabilizados."
            />
            <InsightCard
              title="Alertas de presupuesto"
              value={
                budgetAlerts.length > 0
                  ? `${budgetAlerts.length} categorías`
                  : "Sin alertas"
              }
              description={
                budgetAlerts.length > 0
                  ? `${budgetAlerts[0].name} al ${Math.round(budgetAlerts[0].usage * 100)}%`
                  : "Todas las categorías bajo control."
              }
              tone={budgetAlerts.length > 0 ? "warning" : "success"}
              icon={AlertTriangle}
            />
          </section>

          <section className="glass-panel space-y-4 p-4 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Tendencia de los últimos meses
                </h3>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Ingresos vs gastos acumulados.
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {rangeFilter === "quarter" ? "Últimos 3 meses" : "Últimos 6 meses"}
              </span>
            </div>
            {trendData.length > 1 ? (
              <TrendChart data={trendData} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos suficientes para mostrar la tendencia.
              </p>
            )}
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {item.usage >= 1
                          ? "Presupuesto sobrepasado"
                          : `Disponible: ${formatCurrencyNoDecimals(
                              Math.max(item.planned - item.actual, 0),
                            )}`}
                      </span>
                      {item.usage >= 0.8 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                          <AlertTriangle className="size-3" />
                          {item.usage >= 1 ? "Alerta" : "80% usado"}
                        </span>
                      )}
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
  subcopy,
  className,
  highlight = false,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  tone?: "default" | "positive" | "negative" | "info";
  subcopy?: string;
  className?: string;
  highlight?: boolean;
}) {
  const tones = {
    positive: {
      badge: "bg-emerald-400/15 text-emerald-200",
      value: "text-emerald-100",
    },
    negative: {
      badge: "bg-rose-500/15 text-rose-200",
      value: "text-rose-200",
    },
    default: {
      badge: "bg-primary/10 text-primary",
      value: "text-primary",
    },
    info: {
      badge: "bg-sky-500/10 text-sky-200",
      value: "text-sky-100",
    },
  } as const;

  const toneStyles = tones[tone] ?? tones.default;

  return (
    <div
      className={cn(
        "subdued-card group flex h-full flex-col gap-4 p-6 transition duration-300 ease-out",
        highlight && "border-white/20 bg-gradient-to-br from-sky-500/15 to-white/5",
        className,
      )}
    >
      <span
        className={`inline-flex min-h-8 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs ${toneStyles.badge}`}
      >
        <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
        <span className="truncate">{title}</span>
      </span>
      <p
        className={`text-[20px] font-extrabold leading-tight tracking-tight break-words text-balance ${toneStyles.value} md:text-[26px]`}
      >
        {value}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      {subcopy && (
        <p className="text-xs text-muted-foreground/80">{subcopy}</p>
      )}
    </div>
  );
}

function TransactionItem({ data }: { data: Tables<'transactions'> }) {
  return (
    <article className="subdued-card grid grid-cols-1 gap-2 px-4 py-3 transition hover:shadow-md sm:grid-cols-[120px_1fr_auto] sm:items-center">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {formatDate(data.date)}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground sm:text-base">
          {data.category}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.persona} · {data.metodo ?? "Método no definido"}
        </p>
        {data.nota && (
          <p className="text-xs text-muted-foreground/80">
            {data.nota}
          </p>
        )}
      </div>
      <p
        className={cn(
          "text-right text-sm font-semibold sm:text-base",
          data.tipo === "ingreso" ? "text-emerald-200" : "text-rose-300",
        )}
      >
        {data.tipo === "gasto" ? "-" : "+"} {formatCurrencyNoDecimals(data.monto)}
      </p>
    </article>
  );
}

function InsightCard({
  title,
  value,
  description,
  icon: Icon = CircleDollarSign,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  icon?: React.ElementType;
  tone?: "default" | "warning" | "success";
}) {
  const tones = {
    default: "text-muted-foreground",
    warning: "text-amber-200",
    success: "text-emerald-200",
  } as const;

  return (
    <div className="subdued-card flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={`size-4 ${tones[tone]}`} />
        {title}
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TrendChart({
  data,
}: {
  data: Array<{ month: string; ingresos: number; gastos: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => formatCurrencyNoDecimals(value)}
            contentStyle={{
              backgroundColor: "rgba(12,20,18,0.85)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="rgba(16, 185, 129, 1)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            stroke="rgba(248, 113, 113, 1)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function summarizeTransactions(transactions: Tables<'transactions'>[]) {
  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.tipo === "ingreso") {
        acc.incomes += tx.monto;
      } else if (tx.tipo === "gasto" || tx.tipo === "deuda") {
        acc.expenses += tx.monto;
      }
      return acc;
    },
    { incomes: 0, expenses: 0 },
  );
  return {
    incomes: summary.incomes,
    expenses: summary.expenses,
    balance: summary.incomes - summary.expenses,
  };
}

function formatDeltaLabel(delta: number | null, previousLabel: string) {
  if (delta === null) {
    return `Sin referencias vs ${previousLabel}`;
  }
  const percent = Math.abs(delta) * 100;
  const arrow = delta >= 0 ? "↑" : "↓";
  return `${arrow} ${percent.toFixed(1)}% vs ${previousLabel}`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`metric-skel-${index}`} className="subdued-card h-36 skeleton rounded-[22px]" />
        ))}
      </div>
      <div className="glass-panel space-y-4 p-4 sm:p-6">
        <div className="h-6 w-40 skeleton rounded-full" />
        <div className="h-48 skeleton rounded-[22px]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="subdued-card h-64 skeleton" />
        <div className="subdued-card h-64 skeleton" />
      </div>
    </div>
  );
}
