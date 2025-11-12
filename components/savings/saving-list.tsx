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
import type { Tables } from "@/lib/database.types";

export function SavingList() {
  const { data, isLoading, isError, error } = useSavings();
  const savings = data ?? [];

  return (
    <div className="glass-panel space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Metas activas
        </h3>
        <p className="text-sm text-muted-foreground">
          Controla el avance mensual para cumplir sus objetivos.
        </p>
      </header>

      {isLoading && (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm text-muted-foreground backdrop-blur-2xl">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando metas de ahorro...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error instanceof Error
            ? error.message
            : "Error al cargar las metas de ahorro"}
        </div>
      )}

      {!isLoading && savings.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur-2xl">
          Añadan metas para monitorear su progreso financiero.
        </p>
      )}

      {!isLoading && savings.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {savings.map((goal) => (
            <SavingRowItem key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

function SavingRowItem({ goal }: { goal: Tables<'savings'> }) {
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
      current_amount: goal.current_amount ?? 0,
      deadline: goal.deadline ?? null,
    },
  });

  useEffect(() => {
    reset({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount ?? 0,
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
    ? Math.min((goal.current_amount ?? 0) / goal.target_amount, 1)
    : 0;
  const percent = Math.round(progress * 100);
  const isComplete = percent >= 100;
  const progressColor = isComplete ? "bg-emerald-300" : "bg-primary";

  return (
    <article className="subdued-card space-y-4 p-4 md:p-5">
      {isEditing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-3 md:grid-cols-2"
        >
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium text-foreground">Meta</span>
            <input
              type="text"
              {...register("goal_name")}
              className="soft-input"
            />
            {errors.goal_name && (
              <span className="text-xs text-rose-500">
                {errors.goal_name.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Objetivo</span>
            <input
              type="number"
              step="0.01"
              {...register("target_amount")}
              className="soft-input"
            />
            {errors.target_amount && (
              <span className="text-xs text-rose-500">
                {errors.target_amount.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Ahorro actual</span>
            <input
              type="number"
              step="0.01"
              {...register("current_amount")}
              className="soft-input"
            />
            {errors.current_amount && (
              <span className="text-xs text-rose-500">
                {errors.current_amount.message}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Fecha objetivo</span>
            <input
              type="date"
              {...register("deadline")}
              className="soft-input"
            />
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
                  goal_name: goal.goal_name,
                  target_amount: goal.target_amount,
                  current_amount: goal.current_amount ?? 0,
                  deadline: goal.deadline ?? null,
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
              {goal.goal_name}
            </p>
            {goal.deadline && (
              <p className="text-xs text-muted-foreground">
                Objetivo para {formatDate(goal.deadline)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm md:justify-end">
            <div className="text-right">
              <p className="muted-label">Acumulado</p>
              <p className="text-base font-semibold text-foreground">
                {formatCurrency(goal.current_amount ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                de {formatCurrency(goal.target_amount)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-2xl border border-white/10 bg-white/5 p-1.5 text-muted-foreground shadow-sm transition hover:text-primary"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-2xl border border-white/10 bg-white/5 p-1.5 text-muted-foreground shadow-sm transition hover:text-rose-400 disabled:cursor-not-allowed"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(goal.current_amount ?? 0)} de {formatCurrency(goal.target_amount)}</span>
          <span>{percent}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {isComplete && (
          <p className="text-xs font-medium text-emerald-200">
            ¡Meta cumplida! Considera crear una nueva prioridad.
          </p>
        )}
      </div>
    </article>
  );
}
