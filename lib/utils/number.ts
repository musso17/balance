const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const currencyFormatterNoDecimals = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCurrencyNoDecimals(value: number) {
  return currencyFormatterNoDecimals.format(value);
}

export function calculateBalance(incomes: number, expenses: number) {
  return incomes - expenses;
}
