/**
 * Centralized application configuration
 * Single source of truth for constants used across the app
 */

export const PERSONAS = ["Marcelo", "Ana", "Compartido"] as const;
export type Persona = (typeof PERSONAS)[number];

export const PERSONAS_OPTIONS = [
    { value: "Marcelo", label: "Marcelo" },
    { value: "Ana", label: "Ana" },
    { value: "Compartido", label: "Compartido" },
] as const;

export const PERSONAS_FILTER_OPTIONS = ["Todos", ...PERSONAS] as const;

export const TIPOS = ["ingreso", "gasto", "deuda"] as const;
export type TipoTransaccion = (typeof TIPOS)[number];

export const TIPOS_FILTER_OPTIONS = ["Todos", "Ingreso", "Gasto", "Deuda"] as const;

export const METODOS_PAGO = [
    "Efectivo",
    "Yape",
    "Plin",
    "Débito",
    "Crédito",
    "Transferencia",
] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const INCOME_CATEGORIES = ["Sueldo", "Otro"] as const;

export const EXPENSE_CATEGORIES = [
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

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const;

export const APP_NAME = "Balance Compartido";
export const APP_DESCRIPTION = "Gestión colaborativa de finanzas del hogar";

/**
 * Fixed monthly income that is automatically applied each month.
 * This represents recurring income like salaries that don't need manual entry.
 * Set to 0 to disable.
 */
export const FIXED_MONTHLY_INCOME = 16500;
