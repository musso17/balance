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
import type { Debt } from "@/types/database";

import { debtSchema, type DebtFormValues } from "./schema";

const statusLabels: Record<string, string> = {
  activa: "Activa",
  pagada: "Pagada",
  morosa: "Morosa",
};

export function DebtList() {
  const { data, isLoading, isError, error } = useDebts();

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 p-6">
      <header>
        <h3 className="text-sm font-semibold text-foreground">
          Compromisos vigentes
        </h3>
        <p className="text-xs text-muted-foreground">
          Controla el saldo pendiente y los pagos pactados.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando deudas...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error instanceof Error ? error.message : "Error al cargar las deudas"}
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
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

function DebtRowItem({ debt }: { debt: Debt }) {
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
      status: debt.status,
    },
  });

  useEffect(() => {
    reset({
      entity: debt.entity,
      balance: debt.balance,
      monthly_payment: debt.monthly_payment,
      status: debt.status,
    });
  }, [debt.balance, debt.entity, debt.monthly_payment, debt.status, reset]);

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
      ? "bg-emerald-100 text-emerald-700"
      : debt.status === "morosa"
        ? "bg-rose-100 text-rose-600"
        : "bg-amber-100 text-amber-700";

  return (
    <article className="rounded-xl border border-border/80 p-4">
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Entidad</span>
            <input
              type="text"
              {...register("entity")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.entity && (
              <span className="text-xs text-rose-500">
                {errors.entity.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Saldo</span>
            <input
              type="number"
              step="0.01"
              {...register("balance")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.balance && (
              <span className="text-xs text-rose-500">
                {errors.balance.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Pago mensual</span>
            <input
              type="number"
              step="0.01"
              {...register("monthly_payment")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.monthly_payment && (
              <span className="text-xs text-rose-500">
                {errors.monthly_payment.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Estado</span>
            <select
              {...register("status")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
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
                  entity: debt.entity,
                  balance: debt.balance,
                  monthly_payment: debt.monthly_payment,
                  status: debt.status,
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {debt.entity}
            </p>
            <p className="text-xs text-muted-foreground">
              Saldo: {formatCurrency(debt.balance)}
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pago mensual
              </p>
              <p className="font-semibold text-foreground">
                {formatCurrency(debt.monthly_payment)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
              {statusLabels[debt.status] ?? debt.status}
            </span>
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
        </div>
      )}
    </article>
  );
}
