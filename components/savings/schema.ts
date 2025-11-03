import { z } from "zod";

export const savingSchema = z.object({
  goal_name: z.string().min(1, "La meta es obligatoria"),
  target_amount: z.coerce
    .number()
    .positive("Ingresa un monto mayor a 0"),
  current_amount: z.coerce
    .number()
    .min(0, "Ingresa un monto válido"),
  deadline: z.string().nullable().optional(),
});

export type SavingFormValues = z.infer<typeof savingSchema>;

