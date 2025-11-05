import type { Budget } from "@/lib/database.types";
import { DEMO_HOUSEHOLD_ID } from "@/lib/mocks/constants";

function buildDate(day: number) {
  return new Date(`2025-11-${String(day).padStart(2, "0")}T00:00:00.000Z`).toISOString();
}

export const mockBudgets: Record<string, Budget[]> = {
  "2025-11": [
    { id: "budget-1", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Alquiler", amount: 2415, created_at: buildDate(1) },
    { id: "budget-2", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Compras Casa", amount: 1500, created_at: buildDate(2) },
    { id: "budget-3", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Luz", amount: 180, created_at: buildDate(3) },
    { id: "budget-4", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Teléfono", amount: 165, created_at: buildDate(4) },
    { id: "budget-5", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Mantenimiento", amount: 310, created_at: buildDate(5) },
    { id: "budget-6", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Internet", amount: 99, created_at: buildDate(6) },
    { id: "budget-7", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Psicólogas", amount: 1240, created_at: buildDate(7) },
    { id: "budget-8", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Membresías", amount: 207, created_at: buildDate(8) },
    { id: "budget-9", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Carro", amount: 2613, created_at: buildDate(9) },
    { id: "budget-10", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Gasolina", amount: 120, created_at: buildDate(10) },
    { id: "budget-11", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Tere", amount: 200, created_at: buildDate(11) },
    { id: "budget-12", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Lavandería", amount: 200, created_at: buildDate(12) },
    { id: "budget-13", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Deporte", amount: 360, created_at: buildDate(13) },
    { id: "budget-14", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Laser", amount: 192, created_at: buildDate(14) },
    { id: "budget-15", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Gatos", amount: 680, created_at: buildDate(15) },
    { id: "budget-16", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Entretenimiento", amount: 100, created_at: buildDate(16) },
    { id: "budget-17", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Restaurantes", amount: 300, created_at: buildDate(17) },
    { id: "budget-18", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Taxis", amount: 120, created_at: buildDate(18) },
    { id: "budget-19", household_id: DEMO_HOUSEHOLD_ID, month_key: "2025-11", category: "Extras", amount: 500, created_at: buildDate(19) },
  ],
};

