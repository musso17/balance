import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Tables, TablesUpdate } from "@/lib/database.types";
import { handleAuthRedirect } from "@/lib/utils/api";

export function useBudgetTemplates() {
    return useQuery<Tables<'budgets'>[]>({
        queryKey: ["budget-templates"],
        queryFn: async () => {
            const response = await fetch("/api/budget-templates");
            handleAuthRedirect(response);
            if (!response.ok) {
                throw new Error("No pudimos cargar las plantillas de presupuesto");
            }
            return (await response.json()) as Tables<'budgets'>[];
        },
    });
}

export interface CreateBudgetTemplateInput {
    category: string;
    amount: number;
}

export interface UpdateBudgetTemplateInput extends TablesUpdate<'budgets'> {
    id: string;
}

export function useCreateBudgetTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateBudgetTemplateInput) => {
            const response = await fetch("/api/budget-templates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            handleAuthRedirect(response);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error ?? "No pudimos guardar la plantilla");
            }
            return (await response.json()) as Tables<'budgets'>;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["budget-templates"] });
            void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

export function useUpdateBudgetTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...payload }: UpdateBudgetTemplateInput) => {
            const response = await fetch(`/api/budget-templates/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            handleAuthRedirect(response);

            if (!response.ok) {
                throw new Error("No pudimos actualizar la plantilla");
            }

            return (await response.json()) as Tables<'budgets'>;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["budget-templates"] });
            void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

export function useDeleteBudgetTemplate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/budget-templates/${id}`, {
                method: "DELETE",
            });
            handleAuthRedirect(response);

            if (!response.ok) {
                throw new Error("No pudimos eliminar la plantilla");
            }

            return true;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["budget-templates"] });
            void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}
