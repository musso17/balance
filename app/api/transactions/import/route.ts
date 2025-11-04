import { NextResponse } from "next/server";

/**
 * Placeholder endpoint for bulk transaction imports.
 * At the moment the feature is disabled, so we fail fast with 501.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Importación masiva no disponible en este momento." },
    { status: 501 },
  );
}

