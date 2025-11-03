import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Budget } from "@/types/database";

export function useBudgets(monthKey?: string) {
  return useQuery<Budget[]>({
    queryKey: ["budgets", monthKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (monthKey) params.set("monthKey", monthKey);
      const response = await fetch(`/api/budgets?${params.toString()}`);
      if (!response.ok) {
        throw new Error("No pudimos cargar los presupuestos");
      }
      return (await response.json()) as Budget[];
    },
  });
}

export interface CreateBudgetInput {
  month_key: string;
  category: string;
  amount: number;
}

export interface UpdateBudgetInput
  extends Partial<CreateBudgetInput> {
  id: string;
  month_key: string;
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBudgetInput) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos guardar el presupuesto");
      }

      return (await response.json()) as Budget;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", variables.month_key],
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, month_key, ...payload }: UpdateBudgetInput) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos actualizar el presupuesto");
      }

      return (await response.json()) as Budget;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", variables.month_key],
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, month_key }: { id: string; month_key: string }) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No pudimos eliminar el presupuesto");
      }

      return true;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard", variables.month_key],
      });
    },
  });
}
