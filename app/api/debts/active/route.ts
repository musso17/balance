import { NextResponse } from "next/server";

import { getActiveDebts } from "@/lib/supabase/debts";
import { getDemoDebts } from "@/lib/mocks/store";

export async function GET() {
  try {
    const debts = await getActiveDebts();
    return NextResponse.json(debts);
  } catch (error) {
    console.error("[API] /api/debts/active", error);
    return NextResponse.json(getDemoDebts());
  }
}
