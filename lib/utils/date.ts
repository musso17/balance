import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function monthKeyFromDate(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const parsed = parseISO(`${year}-${month}-01T00:00:00.000Z`);

  return format(parsed, "MMMM yyyy", { locale: es });
}

export function formatDate(date: string | Date) {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "dd MMM", { locale: es });
}

