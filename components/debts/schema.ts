import { z } from "zod";

export const debtSchema = z.object({
  entity: z.string().min(1, "La entidad es obligatoria"),
  balance: z.coerce
    .number()
    .positive("Ingresa un monto mayor a 0")
    .max(5_000_000, "Monto demasiado alto"),
  monthly_payment: z.coerce
    .number()
    .positive("Ingresa un pago mensual mayor a 0")
    .max(1_000_000, "Monto demasiado alto"),
  interest_rate: z.coerce
    .number()
    .min(0, "El interés no puede ser negativo")
    .max(100, "El interés no puede ser mayor a 100")
    .optional(),
  installments: z.coerce
    .number()
    .positive("Debe ser mayor a 0")
    .optional(),
  balloon_payment: z.coerce
    .number()
    .min(0, "No puede ser negativo")
    .optional(),
  is_balloon: z.boolean().optional(),
  status: z.enum(["activa", "pagada", "morosa"]),
});

export type DebtFormValues = z.infer<typeof debtSchema>;

