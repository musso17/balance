import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Transaction } from "@/lib/database.types";

export function useTransactions(monthKey?: string) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", monthKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (monthKey) params.set("monthKey", monthKey);
      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("No pudimos cargar las transacciones");
      }
      return (await response.json()) as Transaction[];
    },
  });
}

export interface CreateTransactionInput {
  date: string;
  category: string;
  monto: number;
  persona: string;
  tipo: "ingreso" | "gasto" | "deuda";
  debt_id?: string;
  debt_action?: "pay_installment" | "amortize";
  debt_amount?: number;
  nota?: string | null;
  metodo?: string | null;
}

export interface UpdateTransactionInput
  extends Partial<CreateTransactionInput> {
  id: string;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionInput) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos guardar la transacción");
      }

      return (await response.json()) as Transaction;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTransactionInput) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No pudimos actualizar la transacción");
      }

      return (await response.json()) as Transaction;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useImportTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTransactionInput[]) => {
      const response = await fetch("/api/transactions/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: payload }),
      });

      if (!response.ok) {
        throw new Error("No pudimos importar las transacciones");
      }

      return (await response.json()) as { imported: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("No pudimos eliminar la transacción");
      }

      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
