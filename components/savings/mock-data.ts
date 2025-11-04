import type { SavingGoal } from "@/types/database";

export const mockSavings: SavingGoal[] = [
  {
    id: "1",
    goal_name: "Fondo emergencia",
    target_amount: 24000,
    current_amount: 0,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: "",
  },
  {
    id: "2",
    goal_name: "Viaje Londres",
    target_amount: 30000,
    current_amount: 0,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: "",
  },
  {
    id: "3",
    goal_name: "Cumple Ana",
    target_amount: 15000,
    current_amount: 0,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: "",
  },
  {
    id: "4",
    goal_name: "Amortización carro",
    target_amount: 18850,
    current_amount: 0,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: "",
  },
];
