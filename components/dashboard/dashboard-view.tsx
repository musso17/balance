"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType } from "react";
import { addHours, addMonths, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  CircleDollarSign,
  Plus,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Coins,
  Wallet2,
  PiggyBank,
  Download,
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
import { pdf } from "@react-pdf/renderer";
import { MonthlyReportPDF } from "@/components/reports/monthly-report-pdf";

const RANGE_FILTERS = [
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "Últimos 3 meses", value: "quarter" },
] as const;

type RangeFilter = (typeof RANGE_FILTERS)[number]["value"];

// House savings goal configuration
const HOUSE_GOAL = 200_000; // S/. 200K inicial
const HOUSE_STORAGE_KEY = "house-savings-current";

function getHouseSavingsProgress(): number {
  if (typeof window === "undefined") return 0;
  const saved = localStorage.getItem(HOUSE_STORAGE_KEY);
  const current = Number(saved) || 0;
  return Math.min((current / HOUSE_GOAL) * 100, 100);
}

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
        const usage = planned > 0 ? actual / planned : 0;
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

    const limit = rangeFilter === "quarter" ? 3 : 6;
    const sortedHistory = [...data.history].sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const getDateFromMonthKey = (key: string) => {
      const [year, month] = key.split("-");
      return new Date(Number(year), Number(month) - 1, 1);
    };

    let formatted = sortedHistory.map((item) => ({
      monthKey: item.month,
      label: format(getDateFromMonthKey(item.month), "MMM", { locale: es }),
      ingresos: Math.round(item.incomes),
      gastos: Math.round(item.expenses),
    }));

    const hasCurrentMonth = sortedHistory.some((item) => item.month === monthKey);

    if (!hasCurrentMonth && data.totals) {
      formatted = [
        ...formatted,
        {
          monthKey,
          label: format(getDateFromMonthKey(monthKey), "MMM", { locale: es }),
          ingresos: Math.round(data.totals.incomes),
          gastos: Math.round(data.totals.expenses),
        },
      ];
    }

    const uniqueByMonth = Array.from(
      new Map(formatted.map((item) => [item.monthKey, item])).values(),
    );

    return uniqueByMonth
      .slice(-limit)
      .map(({ label, ingresos, gastos }) => ({ month: label, ingresos, gastos }));
  }, [data, rangeFilter, monthKey]);

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
    // Use the 15th of the month to avoid timezone issues when shifting months
    const baseDate = new Date(`${monthKey}-15T12:00:00.000Z`);
    const nextDate = addMonths(baseDate, step);
    setMonthKey(format(nextDate, "yyyy-MM"));
  };

  const handleDownloadReport = async () => {
    if (!data) return;

    try {
      const blob = await pdf(
        <MonthlyReportPDF data={data} monthKey={monthKey} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte-financiero-${monthKey}.pdf`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error generating PDF:", err);
      // Fallback or alert could go here
    }
  };

  const metricConfigs = useMemo(() => {
    if (!data || !summaryTotals) return [];
    const comparisonEnabled = rangeFilter === "month";
    const previousLabel = data.comparisons.previousMonthLabel;
    const comparisonText = (delta: number | null) =>
      comparisonEnabled
        ? formatDeltaLabel(delta, previousLabel)
        : `Basado en ${filterLabel.toLowerCase()}`;
    const savingsRatePercent = Math.max(0, Math.round((summaryTotals.savingsRate ?? 0) * 100));

    return [
      {
        key: "incomes",
        title: "Ingresos",
        value: summaryTotals.incomes,
        hint: comparisonText(data.comparisons.incomesDelta),
        icon: Coins,
        tone: "positive" as const,
        valueFormatter: formatCurrencyNoDecimals,
        highlight: true,
      },
      {
        key: "expenses",
        title: "Gastos",
        value: summaryTotals.expenses,
        hint: comparisonText(data.comparisons.expensesDelta),
        icon: Wallet2,
        tone: "negative" as const,
        valueFormatter: formatCurrencyNoDecimals,
        highlight: true,
      },
      {
        key: "balance",
        title: "Disponible este mes",
        value: summaryTotals.balance,
        hint: comparisonText(data.comparisons.balanceDelta),
        subcopy: `Tasa de ahorro: ${savingsRatePercent}%`,
        icon: CircleDollarSign,
        tone: "info" as const,
        valueFormatter: formatCurrencyNoDecimals,
        highlight: true,
      },
      {
        key: "savings",
        title: "Meta: Inicial Depa",
        value: getHouseSavingsProgress(),
        hint: "Progreso hacia S/. 200,000",
        icon: PiggyBank,
        tone: "default" as const,
        valueFormatter: (value: number) => `${Math.round(value)}%`,
        highlight: true,
      },
    ];
  }, [data, summaryTotals, rangeFilter, filterLabel]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200">
            <span className="size-2 rounded-full bg-sky-300" />
            Panel financiero
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Dashboard
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground/90">
            Analiza tus ingresos, gastos y disponibilidad para tomar decisiones más inteligentes cada mes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/10"
            title="Descargar reporte del mes"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Reporte</span>
          </button>
          <Link
            href="/transacciones"
            className="cta-button inline-flex items-center justify-center gap-2"
          >
            <Plus className="size-4" />
            Registrar transacción
          </Link>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {RANGE_FILTERS.map((option) => {
          const isActive = rangeFilter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setRangeFilter(option.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] transition",
                isActive
                  ? "border border-[#3B82F6] bg-[#3B82F6]/20 text-[#60A5FA]"
                  : "border border-transparent bg-white/10 text-muted-foreground hover:bg-white/15",
              )}
            >
              {option.label}
            </button>
          );
        })}
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
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metricConfigs.map(({ key, ...card }, index) => (
              <MetricCard key={key} {...card} style={{ animationDelay: `${index * 80}ms` }} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="glass-panel">
              <InsightCard
                title="Proyección fin de mes"
                value={formatCurrencyNoDecimals(
                  data.projections?.projectedMonthEndExpense ?? data.totals.expenses,
                )}
                description="Si mantienes el ritmo actual."
              />
            </div>
            <div className="glass-panel">
              <InsightCard
                title="Gasto diario promedio"
                value={formatCurrencyNoDecimals(
                  data.projections?.dailyAverageExpense ?? data.totals.expenses,
                )}
                description="Calculado según los días contabilizados."
              />
            </div>
            <div className="glass-panel">
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
            </div>
          </section>

          <section className="glass-panel space-y-6">
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
            <div className="glass-panel space-y-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  Últimas transacciones
                </h3>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Los últimos movimientos registrados por la pareja.
                </p>
              </div>
              <div className="space-y-4">
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
            <div className="glass-panel space-y-6">
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
                {budgetPreview.map((item) => {
                  const rawPercent = Math.round(item.usage * 100);
                  const usagePercent = Math.max(rawPercent, 0);
                  return (
                    <div
                      key={item.name}
                      className="glass-panel space-y-3"
                      data-highlight={item.usage > 1 ? "true" : undefined}
                    >
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
                            width: `${Math.min(usagePercent, 100)}%`,
                            background: getBudgetBarColor(usagePercent),
                          }}
                        />
                        <span className="budget-progress-label">
                          {usagePercent > 100 ? `${usagePercent}%` : `${usagePercent}%`}
                        </span>
                      </div>
                      <BudgetStatus
                        actual={item.actual}
                        planned={item.planned}
                        usagePercent={usagePercent}
                      />
                    </div>
                  );
                })}
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
  valueFormatter,
  style,
}: {
  title: string;
  value: number;
  hint: string;
  icon: ElementType;
  tone?: "default" | "positive" | "negative" | "info";
  subcopy?: string;
  className?: string;
  highlight?: boolean;
  valueFormatter?: (value: number) => string;
  style?: CSSProperties;
}) {
  const tones = {
    positive: {
      label: "bg-emerald-500/15 text-emerald-200",
      value: "text-emerald-100",
      icon: "text-emerald-200 border-emerald-300/30",
    },
    negative: {
      label: "bg-rose-500/15 text-rose-200",
      value: "text-rose-200",
      icon: "text-rose-200 border-rose-300/30",
    },
    default: {
      label: "bg-white/10 text-foreground",
      value: "text-foreground",
      icon: "text-white border-white/20",
    },
    info: {
      label: "bg-sky-500/15 text-sky-200",
      value: "text-sky-100",
      icon: "text-sky-100 border-sky-300/30",
    },
  } as const;

  const toneStyles = tones[tone] ?? tones.default;

  return (
    <div
      data-highlight={highlight ? "true" : undefined}
      className={cn(
        "subdued-card animate-card-pop group flex h-full flex-col gap-5 p-8 transition duration-300 ease-out",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-3">
        <span className={cn("icon-ring size-12", toneStyles.icon)}>
          <Icon className="size-6" />
        </span>
        <span
          className={cn(
            "flex-1 rounded-2xl px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em]",
            toneStyles.label,
          )}
        >
          {title}
        </span>
      </div>
      <p
        className={cn(
          "text-[36px] font-bold leading-tight tracking-tight text-balance md:text-[42px]",
          toneStyles.value,
        )}
      >
        <AnimatedNumber value={value} formatter={valueFormatter} />
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground/80">{hint}</p>
      {subcopy && (
        <p className="text-xs text-muted-foreground/70">{subcopy}</p>
      )}
    </div>
  );
}

function BudgetStatus({
  actual,
  planned,
  usagePercent,
}: {
  actual: number;
  planned: number;
  usagePercent: number;
}) {
  const available = Math.max(planned - actual, 0);
  const isOverBudget = actual > planned;
  const isExhausted = !isOverBudget && usagePercent >= 100;
  const showWarning = usagePercent >= 80 || isOverBudget;
  const overPercent = Math.max(Math.round(usagePercent - 100), 0);

  const statusLabel = isOverBudget
    ? `Exceso: ${formatCurrencyNoDecimals(actual - planned)}`
    : isExhausted
      ? "Presupuesto agotado"
      : `Disponible: ${formatCurrencyNoDecimals(available)}`;

  const warningLabel = isOverBudget
    ? `Sobrepasado +${overPercent}%`
    : isExhausted
      ? "Presupuesto agotado"
      : `${usagePercent}% usado`;

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground/90">
      <span>{statusLabel}</span>
      {showWarning && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
          <AlertTriangle className="size-3" />
          {warningLabel}
        </span>
      )}
    </div>
  );
}

function getBudgetBarColor(percent: number) {
  if (percent > 100) return "linear-gradient(90deg, #EF4444 0%, #B91C1C 100%)";
  if (percent >= 100) return "linear-gradient(90deg, #10B981 0%, #059669 100%)";
  return "linear-gradient(90deg, #3B82F6 0%, #0EA5E9 100%)";
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
  icon?: ElementType;
  tone?: "default" | "warning" | "success";
}) {
  const tones = {
    default: "text-muted-foreground",
    warning: "text-amber-200",
    success: "text-emerald-200",
  } as const;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        <span className="icon-ring size-10 text-muted-foreground">
          <Icon className={`size-5 ${tones[tone]}`} />
        </span>
        <span>{title}</span>
      </div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      <p className="text-sm leading-relaxed text-muted-foreground/80">{description}</p>
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
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(248,250,252,0.7)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `S/${(value / 1000).toFixed(0)}k`}
            tick={{ fill: "rgba(248,250,252,0.7)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => formatCurrencyNoDecimals(value)}
            contentStyle={{
              backgroundColor: "rgba(8,12,20,0.92)",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f8fafc",
            }}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 0, fill: "#10B981" }}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            stroke="#EF4444"
            strokeWidth={3}
            dot={{ r: 3, strokeWidth: 0, fill: "#EF4444" }}
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
      <div className="glass-panel space-y-6">
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
function AnimatedNumber({
  value,
  formatter = (val: number) => Math.round(val).toLocaleString("es-PE"),
  duration = 900,
}: {
  value: number;
  formatter?: (value: number) => string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const diff = value - startValue;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + diff * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
}
