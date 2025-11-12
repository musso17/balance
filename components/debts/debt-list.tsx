"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  useDebts,
  useDeleteDebt,
  useUpdateDebt,
} from "@/hooks/use-debts";
import { formatCurrency } from "@/lib/utils/number";
import type { Tables } from "@/lib/database.types";

import { debtSchema, type DebtFormValues } from "./schema";

const statusLabels: Record<string, string> = {
  activa: "Activa",
  pagada: "Pagada",
  morosa: "Morosa",
};

export function DebtList() {
  const { data, isLoading, isError, error } = useDebts();

  return (
    <div className="glass-panel space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Compromisos vigentes
        </h3>
        <p className="text-sm text-muted-foreground">
          Controla el saldo pendiente y los pagos pactados.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm text-muted-foreground backdrop-blur-2xl">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando deudas...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error instanceof Error ? error.message : "Error al cargar las deudas"}
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur-2xl">
          Sin deudas registradas. Añade compromisos para planificar mejor.
        </p>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((debt) => (
            <DebtRowItem key={debt.id} debt={debt} />
          ))}
        </div>
      )}
    </div>
  );
}

function DebtRowItem({ debt }: { debt: Tables<'debts'> }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateDebt();
  const deleteMutation = useDeleteDebt();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema) as unknown as Resolver<DebtFormValues>,
    defaultValues: {
      entity: debt.entity,
      balance: debt.balance,
      monthly_payment: debt.monthly_payment,
      interest_rate: debt.interest_rate ?? undefined,
      status: debt.status,
    },
  });

  useEffect(() => {
    reset({
      entity: debt.entity,
      balance: debt.balance,
      monthly_payment: debt.monthly_payment,
      interest_rate: debt.interest_rate ?? undefined,
      status: debt.status,
    });
  }, [debt.balance, debt.entity, debt.monthly_payment, debt.interest_rate, debt.status, reset]);

  const onSubmit = async (values: DebtFormValues) => {
    try {
      await updateMutation.mutateAsync({ id: debt.id, ...values });
      toast.success("Deuda actualizada");
      setIsEditing(false);
    } catch (error) {
      console.error("[debts] update", error);
      toast.error("No pudimos actualizar la deuda");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar esta deuda?",
    );
    if (!confirmDelete) return;

    try {
      await deleteMutation.mutateAsync(debt.id);
      toast.success("Deuda eliminada");
    } catch (error) {
      console.error("[debts] delete", error);
      toast.error("No pudimos eliminar la deuda");
    }
  };

  const statusClass =
    debt.status === "pagada"
      ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
      : debt.status === "morosa"
        ? "border border-rose-400/40 bg-rose-500/15 text-rose-100"
        : "border border-amber-300/40 bg-amber-400/15 text-amber-100";

  return (
    <article className="subdued-card space-y-4 p-4 md:p-5">
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-2"
        >
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Entidad</span>
            <input
              type="text"
              {...register("entity")}
              className="soft-input"
            />
            {errors.entity && (
              <span className="text-xs text-rose-500">
                {errors.entity.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Saldo</span>
            <input
              type="number"
              step="0.01"
              {...register("balance")}
              className="soft-input"
            />
            {errors.balance && (
              <span className="text-xs text-rose-500">
                {errors.balance.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Pago mensual</span>
            <input
              type="number"
              step="0.01"
              {...register("monthly_payment")}
              className="soft-input"
            />
            {errors.monthly_payment && (
              <span className="text-xs text-rose-500">
                {errors.monthly_payment.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Interés (%)</span>
            <input
              type="number"
              step="0.01"
              {...register("interest_rate")}
              className="soft-input"
            />
            {errors.interest_rate && (
              <span className="text-xs text-rose-500">
                {errors.interest_rate.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Estado</span>
            <select
              {...register("status")}
              className="soft-input"
            >
              <option value="activa">Activa</option>
              <option value="pagada">Pagada</option>
              <option value="morosa">Morosa</option>
            </select>
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
                reset({
                  entity: debt.entity,
                  balance: debt.balance,
                  monthly_payment: debt.monthly_payment,
                  interest_rate: debt.interest_rate ?? undefined,
                  status: debt.status,
                });
                setIsEditing(false);
              }}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition hover:text-foreground"
            >
              <X className="size-3" /> Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {debt.entity}
            </p>
            <p className="text-xs text-muted-foreground">
              Saldo: {formatCurrency(debt.balance)}
            </p>
            {typeof debt.interest_rate === "number" && (
              <p className="text-xs text-muted-foreground">
                Interés: {debt.interest_rate}%
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm md:justify-end">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pago mensual
              </p>
              <p className="font-semibold text-foreground">
                {formatCurrency(debt.monthly_payment)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass}`}>
              {statusLabels[debt.status] ?? debt.status}
            </span>
            <div className="flex items-center gap-2">
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
        </div>
      )}
    </article>
  );
}
