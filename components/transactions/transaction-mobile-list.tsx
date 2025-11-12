"use client";

import { useMemo } from "react";
import { ChevronRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { formatCurrency } from "@/lib/utils/number";
import type { Tables } from "@/lib/database.types";
import {
  capitalizeWord,
  groupTransactionsBySection,
} from "./section-utils";

interface TransactionMobileListProps {
  transactions: Tables<'transactions'>[];
  onEdit: (transaction: Tables<'transactions'>) => void;
  onDelete: (transaction: Tables<'transactions'>) => void;
  deletingId: string | null;
}

export function TransactionMobileList({
  transactions,
  onEdit,
  onDelete,
  deletingId,
}: TransactionMobileListProps) {
  const sections = useMemo(
    () => groupTransactionsBySection(transactions),
    [transactions],
  );

  return (
    <div className="space-y-5">
      {sections.map(({ label, items }) => (
        <section
          key={label}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-xl"
        >
          <header className="border-b border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </header>
          <ul className="divide-y divide-white/5">
            {items.map((transaction) => {
              const isIncome = transaction.tipo === "ingreso";
              const isDeleting = deletingId === transaction.id;

              return (
                <li key={transaction.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-muted-foreground">
                      {getTransactionInitial(transaction)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {getTransactionTitle(transaction)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatLongDate(transaction.date)} · {transaction.persona}
                      </p>
                      {transaction.metodo && (
                        <p className="text-[11px] text-muted-foreground/80">
                          {transaction.metodo}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-sm font-semibold ${isIncome ? "text-emerald-200" : "text-rose-300"}`}
                        >
                          {formatCurrency(transaction.monto)}
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(transaction)}
                          className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground shadow-sm transition hover:text-primary"
                          aria-label="Editar transacción"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => !isDeleting && onDelete(transaction)}
                          disabled={isDeleting}
                          className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground shadow-sm transition hover:text-rose-400 disabled:cursor-not-allowed"
                          aria-label="Eliminar transacción"
                        >
                          {isDeleting ? (
                            <Loader2 className="size-4 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function formatLongDate(dateString: string) {
  const formatted = format(parseISO(dateString), "dd MMMM", { locale: es });
  const [day, ...rest] = formatted.split(" ");
  const month = rest.join(" ");
  return month ? `${day} ${capitalizeWord(month)}` : capitalizeWord(formatted);
}

function getTransactionInitial(transaction: Tables<'transactions'>) {
  const source = transaction.nota?.trim() || transaction.category || transaction.persona;
  return source?.charAt(0).toUpperCase() ?? "·";
}

function getTransactionTitle(transaction: Tables<'transactions'>) {
  return transaction.nota?.trim() || transaction.category || "Sin descripción";
}
