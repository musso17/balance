import { NextResponse } from "next/server";

import { getActiveDebts } from "@/lib/supabase/debts";
import { getDemoDebts } from "@/lib/mocks/store";
import { isDemoMode } from "@/lib/mocks/config";

export async function GET() {
  try {
    const debts = await getActiveDebts();
    return NextResponse.json(debts);
  } catch (error) {
    console.error("[API] /api/debts/active", error);
    if (isDemoMode) {
      return NextResponse.json(getDemoDebts());
    }
    return NextResponse.json(
      { error: "No se pudieron cargar las deudas activas" },
      { status: 500 },
    );
  }
}
