import { create } from "zustand";
import { persist } from "zustand/middleware";

import { monthKeyFromDate } from "@/lib/utils/date";

type PersonaFilter = "todos" | "pareja" | "persona_1" | "persona_2";

export interface DashboardFilters {
  monthKey: string;
  persona: PersonaFilter;
  category: string | null;
  showDebtImpact: boolean;
}

interface DashboardStore extends DashboardFilters {
  setMonthKey: (monthKey: string) => void;
  setPersona: (persona: PersonaFilter) => void;
  setCategory: (category: string | null) => void;
  toggleDebtImpact: () => void;
  reset: () => void;
}

const getCurrentMonthKey = () => monthKeyFromDate(new Date());

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      monthKey: getCurrentMonthKey(),
      persona: "todos",
      category: null,
      showDebtImpact: true,
      setMonthKey: (monthKey) => set({ monthKey }),
      setPersona: (persona) => set({ persona }),
      setCategory: (category) => set({ category }),
      toggleDebtImpact: () =>
        set((state) => ({ showDebtImpact: !state.showDebtImpact })),
      reset: () =>
        set({
          monthKey: getCurrentMonthKey(),
          persona: "todos",
          category: null,
          showDebtImpact: true,
        }),
    }),
    {
      name: "dashboard-preferences-v2",
      partialize: (state) => ({
        persona: state.persona,
        showDebtImpact: state.showDebtImpact,
      }),
    },
  ),
);
