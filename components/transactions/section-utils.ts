import { format, isThisMonth, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import type { Tables } from "@/lib/database.types";

export type TransactionSection = {
  label: string;
  sortKey: string;
  items: Tables<'transactions'>[];
};

export function capitalizeWord(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getSectionLabel(dateString: string) {
  const date = parseISO(dateString);
  if (isToday(date)) return "Hoy";
  if (isThisMonth(date)) return "Este mes";
  const formatted = format(date, "MMMM yyyy", { locale: es }).split(" ");
  if (formatted.length >= 2) {
    const [month, year] = formatted;
    return `${capitalizeWord(month)} ${year}`;
  }
  return capitalizeWord(formatted[0] ?? "");
}

export function groupTransactionsBySection(
  transactions: Tables<'transactions'>[],
): TransactionSection[] {
  const map = new Map<string, TransactionSection>();

  for (const transaction of transactions) {
    const label = getSectionLabel(transaction.date);
    const existing = map.get(label);

    if (existing) {
      existing.items.push(transaction);
      if (transaction.date > existing.sortKey) {
        existing.sortKey = transaction.date;
      }
    } else {
      map.set(label, {
        label,
        items: [transaction],
        sortKey: transaction.date,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.label === "Hoy" && b.label !== "Hoy") return -1;
    if (b.label === "Hoy" && a.label !== "Hoy") return 1;
    return b.sortKey.localeCompare(a.sortKey);
  });
}
