"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboard-store";
import {
  useBudgets,
  useDeleteBudget,
  useUpdateBudget,
} from "@/hooks/use-budgets";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils/number";

import {
  budgetSchema,
  type BudgetFormValues,
} from "./schema";

interface BudgetRow {
  id: string;
  category: string;
  planned: number;
  actual: number;
  variance: number;
}

export function BudgetList() {
  const { monthKey } = useDashboardStore();
  const {
    data: budgets,
    isLoading: isLoadingBudgets,
    isError: budgetsError,
    error: budgetErrorInstance,
  } = useBudgets(monthKey);
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    isError: transactionsError,
    error: transactionsErrorInstance,
  } = useTransactions(monthKey);

  const rows = useMemo<BudgetRow[]>(() => {
    if (!budgets || !transactions) return [];

    return budgets.map((budget) => {
      const actual = transactions
        .filter(
          (transaction) =>
            transaction.tipo === "gasto" &&
            transaction.category.toLowerCase() ===
              budget.category.toLowerCase(),
        )
        .reduce((acc, curr) => acc + curr.monto, 0);

      const variance = budget.amount - actual;

      return {
        id: budget.id,
        category: budget.category,
        planned: budget.amount,
        actual,
        variance,
      };
    });
  }, [budgets, transactions]);

  const isLoading = isLoadingBudgets || isLoadingTransactions;

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 p-6">
      <header>
        <h3 className="text-sm font-semibold text-foreground">
          Resumen del mes
        </h3>
        <p className="text-xs text-muted-foreground">
          Compara lo planeado vs lo ejecutado para ajustar decisiones.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando presupuestos...
          </span>
        </div>
      )}

      {budgetsError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {budgetErrorInstance instanceof Error
            ? budgetErrorInstance.message
            : "Error al cargar los presupuestos"}
        </div>
      )}

      {transactionsError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {transactionsErrorInstance instanceof Error
            ? transactionsErrorInstance.message
            : "Error al calcular el real ejecutado"}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Define categorías con presupuesto para ver su ejecución.
        </p>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row) => (
            <BudgetRowItem key={row.id} row={row} monthKey={monthKey} />
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
  const [isEditing, setIsEditing] = useState(false);
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
      await updateMutation.mutateAsync({
        id: row.id,
        month_key: monthKey,
        category: values.category,
        amount: values.amount,
      });
      toast.success("Presupuesto actualizado");
      setIsEditing(false);
    } catch (error) {
      console.error("[budgets] update", error);
      toast.error("No pudimos actualizar el presupuesto");
    }
  };

  const handleDelete = async () => {
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
    row.variance >= 0 ? "text-xs text-emerald-600" : "text-xs text-rose-600";

  return (
    <article className="rounded-xl border border-border/80 px-4 py-3">
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-[2fr_1fr]"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Categoría</span>
            <input
              type="text"
              {...register("category")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.category && (
              <span className="text-xs text-rose-500">
                {errors.category.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Monto</span>
            <input
              type="number"
              step="0.01"
              {...register("amount")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
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
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {updateMutation.isPending && (
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
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
            >
              <X className="size-3" /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {row.category}
            </p>
            <p className="text-xs text-muted-foreground">
              Presupuesto: {formatCurrency(row.planned)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-foreground">
              Real: {formatCurrency(row.actual)}
            </p>
            <p className={varianceStyle}>
              {varianceLabel} {formatCurrency(Math.abs(row.variance))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed"
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
