import { z } from "zod";

/**
 * API validation schemas for transactions
 * These are server-side validations separate from form validations
 */

export const createTransactionSchema = z.object({
    date: z.string().min(1, "La fecha es obligatoria").regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
    category: z.string().min(1, "La categoría es obligatoria"),
    monto: z.number().positive("El monto debe ser mayor a 0").max(10_000_000, "Monto demasiado alto"),
    persona: z.string().min(1, "La persona es obligatoria"),
    tipo: z.enum(["ingreso", "gasto", "deuda"], {
        message: "Tipo inválido",
    }),
    debt_id: z.string().uuid().optional(),
    debt_action: z.enum(["pay_installment", "amortize"]).optional(),
    debt_amount: z.number().positive().optional(),
    nota: z.string().max(500).nullable().optional(),
    metodo: z.string().max(50).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionPayload = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionPayload = z.infer<typeof updateTransactionSchema>;

/**
 * Validate and parse request body with proper error handling
 */
export function parseTransactionPayload<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);

    if (!result.success) {
        const firstError = result.error.issues[0];
        return {
            success: false,
            error: firstError?.message ?? "Datos inválidos",
        };
    }

    return { success: true, data: result.data };
}
