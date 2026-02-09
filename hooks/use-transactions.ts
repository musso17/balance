import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Tables, TablesUpdate } from "@/lib/database.types";
import { handleAuthRedirect } from "@/lib/utils/api";

export function useTransactions(monthKey?: string) {
  return useQuery<Tables<'transactions'>[]>({
    queryKey: ["transactions", monthKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (monthKey) params.set("monthKey", monthKey);
      const response = await fetch(`/api/transactions?${params.toString()}`);
      handleAuthRedirect(response);
      if (!response.ok) {
        throw new Error("No pudimos cargar las transacciones");
      }
      return (await response.json()) as Tables<'transactions'>[];
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

export interface UpdateTransactionInput extends TablesUpdate<'transactions'> {
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
      handleAuthRedirect(response);
      if (!response.ok) {
        const message = (await response.json()?.catch(() => null))?.error;
        throw new Error(message ?? "No pudimos guardar la transacción");
      }

      return (await response.json()) as Tables<'transactions'>;
    },
    // Optimistic update: add transaction immediately for instant feedback
    onMutate: async (newTransaction) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["transactions"] });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData<Tables<'transactions'>[]>(["transactions"]);

      // Optimistically add to the cache
      if (previousTransactions) {
        const optimisticTransaction: Tables<'transactions'> = {
          id: `temp-${Date.now()}`,
          date: newTransaction.date,
          category: newTransaction.category,
          monto: newTransaction.monto,
          persona: newTransaction.persona,
          tipo: newTransaction.tipo,
          nota: newTransaction.nota ?? null,
          metodo: newTransaction.metodo ?? null,
          household_id: "optimistic",
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Tables<'transactions'>[]>(
          ["transactions"],
          [optimisticTransaction, ...previousTransactions]
        );
      }

      return { previousTransactions };
    },
    // Rollback on error
    onError: (_err, _newTransaction, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(["transactions"], context.previousTransactions);
      }
    },
    onSettled: () => {
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

      handleAuthRedirect(response);
      if (!response.ok) {
        throw new Error("No pudimos actualizar la transacción");
      }

      return (await response.json()) as Tables<'transactions'>;
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
      handleAuthRedirect(response);

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
      handleAuthRedirect(response);

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
