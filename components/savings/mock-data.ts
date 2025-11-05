import type { Tables } from "@/lib/database.types";
import { DEMO_HOUSEHOLD_ID } from "@/lib/mocks/constants";

export const mockSavings: Tables<'savings'>[] = [
  {
    id: "1",
    goal_name: "Fondo emergencia",
    target_amount: 24000,
    current_amount: 6000,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: DEMO_HOUSEHOLD_ID,
  },
  {
    id: "2",
    goal_name: "Viaje Londres",
    target_amount: 30000,
    current_amount: 4500,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: DEMO_HOUSEHOLD_ID,
  },
  {
    id: "3",
    goal_name: "Cumple Ana",
    target_amount: 15000,
    current_amount: 2500,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: DEMO_HOUSEHOLD_ID,
  },
  {
    id: "4",
    goal_name: "Amortización carro",
    target_amount: 18850,
    current_amount: 7200,
    deadline: null,
    created_at: new Date().toISOString(),
    household_id: DEMO_HOUSEHOLD_ID,
  },
];
