"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboard-store";
import { useCreateBudget } from "@/hooks/use-budgets";
import { formatMonthKey } from "@/lib/utils/date";

import { budgetSchema, type BudgetFormValues } from "./schema";
import { categoryOptions } from "../transactions/schema";

export function BudgetForm() {
  const { monthKey } = useDashboardStore();
  const mutation = useCreateBudget();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver:
      zodResolver(budgetSchema) as unknown as Resolver<BudgetFormValues>,
    defaultValues: {
      month_key: monthKey,
    },
  });

  useEffect(() => {
    setValue("month_key", monthKey);
  }, [monthKey, setValue]);

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("Presupuesto guardado correctamente.");
      reset({ month_key: values.month_key, category: "", amount: undefined });
    } catch (error) {
      console.error("[budgets] create", error);
      toast.error("No pudimos guardar el presupuesto.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-panel space-y-6 p-4 sm:p-6"
    >
      <div className="space-y-1">
        <p className="muted-label">
          Asignar presupuesto a {formatMonthKey(monthKey)}
        </p>
        <h3 className="text-base font-semibold text-foreground">
          Planifica el gasto del mes
        </h3>
        <p className="text-sm text-muted-foreground">
          Define cuánto planean gastar en cada categoría.
        </p>
      </div>
      <input type="hidden" value={monthKey} {...register("month_key")} />

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Field label="Categoría" error={errors.category?.message}>
          <select
            {...register("category")}
            className="soft-input"
          >
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monto mensual" error={errors.amount?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className="soft-input"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="cta-button w-full disabled:cursor-not-allowed"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar presupuesto
      </button>

    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
