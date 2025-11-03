import { z } from "zod";

export const personasOptions = [
  { value: "Persona A", label: "Persona A" },
  { value: "Persona B", label: "Persona B" },
  { value: "Compartido", label: "Compartido" },
] as const;

export const metodosOptions = [
  "Efectivo",
  "Yape",
  "Plin",
  "Débito",
  "Crédito",
  "Transferencia",
] as const;

export const transactionSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  category: z.string().min(1, "La categoría es obligatoria"),
  monto: z.coerce
    .number()
    .positive("Ingresa un monto mayor a 0")
    .max(1_000_000, "Monto demasiado alto"),
  persona: z.string().min(1, "Selecciona quién realizó la transacción"),
  tipo: z.enum(["ingreso", "gasto"]),
  metodo: z.string().optional(),
  nota: z
    .string()
    .max(280, "La nota no puede superar 280 caracteres")
    .optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

