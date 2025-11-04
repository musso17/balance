"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";

import { formatCurrency } from "@/lib/utils/number";
import { formatDate } from "@/lib/utils/date";
import type { Transaction } from "@/types/database";

interface TransactionMobileListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
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
            className="rounded-xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur transition hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Categoría
                </span>
                <span className="text-base font-semibold text-foreground">
                  {transaction.category}
                </span>
              </div>
              <span
                className={`text-sm font-semibold ${isIncome ? "text-emerald-600" : "text-rose-500"}`}
              >
                {formatCurrency(transaction.monto)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <Field label="Fecha" value={formatDate(transaction.date)} />
              <Field label="Persona" value={transaction.persona} />
              <Field label="Tipo" value={tipoLabel} />
              <Field label="Método" value={transaction.metodo ?? "—"} />
            </div>

            {transaction.nota && (
              <div className="mt-3 rounded-lg bg-white/60 p-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">Nota:</span>{" "}
                {transaction.nota}
              </div>
            )}

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onEdit(transaction)}
                className="inline-flex items-center gap-1 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-primary"
              >
                <Pencil className="size-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => !isDeleting && onDelete(transaction)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition hover:text-rose-500 disabled:cursor-not-allowed"
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
