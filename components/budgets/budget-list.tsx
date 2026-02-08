"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboard-store";
import {
  useBudgetTemplates,
  useCreateBudgetTemplate,
  useDeleteBudgetTemplate,
  useUpdateBudgetTemplate,
} from "@/hooks/use-budget-templates";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrencyNoDecimals } from "@/lib/utils/number";

import { budgetTemplateSchema, type BudgetTemplateFormValues } from "./schema";
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
    data: templates,
    isLoading: isLoadingTemplates,
    isError: templatesError,
    error: templateErrorInstance,
  } = useBudgetTemplates();

  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactions(monthKey);

  const [showAddForm, setShowAddForm] = useState(false);

  const rows = useMemo<BudgetRow[]>(() => {
    if (!templates) return [];

    const normalizedTemplates = templates.map((t) => ({
      ...t,
      normalizedCategory: t.category.toLowerCase(),
    }));

    // Only show categories that have a template
    return normalizedTemplates.map((template) => {
      const normalized = template.normalizedCategory;

      const actual = (transactions ?? [])
        .filter(
          (transaction) =>
            transaction.tipo === "gasto" &&
            transaction.category.toLowerCase() === normalized,
        )
        .reduce((acc, curr) => acc + curr.monto, 0);

      const planned = template.amount ?? 0;
      const variance = planned - actual;

      return {
        id: template.id,
        category: template.category,
        planned,
        actual,
        variance,
        hasBudget: true,
      };
    });
  }, [templates, transactions]);

  const isLoading = isLoadingTemplates || isLoadingTransactions;
  const hasAnyBudgetAssigned = rows.length > 0;

  return (
    <div className="glass-panel space-y-6 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            Presupuestos globales
          </h3>
          <p className="text-sm text-muted-foreground">
            Estos límites aplican a todos los meses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/10"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </header>

      {showAddForm && (
        <AddBudgetForm onClose={() => setShowAddForm(false)} existingCategories={rows.map(r => r.category.toLowerCase())} />
      )}

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm text-muted-foreground backdrop-blur-2xl">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando presupuestos...
          </span>
        </div>
      )}

      {templatesError && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {templateErrorInstance instanceof Error
            ? templateErrorInstance.message
            : "Error al cargar los presupuestos"}
        </div>
      )}

      {!isLoading && !hasAnyBudgetAssigned && !showAddForm && (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur-2xl">
          Aún no has definido presupuestos. Haz clic en &quot;Agregar&quot; para crear uno.
        </p>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <BudgetRowItem
              key={row.id ?? `category-${row.category}`}
              row={row}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddBudgetForm({ onClose, existingCategories }: { onClose: () => void; existingCategories: string[] }) {
  const createMutation = useCreateBudgetTemplate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetTemplateFormValues>({
    resolver: zodResolver(budgetTemplateSchema) as unknown as Resolver<BudgetTemplateFormValues>,
    defaultValues: {
      category: "",
      amount: undefined,
    },
  });

  const availableCategories = categoryOptions.filter(
    (cat) => !existingCategories.includes(cat.toLowerCase())
  );

  const onSubmit = async (values: BudgetTemplateFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Presupuesto creado");
      onClose();
    } catch (error) {
      console.error("[budget-templates] create", error);
      toast.error("No pudimos crear el presupuesto");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="subdued-card space-y-4 p-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Categoría</span>
          <select {...register("category")} className="soft-input">
            <option value="">Selecciona una categoría</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="text-xs text-rose-500">{errors.category.message}</span>
          )}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">Monto mensual</span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className="soft-input"
          />
          {errors.amount && (
            <span className="text-xs text-rose-500">{errors.amount.message}</span>
          )}
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="cta-button px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed"
        >
          {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
        >
          <X className="size-3" /> Cancelar
        </button>
      </div>
    </form>
  );
}

function BudgetRowItem({ row }: { row: BudgetRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateBudgetTemplate();
  const deleteMutation = useDeleteBudgetTemplate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetTemplateFormValues>({
    resolver: zodResolver(budgetTemplateSchema) as unknown as Resolver<BudgetTemplateFormValues>,
    defaultValues: {
      category: row.category,
      amount: row.planned,
    },
  });

  useEffect(() => {
    reset({ category: row.category, amount: row.planned });
  }, [reset, row.category, row.planned]);

  const onSubmit = async (values: BudgetTemplateFormValues) => {
    if (!row.id) return;
    try {
      await updateMutation.mutateAsync({
        id: row.id,
        amount: values.amount,
      });
      toast.success("Presupuesto actualizado");
      setIsEditing(false);
    } catch (error) {
      console.error("[budget-templates] update", error);
      toast.error("No pudimos actualizar el presupuesto");
    }
  };

  const handleDelete = async () => {
    if (!row.id) return;
    const confirmDelete = window.confirm(
      "¿Deseas eliminar este presupuesto? Esto afectará a todos los meses.",
    );
    if (!confirmDelete) return;

    try {
      await deleteMutation.mutateAsync(row.id);
      toast.success("Presupuesto eliminado");
    } catch (error) {
      console.error("[budget-templates] delete", error);
      toast.error("No pudimos eliminar el presupuesto");
    }
  };

  const hasPlan = row.planned > 0;
  const utilization = hasPlan ? row.actual / row.planned : 0;
  const progressPercent = hasPlan ? Math.min(utilization, 1) * 100 : 0;
  const usagePercentage = hasPlan
    ? Math.round(Math.min(utilization, 1) * 100)
    : row.actual > 0
      ? 100
      : 0;

  return (
    <article
      className="subdued-card space-y-4 p-4 md:p-5"
      data-highlight={row.planned > 0 && row.actual > row.planned ? "true" : undefined}
    >
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
              readOnly
              aria-readonly
              className="soft-input"
              style={{ opacity: 0.75 }}
            />
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
              disabled={updateMutation.isPending}
              className="cta-button px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed"
            >
              {updateMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                reset({ category: row.category, amount: row.planned });
                setIsEditing(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
            >
              <X className="size-3" /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">
                {row.category}
              </p>
              <p className="text-xs text-muted-foreground">
                Consumo del mes actual
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrencyNoDecimals(row.actual)}
              <span className="ml-1 text-xs text-muted-foreground">
                / {formatCurrencyNoDecimals(row.planned)}
              </span>
            </p>
          </div>
          <div className="budget-progress-track">
            <div
              className="budget-progress-fill"
              style={{
                width: `${Math.min(usagePercentage, 100)}%`,
                background: getBudgetBarColor(usagePercentage),
              }}
            />
            <span className="budget-progress-label">
              {`${Math.max(usagePercentage, 0)}%`}
            </span>
          </div>
          <BudgetStatus
            actual={row.actual}
            planned={row.planned}
            usagePercent={usagePercentage}
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-muted-foreground shadow-sm transition hover:text-primary"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-muted-foreground shadow-sm transition hover:text-rose-400 disabled:cursor-not-allowed"
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
  const isOverBudget = planned > 0 && actual > planned;
  const isExhausted = !isOverBudget && planned > 0 && actual >= planned;
  const showWarning = usagePercent >= 80 || isOverBudget;
  const overPercent = Math.max(
    planned > 0 ? Math.round((actual / planned) * 100 - 100) : 0,
    0,
  );

  const statusLabel = isOverBudget
    ? `Exceso: ${formatCurrencyNoDecimals(actual - planned)}`
    : isExhausted
      ? "Presupuesto agotado"
      : planned > 0
        ? `Disponible: ${formatCurrencyNoDecimals(available)}`
        : "Sin presupuesto asignado";

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
