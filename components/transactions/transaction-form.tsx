"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useCreateTransaction } from "@/hooks/use-transactions";

import {
  metodosOptions,
  personasOptions,
  transactionSchema,
  type TransactionFormValues,
} from "./schema";

export function TransactionForm() {
  const mutation = useCreateTransaction();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver:
      zodResolver(transactionSchema) as unknown as Resolver<TransactionFormValues>,
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      tipo: "gasto",
      metodo: "Yape",
    },
  });

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      await mutation.mutateAsync({
        ...values,
        metodo: values.metodo ?? null,
        nota: values.nota ?? null,
      });

      toast.success("Transacción registrada con éxito.");
      reset({
        date: values.date,
        category: "",
        monto: undefined,
        persona: values.persona,
        tipo: values.tipo,
        metodo: values.metodo,
        nota: "",
      });
    } catch (error) {
      console.error("[transactions] create", error);
      toast.error("No pudimos registrar la transacción.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border border-border/70 p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha" error={errors.date?.message}>
          <input
            type="date"
            {...register("date")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>

        <Field label="Categoría" error={errors.category?.message}>
          <input
            type="text"
            placeholder="Ej. Supermercado, Renta, Netflix..."
            {...register("category")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>

        <Field label="Monto" error={errors.monto?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("monto")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>

        <Field label="Persona" error={errors.persona?.message}>
          <select
            {...register("persona")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            <option value="">Selecciona</option>
            {personasOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo" error={errors.tipo?.message}>
          <select
            {...register("tipo")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </Field>

        <Field label="Método de pago" error={errors.metodo?.message}>
          <select
            {...register("metodo")}
            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            <option value="">Selecciona</option>
            {metodosOptions.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Nota" error={errors.nota?.message}>
        <textarea
          rows={3}
          placeholder="Contexto, acuerdos o recordatorios"
          {...register("nota")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
        />
      </Field>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Registrar transacción
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

