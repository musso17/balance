import { z } from "zod";

export const budgetSchema = z.object({
  month_key: z.string(),
  category: z.string().min(1, "La categoría es obligatoria"),
  amount: z.coerce
    .number()
    .positive("Ingresa un monto mayor a 0")
    .max(1_000_000, "Monto demasiado alto"),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

