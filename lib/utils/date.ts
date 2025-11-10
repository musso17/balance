import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function monthKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const parsed = new Date(Number(year), Number(month) - 1, 1);

  return format(parsed, "MMMM yyyy", { locale: es });
}

export function formatDate(date: string | Date) {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "dd MMM", { locale: es });
}

export function getLocalISODateString(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
