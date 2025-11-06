import { NextResponse } from "next/server";

import { getDemoDashboard } from "@/lib/mocks/dashboard";
import { isDemoMode } from "@/lib/mocks/config";
import { getDashboardData } from "@/lib/supabase/dashboard";
import { getServerSession } from "@/lib/supabase/auth"; // This will now resolve correctly

export async function GET(request: Request) {
  const session = await getServerSession();
  const { searchParams } = new URL(request.url);
  const monthKey =
    searchParams.get("monthKey") ?? new Date().toISOString().slice(0, 7);

  try {
    if (!session) {
      if (!isDemoMode) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.json(getDemoDashboard(monthKey));
    }

    const data = await getDashboardData(monthKey);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[dashboard] GET", error);
    return NextResponse.json(
      { error: "Error cargando dashboard" },
      { status: 500 },
    );
  }
}
