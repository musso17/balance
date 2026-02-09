import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTransactions, useCreateTransaction } from "@/hooks/use-transactions";

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "QueryClientWrapper";
    return Wrapper;
};

describe("useTransactions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch transactions successfully", async () => {
        const mockTransactions = [
            {
                id: "1",
                date: "2026-02-01",
                category: "Alquiler",
                monto: 1500,
                persona: "Compartido",
                tipo: "gasto",
                nota: null,
                metodo: "Transferencia",
                household_id: "test-household",
                created_at: "2026-02-01T00:00:00Z",
            },
        ];

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTransactions,
        });

        const { result } = renderHook(() => useTransactions("2026-02"), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockTransactions);
        expect(global.fetch).toHaveBeenCalledWith(
            "/api/transactions?monthKey=2026-02"
        );
    });

    it("should handle fetch error", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const { result } = renderHook(() => useTransactions(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(
            "No pudimos cargar las transacciones"
        );
    });
});

describe("useCreateTransaction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should create a transaction successfully", async () => {
        const newTransaction = {
            date: "2026-02-08",
            category: "Restaurantes",
            monto: 50,
            persona: "Marcelo",
            tipo: "gasto" as const,
        };

        const createdTransaction = {
            id: "new-id",
            ...newTransaction,
            nota: null,
            metodo: null,
            household_id: "test-household",
            created_at: "2026-02-08T00:00:00Z",
        };

        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => createdTransaction,
        });

        const { result } = renderHook(() => useCreateTransaction(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(newTransaction);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(global.fetch).toHaveBeenCalledWith("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTransaction),
        });
    });

    it("should handle creation error", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Error de validación" }),
        });

        const { result } = renderHook(() => useCreateTransaction(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({
            date: "2026-02-08",
            category: "Invalid",
            monto: -100,
            persona: "Test",
            tipo: "gasto",
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
