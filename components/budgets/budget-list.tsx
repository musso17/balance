"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboard-store";
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils/number";

import { budgetSchema, type BudgetFormValues } from "./schema";
import { categoryOptions } from "../transactions/schema";

interface BudgetRow {
  id?: string;
  category: string;
  planned: number;
  actual: number;
  variance: number;
  hasBudget: boolean;
}

export function BudgetList() {
  const { monthKey } = useDashboardStore();
  const {
    data: budgets,
    isLoading: isLoadingBudgets,
    isError: budgetsError,
    error: budgetErrorInstance,
  } = useBudgets(monthKey);

  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactions(monthKey);

  const rows = useMemo<BudgetRow[]>(() => {
    if (!transactions) return [];

    const normalizedBudgets =
      budgets?.map((budget) => ({
        ...budget,
        normalizedCategory: budget.category.toLowerCase(),
      })) ?? [];

    return categoryOptions.map((category) => {
      const normalized = category.toLowerCase();
      const budget = normalizedBudgets.find(
        (item) => item.normalizedCategory === normalized,
      );

      const actual = transactions
        .filter(
          (transaction) =>
            transaction.tipo === "gasto" &&
            transaction.category.toLowerCase() === normalized,
        )
        .reduce((acc, curr) => acc + curr.monto, 0);

      const planned = budget?.amount ?? 0;
      const variance = planned - actual;

      return {
        id: budget?.id,
        category,
        planned,
        actual,
        variance,
        hasBudget: Boolean(budget),
      };
    });
  }, [budgets, transactions]);

  const isLoading = isLoadingBudgets || isLoadingTransactions;
  const hasAnyBudgetAssigned = rows.some((row) => row.hasBudget);

  return (
    <div className="glass-panel space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Resumen del mes
        </h3>
        <p className="text-sm text-muted-foreground">
          Compara lo planeado vs lo ejecutado para ajustar decisiones.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/40 text-sm text-muted-foreground backdrop-blur">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando presupuestos...
          </span>
        </div>
      )}

      {budgetsError && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-100/70 px-4 py-3 text-sm text-rose-600">
          {budgetErrorInstance instanceof Error
            ? budgetErrorInstance.message
            : "Error al cargar los presupuestos"}
        </div>
      )}

      {!isLoading && !hasAnyBudgetAssigned && (
        <p className="rounded-2xl border border-dashed border-white/60 bg-white/40 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
          Define categorías con presupuesto para ver su ejecución.
        </p>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <BudgetRowItem
              key={row.id ?? `category-${row.category}`}
              row={row}
              monthKey={monthKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetRowItem({
  row,
  monthKey,
}: {
  row: BudgetRow;
  monthKey: string;
}) {
  const [isEditing, setIsEditing] = useState(!row.hasBudget);
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema) as unknown as Resolver<BudgetFormValues>,
    defaultValues: {
      month_key: monthKey,
      category: row.category,
      amount: row.planned,
    },
  });

  useEffect(() => {
    reset({ month_key: monthKey, category: row.category, amount: row.planned });
  }, [monthKey, reset, row.category, row.planned]);

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      if (row.hasBudget && row.id) {
        await updateMutation.mutateAsync({
          id: row.id,
          month_key: monthKey,
          category: values.category,
          amount: values.amount,
        });
        toast.success("Presupuesto actualizado");
      } else {
        await createMutation.mutateAsync({
          month_key: monthKey,
          category: values.category,
          amount: values.amount,
        });
        toast.success("Presupuesto asignado");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("[budgets] upsert", error);
      toast.error("No pudimos guardar el presupuesto");
    }
  };

  const handleDelete = async () => {
    if (!row.hasBudget || !row.id) return;
    const confirmDelete = window.confirm(
      "¿Deseas eliminar este presupuesto?",
    );
    if (!confirmDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: row.id, month_key: monthKey });
      toast.success("Presupuesto eliminado");
    } catch (error) {
      console.error("[budgets] delete", error);
      toast.error("No pudimos eliminar el presupuesto");
    }
  };

  const varianceLabel = row.variance >= 0 ? "Disponible" : "Excedido";
  const varianceStyle =
    row.variance >= 0 ? "text-emerald-600" : "text-rose-500";
  const hasPlan = row.planned > 0;
  const utilization = hasPlan ? row.actual / row.planned : 0;
  const progressPercent = hasPlan ? Math.min(utilization, 1) * 100 : 0;
  const isOverSpent = hasPlan ? utilization > 1 : row.actual > 0;
  const overflowPercent = isOverSpent
    ? hasPlan
      ? Math.min((utilization - 1) * 100, 100)
      : 100
    : 0;
  const usagePercentage = hasPlan
    ? Math.round(Math.min(utilization, 1) * 100)
    : row.actual > 0
      ? 100
      : 0;
  const barWidth = hasPlan
    ? `${progressPercent}%`
    : row.actual > 0
      ? "100%"
      : "0%";
  const barColor =
    !hasPlan && row.actual > 0
      ? "hsl(var(--danger))"
      : isOverSpent
        ? "hsl(var(--danger))"
        : "hsl(var(--primary))";

  return (
    <article className="subdued-card space-y-4 p-4 md:p-5">
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-2"
        >
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Categoría</span>
            <input
              type="text"
              {...register("category")}
              readOnly={!row.hasBudget}
              aria-readonly={!row.hasBudget}
              className="soft-input"
              style={!row.hasBudget ? { opacity: 0.75 } : undefined}
            />
            {errors.category && (
              <span className="text-xs text-rose-500">
                {errors.category.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Monto</span>
            <input
              type="number"
              step="0.01"
              {...register("amount")}
              className="soft-input"
            />
            {errors.amount && (
              <span className="text-xs text-rose-500">
                {errors.amount.message}
              </span>
            )}
          </label>
          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending || createMutation.isPending}
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {(updateMutation.isPending || createMutation.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                reset({
                  month_key: monthKey,
                  category: row.category,
                  amount: row.planned,
                });
                setIsEditing(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
            >
              <X className="size-3" /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {row.category}
              </p>
              <p className="text-xs text-muted-foreground">
                {row.hasBudget
                  ? `Presupuesto asignado ${formatCurrency(row.planned)}`
                  : "Sin presupuesto asignado"}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="muted-label">Gastado</p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(row.actual)}
              </p>
              <p className={`${varianceStyle} text-xs font-medium`}>
                {varianceLabel} {formatCurrency(Math.abs(row.variance))}
              </p>
            </div>
          </div>
          <div>
            <div className="budget-progress-track">
              <div
                className="budget-progress-fill"
                style={{ width: barWidth, backgroundColor: barColor }}
              />
              {hasPlan && overflowPercent > 0 && (
                <div
                  className="budget-progress-overflow"
                  style={{ width: `${overflowPercent}%` }}
                />
              )}
              <span className="budget-progress-label">
                {hasPlan
                  ? `${usagePercentage}%`
                  : row.actual > 0
                    ? "Sin plan"
                    : "0%"}
              </span>
            </div>
            {isOverSpent && (
              <p className="text-xs font-medium text-rose-500">
                Te excediste {formatCurrency(Math.abs(row.variance))} este mes.
              </p>
            )}
            {!hasPlan && row.actual === 0 && (
              <p className="text-xs text-muted-foreground">
                Aún no asignas un presupuesto a esta categoría.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-2xl border border-white/60 bg-white/70 p-2 text-muted-foreground shadow-sm transition hover:text-primary"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-2xl border border-white/60 bg-white/70 p-2 text-muted-foreground shadow-sm transition hover:text-rose-500 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
