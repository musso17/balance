import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdId } from "@/lib/supabase/household";
import type { Tables } from "@/types/database";
import {
  accrueMonthlyInterest,
  calculateMonthlyPayment,
  calculateRemainingMonths,
  roundCurrency,
} from "@/lib/utils/debt-math";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const householdId = await getHouseholdId();

  if (!householdId) {
    return NextResponse.json(
      { error: "No se encontró el hogar" },
      { status: 400 },
    );
  }

  const {
    debt_id,
    action,
    monto,
    date,
    persona,
    metodo,
    nota,
  } = (await request.json()) as {
    debt_id: string;
    action: "pay_installment" | "amortize";
    monto: number;
    date: string;
    persona: string;
    metodo?: string | null;
    nota?: string | null;
  };

  if (!debt_id || !action || monto === undefined || !date || !persona) {
    return NextResponse.json(
      { error: "Faltan parámetros requeridos: debt_id, action, monto, date, persona" },
      { status: 400 },
    );
  }

  const amount = Number(monto);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "El monto debe ser un número mayor a 0" },
      { status: 400 },
    );
  }

  // Fetch the debt to get its current balance and monthly payment
  const { data: debt, error: fetchError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", debt_id)
    .eq("household_id", householdId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!debt) {
    return NextResponse.json({ error: "Deuda no encontrada" }, { status: 404 });
  }

  const interestRate = debt.interest_rate ?? 0;
  const balanceWithInterest =
    action === "pay_installment"
      ? accrueMonthlyInterest(debt.balance, interestRate)
      : roundCurrency(debt.balance);

  let newBalance =
    action === "pay_installment"
      ? roundCurrency(balanceWithInterest - amount)
      : roundCurrency(Math.max(debt.balance - amount, 0));

  if (newBalance < 0) {
    newBalance = 0;
  }

  let updatedMonthlyPayment = roundCurrency(debt.monthly_payment);

  if (action === "amortize" && newBalance > 0) {
    const remainingMonths = calculateRemainingMonths(
      debt.balance,
      Math.max(debt.monthly_payment, 0.01),
      interestRate,
    );

    if (remainingMonths && Number.isFinite(remainingMonths) && remainingMonths > 0) {
      const months = Math.max(1, Math.round(remainingMonths));
      const recalculatedPayment = calculateMonthlyPayment(
        newBalance,
        interestRate,
        months,
      );
      if (recalculatedPayment > 0) {
        updatedMonthlyPayment = recalculatedPayment;
      }
    }
  }

  let newStatus: Tables["debts"]["Update"]["status"] = debt.status;
  if (newBalance <= 0.01) {
    newBalance = 0;
    updatedMonthlyPayment = 0;
    newStatus = "pagada";
  }

  const updatePayload: Tables["debts"]["Update"] = {
    balance: roundCurrency(newBalance),
  };

  if (action === "amortize" || newStatus === "pagada") {
    updatePayload.monthly_payment = roundCurrency(updatedMonthlyPayment);
  }

  if (newStatus !== debt.status) {
    updatePayload.status = newStatus;
  }

  const { data: updatedDebt, error: updateError } = await supabase
    .from("debts")
    .update(updatePayload)
    .eq("id", debt_id)
    .eq("household_id", householdId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create a transaction record for the debt payment
  const transactionPayload: Tables["transactions"]["Insert"] = {
    household_id: householdId,
    monto: roundCurrency(amount),
    tipo: "deuda",
    category: debt.entity,
    persona,
    date,
    metodo: metodo ?? null,
    nota:
      nota ??
      `Pago de deuda: ${debt.entity} - ${action === "pay_installment" ? "Cuota" : "Amortización"}`,
  };

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .insert([transactionPayload])
    .select()
    .single();

  if (transactionError) {
    return NextResponse.json({ error: transactionError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: "Acción de deuda realizada con éxito",
      debt: updatedDebt,
      transaction,
    },
    { status: 200 },
  );
}
