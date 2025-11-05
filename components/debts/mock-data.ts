import type { Debt } from "@/lib/database.types";

export const mockDebts: Debt[] = [
  {
    id: "debt-1",
    household_id: "",
    entity: "Hipoteca",
    balance: 120000,
    monthly_payment: 2500,
    interest_rate: 6.5,
    status: "activa",
    created_at: new Date().toISOString(),
  },
  {
    id: "debt-2",
    household_id: "",
    entity: "Auto familiar",
    balance: 18000,
    monthly_payment: 950,
    interest_rate: 5.2,
    status: "activa",
    created_at: new Date().toISOString(),
  },
  {
    id: "debt-3",
    household_id: "",
    entity: "Tarjeta viajes",
    balance: 4200,
    monthly_payment: 350,
    interest_rate: 28,
    status: "activa",
    created_at: new Date().toISOString(),
  },
];

