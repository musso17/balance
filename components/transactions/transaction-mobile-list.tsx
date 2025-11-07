"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils/number";
import { formatDate } from "@/lib/utils/date";
import type { Tables } from "@/lib/database.types";

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
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 shadow-lg shadow-slate-900/5 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Fecha · Categoría</span>
        <span>Monto</span>
      </div>
      <div className="divide-y divide-slate-100/80">
        {transactions.map((transaction) => {
          const isIncome = transaction.tipo === "ingreso";
          const isDeleting = deletingId === transaction.id;
          const tipoLabel =
            transaction.tipo.charAt(0).toUpperCase() + transaction.tipo.slice(1);

          return (
            <article key={transaction.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatDate(transaction.date)}
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {transaction.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.persona} · {transaction.metodo ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`block text-sm font-semibold sm:text-base ${isIncome ? "text-emerald-600" : "text-rose-500"}`}
                  >
                    {formatCurrency(transaction.monto)}
                  </span>
                  <span
                    className={`mt-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                  >
                    {tipoLabel}
                  </span>
                </div>
              </div>

              {transaction.nota && (
                <p className="mt-3 rounded-2xl bg-slate-50/70 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Nota:</span>{" "}
                  <span className="text-foreground/80">{transaction.nota}</span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(transaction)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-primary"
                >
                  <Pencil className="size-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => !isDeleting && onDelete(transaction)}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-rose-500 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Eliminando
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
