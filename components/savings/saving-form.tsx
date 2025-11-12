"use client";

import { ReactNode } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useCreateSaving } from "@/hooks/use-savings";
import { formatCurrency } from "@/lib/utils/number";

import { savingSchema, type SavingFormValues } from "./schema";

export function SavingForm() {
  const mutation = useCreateSaving();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SavingFormValues>({
    resolver:
      zodResolver(savingSchema) as unknown as Resolver<SavingFormValues>,
    defaultValues: {
      current_amount: 0,
    },
  });

  const target = useWatch({ control, name: "target_amount" }) ?? 0;
  const current = useWatch({ control, name: "current_amount" }) ?? 0;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const percent = Math.round(progress * 100);
  const progressColor = percent >= 100 ? "bg-emerald-500" : "bg-primary";

  const onSubmit = async (values: SavingFormValues) => {
    try {
      await mutation.mutateAsync({
        ...values,
        deadline: values.deadline ? values.deadline : null,
      });
      toast.success("Meta de ahorro guardada.");
      reset({ goal_name: "", target_amount: undefined, current_amount: 0, deadline: undefined });
    } catch (error) {
      console.error("[savings] create", error);
      toast.error("No pudimos guardar la meta de ahorro.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-panel space-y-6 p-4 sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Meta" error={errors.goal_name?.message}>
          <input
            type="text"
            placeholder="Fondo de emergencia, viaje, etc."
            {...register("goal_name")}
            className="soft-input"
          />
        </Field>
        <Field label="Fecha objetivo" error={errors.deadline?.message}>
          <input
            type="date"
            {...register("deadline")}
            className="soft-input"
          />
        </Field>
        <Field label="Monto objetivo" error={errors.target_amount?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("target_amount")}
            className="soft-input"
          />
        </Field>
        <Field label="Ahorro actual" error={errors.current_amount?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("current_amount")}
            className="soft-input"
          />
        </Field>
      </div>

      <div className="subdued-card border-dashed px-4 py-4 text-sm text-muted-foreground">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Progreso</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p>
          {formatCurrency(current)} de {formatCurrency(target)}
        </p>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="cta-button w-full disabled:cursor-not-allowed"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar meta
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
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
