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
      className="space-y-4 rounded-2xl border border-border/70 p-6"
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          Asignar presupuesto a {formatMonthKey(monthKey)}
        </p>
        <p className="text-xs text-muted-foreground">
          Define cuánto planean gastar en cada categoría.
        </p>
      </div>
      <input type="hidden" value={monthKey} {...register("month_key")} />

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Field label="Categoría" error={errors.category?.message}>
          <input
            type="text"
            placeholder="Alimentación, Transporte, etc."
            {...register("category")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <Field label="Monto mensual" error={errors.amount?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
