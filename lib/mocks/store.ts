import { randomUUID } from "crypto";

import { mockBudgets } from "@/components/budgets/mock-data";
import { mockTransactions } from "@/components/transactions/mock-data";
import { mockDebts } from "@/components/debts/mock-data";
import { mockSavings } from "@/components/savings/mock-data";
import type { Budget, Debt, SavingGoal, Transaction } from "@/lib/database.types";
import { DEMO_HOUSEHOLD_ID } from "@/lib/mocks/constants";
import {
  accrueMonthlyInterest,
  calculateMonthlyPayment,
  calculateRemainingMonths,
  roundCurrency,
} from "@/lib/utils/debt-math";

const id = (prefix: string) => {
  try {
    return `${prefix}-${randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

export function getDemoBudgets(monthKey: string): Budget[] {
  const months = Object.keys(mockBudgets);
  if (months.length === 0) return [];
  const safeMonth = Object.prototype.hasOwnProperty.call(mockBudgets, monthKey)
    ? monthKey
    : months[0];
  return mockBudgets[safeMonth as keyof typeof mockBudgets].map((item) => ({
    ...item,
  }));
}

export function addDemoBudget(payload: Pick<Budget, "month_key" | "category" | "amount">): Budget {
  const entry: Budget = {
    id: id("demo-budget"),
    household_id: DEMO_HOUSEHOLD_ID,
    month_key: payload.month_key,
    category: payload.category,
    amount: payload.amount,
    created_at: new Date().toISOString(),
  };
  const bucket = mockBudgets[payload.month_key] ?? (mockBudgets[payload.month_key] = []);
  bucket.push(entry);
  return { ...entry };
}

export function updateDemoBudget(idToUpdate: string, changes: Partial<Budget>): Budget | null {
  for (const [month, list] of Object.entries(mockBudgets)) {
    const index = list.findIndex((item) => item.id === idToUpdate);
    if (index === -1) continue;
    const current = list[index];
    const nextMonth = changes.month_key ?? current.month_key;
    const updated: Budget = {
      ...current,
      ...changes,
      month_key: nextMonth,
      household_id: DEMO_HOUSEHOLD_ID,
      created_at: changes.created_at ?? current.created_at ?? new Date().toISOString(),
    };

    if (nextMonth !== month) {
      list.splice(index, 1);
      const target = mockBudgets[nextMonth] ?? (mockBudgets[nextMonth] = []);
      target.push(updated);
    } else {
      list[index] = updated;
    }

    return { ...updated };
  }

  return null;
}

export function deleteDemoBudget(idToRemove: string): boolean {
  for (const list of Object.values(mockBudgets)) {
    const index = list.findIndex((item) => item.id === idToRemove);
    if (index !== -1) {
      list.splice(index, 1);
      return true;
    }
  }
  return false;
}

export function getDemoTransactions(monthKey?: string | null): Transaction[] {
  const filtered = monthKey
    ? mockTransactions.filter((item) => item.date.startsWith(monthKey))
    : mockTransactions;
  return filtered.map((item) => ({ ...item }));
}

export function addDemoTransaction(
  payload: Pick<Transaction, "date" | "category" | "monto" | "persona" | "tipo" | "metodo" | "nota">,
): Transaction {
  const entry: Transaction = {
    id: id("demo-transaction"),
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: new Date().toISOString(),
    ...payload,
  };
  mockTransactions.unshift(entry);
  return { ...entry };
}

export function updateDemoTransaction(idToUpdate: string, changes: Partial<Transaction>): Transaction | null {
  const index = mockTransactions.findIndex((item) => item.id === idToUpdate);
  if (index === -1) return null;
  const current = mockTransactions[index];
  const updated: Transaction = {
    ...current,
    ...changes,
    household_id: DEMO_HOUSEHOLD_ID,
  };
  mockTransactions[index] = updated;
  return { ...updated };
}

export function deleteDemoTransaction(idToRemove: string): boolean {
  const index = mockTransactions.findIndex((item) => item.id === idToRemove);
  if (index === -1) return false;
  mockTransactions.splice(index, 1);
  return true;
}

export function getDemoSavings(): SavingGoal[] {
  return mockSavings.map((item) => ({ ...item }));
}

export function addDemoSaving(
  payload: Pick<SavingGoal, "goal_name" | "target_amount" | "current_amount" | "deadline">,
): SavingGoal {
  const entry: SavingGoal = {
    id: id("demo-saving"),
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: new Date().toISOString(),
    goal_name: payload.goal_name,
    target_amount: payload.target_amount,
    current_amount: payload.current_amount ?? 0,
    deadline: payload.deadline ?? null,
  };
  mockSavings.push(entry);
  return { ...entry };
}

export function updateDemoSaving(idToUpdate: string, changes: Partial<SavingGoal>): SavingGoal | null {
  const index = mockSavings.findIndex((item) => item.id === idToUpdate);
  if (index === -1) return null;
  const current = mockSavings[index];
  const updated: SavingGoal = {
    ...current,
    ...changes,
    household_id: DEMO_HOUSEHOLD_ID,
    current_amount: changes.current_amount ?? current.current_amount,
  };
  mockSavings[index] = updated;
  return { ...updated };
}

export function deleteDemoSaving(idToRemove: string): boolean {
  const index = mockSavings.findIndex((item) => item.id === idToRemove);
  if (index === -1) return false;
  mockSavings.splice(index, 1);
  return true;
}

export function getDemoDebts(): Debt[] {
  return mockDebts.map((item) => ({ ...item }));
}

export function addDemoDebt(
  payload: Pick<Debt, "entity" | "balance" | "monthly_payment" | "interest_rate" | "status">,
): Debt {
  const entry: Debt = {
    id: id("demo-debt"),
    household_id: DEMO_HOUSEHOLD_ID,
    created_at: new Date().toISOString(),
    entity: payload.entity,
    balance: payload.balance,
    monthly_payment: payload.monthly_payment,
    interest_rate: payload.interest_rate ?? null,
    status: payload.status ?? "activa",
  };
  mockDebts.push(entry);
  return { ...entry };
}

export function updateDemoDebt(idToUpdate: string, changes: Partial<Debt>): Debt | null {
  const index = mockDebts.findIndex((item) => item.id === idToUpdate);
  if (index === -1) return null;
  const current = mockDebts[index];
  const updated: Debt = {
    ...current,
    ...changes,
    household_id: DEMO_HOUSEHOLD_ID,
  };
  mockDebts[index] = updated;
  return { ...updated };
}

export function deleteDemoDebt(idToRemove: string): boolean {
  const index = mockDebts.findIndex((item) => item.id === idToRemove);
  if (index === -1) return false;
  mockDebts.splice(index, 1);
  return true;
}

export function performDemoDebtAction(params: {
  debt_id: string;
  action: "pay_installment" | "amortize";
  monto: number;
  date: string;
  persona: string;
  metodo?: string | null;
  nota?: string | null;
}): { debt: Debt; transaction: Transaction } {
  const index = mockDebts.findIndex((item) => item.id === params.debt_id);
  if (index === -1) {
    throw new Error("Deuda no encontrada");
  }

  const debt = mockDebts[index];
  const interestRate = debt.interest_rate ?? 0;
  const amount = roundCurrency(params.monto);

  const balanceWithInterest =
    params.action === "pay_installment"
      ? accrueMonthlyInterest(debt.balance, interestRate)
      : roundCurrency(debt.balance);

  let newBalance =
    params.action === "pay_installment"
      ? roundCurrency(balanceWithInterest - amount)
      : roundCurrency(Math.max(debt.balance - amount, 0));

  if (newBalance < 0) newBalance = 0;

  let updatedMonthlyPayment = roundCurrency(debt.monthly_payment);

  if (params.action === "amortize" && newBalance > 0) {
    const remainingMonths = calculateRemainingMonths(
      debt.balance,
      Math.max(debt.monthly_payment, 0.01),
      interestRate,
    );

    if (remainingMonths && Number.isFinite(remainingMonths) && remainingMonths > 0) {
      const months = Math.max(1, Math.round(remainingMonths));
      const recalculatedPayment = calculateMonthlyPayment(newBalance, interestRate, months);
      if (recalculatedPayment > 0) {
        updatedMonthlyPayment = roundCurrency(recalculatedPayment);
      }
    }
  }

  let newStatus: Debt["status"] = debt.status;
  if (newBalance <= 0.01) {
    newBalance = 0;
    updatedMonthlyPayment = 0;
    newStatus = "pagada";
  }

  const updatedDebt: Debt = {
    ...debt,
    balance: newBalance,
    monthly_payment: updatedMonthlyPayment,
    status: newStatus,
  };

  mockDebts[index] = updatedDebt;

  const transaction: Transaction = {
    id: id("demo-transaction"),
    household_id: DEMO_HOUSEHOLD_ID,
    date: params.date,
    category: debt.entity,
    tipo: "deuda",
    monto: amount,
    persona: params.persona,
    metodo: params.metodo ?? null,
    nota:
      params.nota ??
      `Pago de deuda: ${debt.entity} - ${params.action === "pay_installment" ? "Cuota" : "Amortización"}`,
    created_at: new Date().toISOString(),
  };

  mockTransactions.unshift(transaction);

  return { debt: { ...updatedDebt }, transaction: { ...transaction } };
}
