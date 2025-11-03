"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  useDeleteSaving,
  useSavings,
  useUpdateSaving,
} from "@/hooks/use-savings";
import { formatCurrency } from "@/lib/utils/number";
import { formatDate } from "@/lib/utils/date";

import { savingSchema, type SavingFormValues } from "./schema";
import type { SavingGoal } from "@/types/database";

export function SavingList() {
  const { data, isLoading, isError, error } = useSavings();

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 p-6">
      <header>
        <h3 className="text-sm font-semibold text-foreground">
          Metas activas
        </h3>
        <p className="text-xs text-muted-foreground">
          Controla el avance mensual para cumplir sus objetivos.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando metas de ahorro...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error instanceof Error
            ? error.message
            : "Error al cargar las metas de ahorro"}
        </div>
      )}

      {!isLoading && data && data.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Añadan metas para monitorear su progreso financiero.
        </p>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((goal) => (
            <SavingRowItem key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

function SavingRowItem({ goal }: { goal: SavingGoal }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateSaving();
  const deleteMutation = useDeleteSaving();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavingFormValues>({
    resolver:
      zodResolver(savingSchema) as unknown as Resolver<SavingFormValues>,
    defaultValues: {
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline ?? null,
    },
  });

  useEffect(() => {
    reset({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline ?? null,
    });
  }, [goal, reset]);

  const onSubmit = async (values: SavingFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: goal.id,
        ...values,
        deadline: values.deadline ?? null,
      });
      toast.success("Meta actualizada");
      setIsEditing(false);
    } catch (error) {
      console.error("[savings] update", error);
      toast.error("No pudimos actualizar la meta");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "¿Deseas eliminar esta meta de ahorro?",
    );
    if (!confirmDelete) return;

    try {
      await deleteMutation.mutateAsync(goal.id);
      toast.success("Meta eliminada");
    } catch (error) {
      console.error("[savings] delete", error);
      toast.error("No pudimos eliminar la meta");
    }
  };

  const progress = goal.target_amount
    ? Math.min(goal.current_amount / goal.target_amount, 1)
    : 0;

  return (
    <article className="space-y-3 rounded-xl border border-border/80 p-4">
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Meta</span>
            <input
              type="text"
              {...register("goal_name")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.goal_name && (
              <span className="text-xs text-rose-500">
                {errors.goal_name.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Objetivo</span>
            <input
              type="number"
              step="0.01"
              {...register("target_amount")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.target_amount && (
              <span className="text-xs text-rose-500">
                {errors.target_amount.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Ahorro actual</span>
            <input
              type="number"
              step="0.01"
              {...register("current_amount")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
            {errors.current_amount && (
              <span className="text-xs text-rose-500">
                {errors.current_amount.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Fecha objetivo</span>
            <input
              type="date"
              {...register("deadline")}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
            />
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
                  goal_name: goal.goal_name,
                  target_amount: goal.target_amount,
                  current_amount: goal.current_amount,
                  deadline: goal.deadline ?? null,
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
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {goal.goal_name}
            </p>
            {goal.deadline && (
              <p className="text-xs text-muted-foreground">
                Objetivo para {formatDate(goal.deadline)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="font-semibold text-foreground">
                {formatCurrency(goal.current_amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                de {formatCurrency(goal.target_amount)}
              </p>
            </div>
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
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </article>
  );
}
