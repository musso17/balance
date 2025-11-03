"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useUpdateTransaction } from "@/hooks/use-transactions";
import type { Transaction } from "@/types/database";

import {
  metodosOptions,
  personasOptions,
  transactionSchema,
  type TransactionFormValues,
} from "./schema";

interface TransactionEditFormProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionEditForm({ transaction, onClose }: TransactionEditFormProps) {
  const mutation = useUpdateTransaction();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver:
      zodResolver(transactionSchema) as unknown as Resolver<TransactionFormValues>,
  });

  useEffect(() => {
    if (transaction) {
      reset({
        date: transaction.date.slice(0, 10),
        category: transaction.category,
        monto: transaction.monto,
        persona: transaction.persona,
        tipo: transaction.tipo,
        metodo: transaction.metodo ?? "",
        nota: transaction.nota ?? "",
      });
    }
  }, [reset, transaction]);

  if (!transaction) return null;

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      await mutation.mutateAsync({
        id: transaction.id,
        ...values,
        metodo: values.metodo ?? null,
        nota: values.nota ?? null,
      });

      toast.success("Transacción actualizada.");
      onClose();
    } catch (error) {
      console.error("[transactions] update", error);
      toast.error("No pudimos actualizar la transacción.");
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Editar transacción
          </h3>
          <p className="text-xs text-muted-foreground">
            Ajusta los datos y guarda los cambios.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha" error={errors.date?.message}>
          <input
            type="date"
            {...register("date")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <Field label="Categoría" error={errors.category?.message}>
          <input
            type="text"
            {...register("category")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <Field label="Monto" error={errors.monto?.message}>
          <input
            type="number"
            step="0.01"
            {...register("monto")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <Field label="Persona" error={errors.persona?.message}>
          <select
            {...register("persona")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            {personasOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo" error={errors.tipo?.message}>
          <select
            {...register("tipo")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </Field>
        <Field label="Método" error={errors.metodo?.message}>
          <select
            {...register("metodo")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            <option value="">Selecciona</option>
            {metodosOptions.map((metodo) => (
              <option key={metodo} value={metodo}>
                {metodo}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nota" error={errors.nota?.message}>
          <textarea
            rows={2}
            {...register("nota")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          />
        </Field>
        <div className="flex items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-muted-foreground underline"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
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

