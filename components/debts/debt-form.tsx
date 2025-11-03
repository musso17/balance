"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useCreateDebt } from "@/hooks/use-debts";
import { formatCurrency } from "@/lib/utils/number";

import { debtSchema, type DebtFormValues } from "./schema";

export function DebtForm() {
  const mutation = useCreateDebt();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema) as unknown as Resolver<DebtFormValues>,
    defaultValues: {
      status: "activa",
    },
  });

  const balance = watch("balance") ?? 0;
  const monthly = watch("monthly_payment") ?? 0;

  const onSubmit = async (values: DebtFormValues) => {
    try {
      await mutation.mutateAsync(values);
      toast.success("Deuda registrada con éxito.");
      reset({ entity: "", balance: undefined, monthly_payment: undefined, status: "activa" });
    } catch (error) {
      console.error("[debts] create", error);
      toast.error("No pudimos registrar la deuda.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border border-border/70 p-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Entidad" error={errors.entity?.message}>
          <input
            type="text"
            placeholder="Banco, tarjeta o prestamista"
            {...register("entity")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <Field label="Saldo actual" error={errors.balance?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("balance")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <Field label="Pago mensual" error={errors.monthly_payment?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("monthly_payment")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
      </div>

      <Field label="Estado" error={errors.status?.message}>
        <select
          {...register("status")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
        >
          <option value="activa">Activa</option>
          <option value="pagada">Pagada</option>
          <option value="morosa">Morosa</option>
        </select>
      </Field>

      <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Estás destinando{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(monthly || 0)}
        </span>{" "}
        al mes para reducir un saldo de{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(balance || 0)}
        </span>
        .
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar deuda
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
