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
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isIncome = transaction.tipo === "ingreso";
        const isDeleting = deletingId === transaction.id;
        const tipoLabel =
          transaction.tipo.charAt(0).toUpperCase() + transaction.tipo.slice(1);

        return (
          <article
            key={transaction.id}
            className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  Categoría
                </p>
                <p className="text-base font-semibold text-foreground">
                  {transaction.category}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-semibold ${isIncome ? "text-emerald-600" : "text-rose-500"}`}
                >
                  {formatCurrency(transaction.monto)}
                </span>
                <div
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                >
                  {tipoLabel}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <Field label="Fecha" value={formatDate(transaction.date)} />
              <Field label="Persona" value={transaction.persona} />
              <Field label="Tipo" value={tipoLabel} />
              <Field label="Método" value={transaction.metodo ?? "—"} />
            </div>

            {transaction.nota && (
              <div className="mt-3 rounded-2xl bg-slate-50/80 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">Nota:</span>{" "}
                <span className="text-foreground/80">{transaction.nota}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                className="inline-flex items-center justify-center gap-1 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-primary"
              >
                <Pencil className="size-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => !isDeleting && onDelete(transaction)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-1 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-rose-500 disabled:cursor-not-allowed"
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
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
