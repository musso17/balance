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
  status: z.enum(["activa", "pagada", "morosa"]),
});

export type DebtFormValues = z.infer<typeof debtSchema>;

