import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SavingGoal } from "@/lib/database.types";

export function useSavings() {
  return useQuery<SavingGoal[]>({
    queryKey: ["savings"],
    queryFn: async () => {
      const response = await fetch("/api/savings");
      if (!response.ok) {
        throw new Error("No pudimos cargar las metas de ahorro");
      }
      return (await response.json()) as SavingGoal[];
    },
  });
}

export interface CreateSavingInput {
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
}

export interface UpdateSavingInput
  extends Partial<CreateSavingInput> {
  id: string;
}

export function useCreateSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSavingInput) => {
      const response = await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos guardar la meta de ahorro");
      }

      return (await response.json()) as SavingGoal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["savings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateSavingInput) => {
      const response = await fetch(`/api/savings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos actualizar la meta de ahorro");
      }

      return (await response.json()) as SavingGoal;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["savings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/savings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No pudimos eliminar la meta de ahorro");
      }

      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["savings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
