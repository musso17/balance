import { z } from "zod";

export const incomeCategoryOptions = ["Sueldo", "Otro"] as const;

export const expenseCategoryOptions = [
  "Alquiler",
  "Compras Casa",
  "Luz",
  "Teléfono",
  "Mantenimiento",
  "Internet",
  "Psicólogas",
  "Membresías",
  "Carro",
  "Gasolina",
  "Tere",
  "Lavandería",
  "Deporte",
  "Laser",
  "Gatos",
  "Entretenimiento",
  "Restaurantes",
  "Taxis",
  "Extras",
  "Estacionalidad",
  "Mantenimiento Carro",
] as const;

export const categoryOptions = expenseCategoryOptions;
export const allCategoryOptions = [
  ...incomeCategoryOptions,
  ...expenseCategoryOptions,
] as const;

export const personasOptions = [
  { value: "Marcelo", label: "Marcelo" },
  { value: "Ana", label: "Ana" },
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

export const debtActions = ["pay_installment", "amortize"] as const;

export const transactionSchema = z
  .object({
    date: z.string().min(1, "La fecha es obligatoria"),
    category: z.string().optional(),
    monto: z.coerce
      .number()
      .positive("Ingresa un monto mayor a 0")
      .max(1_000_000, "Monto demasiado alto"),
    persona: z.string().min(1, "Selecciona quién realizó la transacción"),
    tipo: z.enum(["ingreso", "gasto", "deuda"]),
    debt_id: z.string().optional(),
    debt_action: z.enum(debtActions).optional(),
    metodo: z.string().optional(),
    nota: z
      .string()
      .max(280, "La nota no puede superar 280 caracteres")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "gasto" || data.tipo === "ingreso") {
      if (!data.category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La categoría es obligatoria",
          path: ["category"],
        });
        return;
      }

      const allowedCategories =
        data.tipo === "ingreso" ? incomeCategoryOptions : expenseCategoryOptions;
      const isValidCategory = allowedCategories.includes(
        data.category as (typeof allowedCategories)[number],
      );
      if (!isValidCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Selecciona una categoría válida",
          path: ["category"],
        });
      }
    }

    if (data.tipo === "deuda") {
      if (!data.debt_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes seleccionar una deuda",
          path: ["debt_id"],
        });
      }
      if (!data.debt_action) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Debes seleccionar una acción",
          path: ["debt_action"],
        });
      }
      if (data.debt_action === "amortize" && (!data.monto || Number.isNaN(data.monto))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ingresa el monto a amortizar",
          path: ["monto"],
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
