"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useUpdateTransaction } from "@/hooks/use-transactions";
import type { Tables } from "@/lib/database.types";
import { useMediaQuery } from "@/hooks/use-media-query";

import {
  allCategoryOptions,
  metodosOptions,
  personasOptions,
  transactionSchema,
  type TransactionFormValues,
} from "./schema";

interface TransactionEditFormProps {
  transaction: Tables<'transactions'> | null;
  onClose: () => void;
}

export function TransactionEditForm({ transaction, onClose }: TransactionEditFormProps) {
  const mutation = useUpdateTransaction();
  const isMobile = useMediaQuery("(max-width: 767px)");
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
        category: transaction.category as typeof allCategoryOptions[number],
        monto: transaction.monto,
        persona: transaction.persona,
        tipo: transaction.tipo as "ingreso" | "gasto" | "deuda",
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`glass-panel relative w-full overflow-hidden ${isMobile ? "p-5" : "p-6"}`}
          style={{ maxHeight: "90vh" }}
        >
          <div className="flex items-center justify-between gap-4 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground sm:text-base">
                Editar transacción
              </h3>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Ajusta los datos y guarda los cambios.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/60 bg-white/70 p-2 text-muted-foreground shadow-sm transition hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha" error={errors.date?.message}>
                <input
                  type="date"
                  {...register("date")}
                  className="soft-input"
                />
              </Field>
              <Field label="Categoría" error={errors.category?.message}>
                <input
                  type="text"
                  {...register("category")}
                  className="soft-input"
                />
              </Field>
              <Field label="Monto" error={errors.monto?.message}>
                <input
                  type="number"
                  step="0.01"
                  {...register("monto")}
                  className="soft-input"
                />
              </Field>
              <Field label="Persona" error={errors.persona?.message}>
                <select
                  {...register("persona")}
                  className="soft-input"
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
                  className="soft-input"
                >
                  <option value="gasto">Gasto</option>
                  <option value="ingreso">Ingreso</option>
                </select>
              </Field>
              <Field label="Método" error={errors.metodo?.message}>
                <select
                  {...register("metodo")}
                  className="soft-input"
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
                  rows={isMobile ? 3 : 2}
                  {...register("nota")}
                  className="soft-input"
                />
              </Field>
              <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:items-center md:gap-3">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                >
                  {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
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
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
