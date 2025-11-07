"use client";

import dynamic from "next/dynamic";
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
import type { Tables } from "@/lib/database.types";
import { useMediaQuery } from "@/hooks/use-media-query";

import { TransactionEditForm } from "./transaction-edit-form";

const MobileTransactionList = dynamic(
  () =>
    import("./transaction-mobile-list").then(
      (mod) => mod.TransactionMobileList,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-dashed border-white/60 bg-white/50 p-4 text-sm text-muted-foreground">
        Preparando vista móvil...
      </div>
    ),
  },
);

const personas = ["Todos", "Marcelo", "Ana", "Compartido"];
const tipos = ["Todos", "Ingreso", "Gasto", "Deuda"];

export function TransactionTable() {
  const { monthKey } = useDashboardStore();
  const { data, isLoading, isError, error, refetch } = useTransactions(monthKey);
  const [tipoFilter, setTipoFilter] = useState("Todos");
  const [personaFilter, setPersonaFilter] = useState("Todos");
  const [editingTransaction, setEditingTransaction] = useState<Tables<'transactions'> | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteMutation = useDeleteTransaction();
  const isMobile = useMediaQuery("(max-width: 767px)");

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

  const handleDelete = async (transaction: Tables<'transactions'>) => {
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
  };

  const containerClass = isMobile
    ? "rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-lg shadow-slate-900/5 backdrop-blur space-y-5"
    : "glass-panel space-y-6 p-4 sm:p-6";

  const Filters = isMobile ? (
    <div className="rounded-2xl border border-white/60 bg-white/60 p-3 shadow-sm">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900/5 px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-slate-900/10"
        >
          Refrescar datos
        </button>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          Persona
          <select
            value={personaFilter}
            onChange={(event) => setPersonaFilter(event.target.value)}
            className="soft-input mt-1 text-sm"
          >
            {personas.map((persona) => (
              <option key={persona}>{persona}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          Tipo
          <select
            value={tipoFilter}
            onChange={(event) => setTipoFilter(event.target.value)}
            className="soft-input mt-1 text-sm"
          >
            {tipos.map((tipo) => (
              <option key={tipo}>{tipo}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  ) : (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <button
        onClick={() => refetch()}
        className="w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:text-primary sm:w-auto"
      >
        Refrescar
      </button>
      <select
        value={personaFilter}
        onChange={(event) => setPersonaFilter(event.target.value)}
        className="soft-input w-full sm:w-auto"
      >
        {personas.map((persona) => (
          <option key={persona}>{persona}</option>
        ))}
      </select>
      <select
        value={tipoFilter}
        onChange={(event) => setTipoFilter(event.target.value)}
        className="soft-input w-full sm:w-auto"
      >
        {tipos.map((tipo) => (
          <option key={tipo}>{tipo}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className={containerClass}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Historial del mes
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Filtra por persona o tipo para revisar los detalles.
          </p>
        </div>
        {!isMobile && Filters}
      </header>
      {isMobile && Filters}

      {isLoading && (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/60 bg-white/40 text-sm text-muted-foreground backdrop-blur">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando transacciones...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-100/70 px-4 py-3 text-sm text-rose-600">
          {error instanceof Error
            ? error.message
            : "Error al cargar las transacciones"}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/60 bg-white/40 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur">
          No hay transacciones que coincidan con los filtros seleccionados.
        </p>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          {isMobile ? (
            <MobileTransactionList
              transactions={filtered}
              deletingId={deletingId}
              onEdit={(transaction) => setEditingTransaction(transaction)}
              onDelete={handleDelete}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/60 bg-white/40 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Fecha</th>
                    <th className="py-3 pr-4 font-medium">Categoría</th>
                    <th className="py-3 pr-4 font-medium">Nota</th>
                    <th className="py-3 pr-4 font-medium">Persona</th>
                    <th className="py-3 pr-4 text-right font-medium">Monto</th>
                    <th className="py-3 text-right font-medium">Método</th>
                    <th className="py-3 pl-4 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/40">
                  {filtered.map((transaction) => (
                    <Row
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={() => setEditingTransaction(transaction)}
                      onDelete={() => handleDelete(transaction)}
                      isDeleting={deletingId === transaction.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
  transaction: Tables<'transactions'>;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const isIncome = transaction.tipo === "ingreso";

  return (
    <tr className="transition-colors hover:bg-white/30">
      <td className="whitespace-nowrap py-3 pr-4 text-xs text-muted-foreground">
        {formatDate(transaction.date)}
      </td>
      <td className="py-3 pr-4 font-medium text-foreground">
        {transaction.category}
      </td>
      <td className="max-w-md truncate py-3 pr-4 text-xs text-muted-foreground">
        {transaction.nota ?? "—"}
      </td>
      <td className="py-3 pr-4 text-xs uppercase tracking-wide text-muted-foreground">
        {transaction.persona}
      </td>
      <td
        className={`py-3 pr-4 text-right font-semibold ${isIncome ? "text-emerald-600" : "text-rose-500"}`}
      >
        {formatCurrency(transaction.monto)}
      </td>
      <td className="py-3 text-right text-xs text-muted-foreground">
        {transaction.metodo ?? "—"}
      </td>
      <td className="py-3 pl-4 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-2xl border border-white/60 bg-white/70 p-1.5 text-muted-foreground shadow-sm transition hover:text-primary"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="rounded-2xl border border-white/60 bg-white/70 p-1.5 text-muted-foreground shadow-sm transition hover:text-rose-500 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
