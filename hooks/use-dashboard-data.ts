import { useQuery } from "@tanstack/react-query";

import type { DashboardData } from "@/lib/supabase/dashboard";

export function useDashboardData(monthKey: string) {
  return useQuery<DashboardData>({
    queryKey: ["dashboard", monthKey],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard?monthKey=${monthKey}`);

      if (!response.ok) {
        throw new Error("No pudimos cargar los datos del dashboard");
      }

      return (await response.json()) as DashboardData;
    },
  });
}

