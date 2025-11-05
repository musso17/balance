import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Debt } from "@/lib/database.types";

export function useDebts() {
  return useQuery<Debt[]>({
    queryKey: ["debts"],
    queryFn: async () => {
      const response = await fetch("/api/debts");
      if (!response.ok) {
        throw new Error("No pudimos cargar las deudas");
      }
      return (await response.json()) as Debt[];
    },
  });
}

export interface CreateDebtInput {
  entity: string;
  balance: number;
  monthly_payment: number;
  interest_rate?: number;
  status: "activa" | "pagada" | "morosa";
}

export interface UpdateDebtInput
  extends Partial<CreateDebtInput> {
  id: string;
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDebtInput) => {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos guardar la deuda");
      }

      return (await response.json()) as Debt;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["debts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDebtInput) => {
      const response = await fetch(`/api/debts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos actualizar la deuda");
      }

      return (await response.json()) as Debt;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["debts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No pudimos eliminar la deuda");
      }

      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["debts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useActiveDebts() {
  return useQuery<Debt[]>({
    queryKey: ["active-debts"],
    queryFn: async () => {
      const response = await fetch("/api/debts/active");
      if (!response.ok) {
        throw new Error("No pudimos cargar las deudas activas");
      }
      return (await response.json()) as Debt[];
    },
  });
}

export interface DebtActionInput {
  debt_id: string;
  action: "pay_installment" | "amortize";
  monto: number;
  date: string;
  persona: string;
  metodo?: string | null;
  nota?: string | null;
}

export function useDebtAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DebtActionInput) => {
      const response = await fetch("/api/debts/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos realizar la acción de deuda");
      }

      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["debts"] });
      void queryClient.invalidateQueries({ queryKey: ["active-debts"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
