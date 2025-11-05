import { NextResponse } from "next/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/supabase/auth";
import { getHouseholdId } from "@/lib/supabase/household"; // Asegúrate que esta ruta es correcta
import type { Tables } from "@/lib/database.types";

// This comment is added to trigger a re-evaluation by Next.js build system.

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Usamos el cliente de servicio para operaciones de administrador como la importación masiva.
  const supabase = createSupabaseServiceRoleClient(); 
  const householdId = await getHouseholdId({ createIfMissing: false });

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró un hogar para el usuario actual." },
      { status: 401 },
    );
  }

  const body = await request.json();
  const transactions = Array.isArray(body?.transactions)
    ? (body.transactions as Array<
        Pick<
          Tables["transactions"]["Insert"],
          "date" | "category" | "monto" | "persona" | "tipo" | "nota" | "metodo"
        >
      >)
    : [];

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "Sin transacciones para importar" },
      { status: 400 },
    );
  }

  const payload = transactions.map(
    (item) =>
      ({
        ...item,
        household_id: householdId,
      } as Tables["transactions"]["Insert"]),
  );

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: data?.length ?? 0 });
}
