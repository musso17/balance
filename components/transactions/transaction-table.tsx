"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboard-store";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils/number";
import { formatDate } from "@/lib/utils/date";
import type { Transaction } from "@/types/database";

import { TransactionEditForm } from "./transaction-edit-form";

const personas = ["Todos", "Persona A", "Persona B", "Compartido"];
const tipos = ["Todos", "Ingreso", "Gasto"];

export function TransactionTable() {
  const { monthKey } = useDashboardStore();
  const { data, isLoading, isError, error } = useTransactions(monthKey);
  const [personaFilter, setPersonaFilter] = useState("Todos");
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteMutation = useDeleteTransaction();

  const filtered = useMemo(() => {
    if (!data) return [];

    return data.filter((transaction) => {
      const matchesPersona =
        personaFilter === "Todos" ||
        transaction.persona.toLowerCase() === personaFilter.toLowerCase();
      const matchesTipo =
        tipoFilter === "Todos" ||
        transaction.tipo === tipoFilter.toLowerCase();
      return matchesPersona && matchesTipo;
    });
  }, [data, personaFilter, tipoFilter]);

  return (
    <div className="space-y-5 rounded-2xl border border-border/70 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Historial del mes
          </h3>
          <p className="text-xs text-muted-foreground">
            Filtra por persona o tipo para revisar los detalles.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <select
            value={personaFilter}
            onChange={(event) => setPersonaFilter(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            {personas.map((persona) => (
              <option key={persona}>{persona}</option>
            ))}
          </select>
          <select
            value={tipoFilter}
            onChange={(event) => setTipoFilter(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-foreground/30 focus:ring-2 focus:ring-foreground/20"
          >
            {tipos.map((tipo) => (
              <option key={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </header>

      {isLoading && (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-border">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando transacciones...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error instanceof Error
            ? error.message
            : "Error al cargar las transacciones"}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No hay transacciones que coincidan con los filtros seleccionados.
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Categoría</th>
                <th className="py-2 pr-4">Nota</th>
                <th className="py-2 pr-4">Persona</th>
                <th className="py-2 pr-4 text-right">Monto</th>
                <th className="py-2 text-right">Método</th>
                <th className="py-2 pl-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filtered.map((transaction) => (
                <Row
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={() => setEditingTransaction(transaction)}
                  onDelete={async () => {
                    if (deletingId) return;
                    const confirmDelete = window.confirm(
                      "¿Seguro que deseas eliminar esta transacción?",
                    );

                    if (!confirmDelete) return;

                    try {
                      setDeletingId(transaction.id);
                      await deleteMutation.mutateAsync(transaction.id);
                      toast.success("Transacción eliminada");
                    } catch (err) {
                      console.error("[transactions] delete", err);
                      toast.error("No pudimos eliminar la transacción");
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  isDeleting={deletingId === transaction.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingTransaction && (
        <TransactionEditForm
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}

function Row({
  transaction,
  onEdit,
  onDelete,
  isDeleting,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isIncome = transaction.tipo === "ingreso";

  return (
    <tr className="transition hover:bg-muted/60">
      <td className="whitespace-nowrap py-2 pr-4 text-xs text-muted-foreground">
        {formatDate(transaction.date)}
      </td>
      <td className="py-2 pr-4 font-medium text-foreground">
        {transaction.category}
      </td>
      <td className="max-w-md truncate py-2 pr-4 text-xs text-muted-foreground">
        {transaction.nota ?? "—"}
      </td>
      <td className="py-2 pr-4 text-xs uppercase tracking-wide text-muted-foreground">
        {transaction.persona}
      </td>
      <td
        className={`py-2 pr-4 text-right font-semibold ${
          isIncome ? "text-emerald-600" : "text-foreground"
        }`}
      >
        {formatCurrency(transaction.monto)}
      </td>
      <td className="py-2 text-right text-xs text-muted-foreground">
        {transaction.metodo ?? "—"}
      </td>
      <td className="py-2 pl-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:border-rose-300 hover:text-rose-600 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
