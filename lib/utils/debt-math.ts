/**
 * Helper utilities to handle amortization math for debts.
 * All calculations are rounded to two decimals to avoid floating point drift.
 */

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMonthlyRate(annualRate?: number | null): number {
  if (!annualRate || Number.isNaN(annualRate)) {
    return 0;
  }
  return annualRate / 12 / 100;
}

export function accrueMonthlyInterest(balance: number, annualRate?: number | null): number {
  const monthlyRate = toMonthlyRate(annualRate);
  if (monthlyRate <= 0) {
    return roundCurrency(balance);
  }
  return roundCurrency(balance * (1 + monthlyRate));
}

export function calculateRemainingMonths(
  balance: number,
  monthlyPayment: number,
  annualRate?: number | null,
): number | null {
  if (monthlyPayment <= 0 || balance <= 0) {
    return null;
  }

  const monthlyRate = toMonthlyRate(annualRate);

  if (monthlyRate <= 0) {
    return balance / monthlyPayment;
  }

  const interestPortion = monthlyRate * balance;
  if (monthlyPayment <= interestPortion) {
    return null;
  }

  const numerator = Math.log(monthlyPayment / (monthlyPayment - interestPortion));
  const denominator = Math.log(1 + monthlyRate);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number | null | undefined,
  months: number,
): number {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = toMonthlyRate(annualRate);

  if (monthlyRate <= 0) {
    return roundCurrency(principal / months);
  }

  const factor = (1 + monthlyRate) ** months;
  if (factor === 1) {
    return roundCurrency(principal / months);
  }

  const payment = principal * ((monthlyRate * factor) / (factor - 1));
  return roundCurrency(payment);
}

