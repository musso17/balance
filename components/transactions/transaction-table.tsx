"use client";

import dynamic from "next/dynamic";
import { Fragment, useMemo, useState } from "react";
import { CreditCard, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { groupTransactionsBySection } from "./section-utils";
import { cn } from "@/lib/utils/style";

import { TransactionEditForm } from "./transaction-edit-form";

const MobileTransactionList = dynamic(
  () =>
    import("./transaction-mobile-list").then(
      (mod) => mod.TransactionMobileList,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-muted-foreground backdrop-blur-2xl">
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

  const sections = useMemo(
    () => groupTransactionsBySection(filtered),
    [filtered],
  );

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
    ? "rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-2xl space-y-5"
    : "glass-panel space-y-6 p-4 sm:p-6";

  const Filters = isMobile ? (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => refetch()}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-foreground transition hover:text-primary"
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
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:text-primary sm:w-auto"
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

  let rowIndex = 0;

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
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm text-muted-foreground backdrop-blur-2xl">
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Cargando transacciones...
          </span>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error instanceof Error
            ? error.message
            : "Error al cargar las transacciones"}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-muted-foreground backdrop-blur-2xl">
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
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_35px_120px_-70px_rgba(5,10,25,1)] backdrop-blur-2xl">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-left text-sm text-foreground">
                  <colgroup>
                    <col className="w-[120px]" />
                    <col className="w-[210px]" />
                    <col />
                    <col className="w-[140px]" />
                    <col className="w-[130px]" />
                    <col className="w-[130px]" />
                    <col className="w-[130px]" />
                  </colgroup>
                  <thead className="bg-white/5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#60A5FA] border-b border-[#3B82F6]/40">
                    <tr>
                      <th className="px-4 py-4 text-start first:pl-6">Fecha</th>
                      <th className="px-4 py-4 text-start">Categoría</th>
                      <th className="px-4 py-4 text-start">Nota</th>
                      <th className="px-4 py-4 text-start">Persona</th>
                      <th className="px-4 py-4 text-right">Monto</th>
                      <th className="px-4 py-4 text-right">Método</th>
                      <th className="px-4 py-4 text-right last:pr-6">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-transparent text-sm text-foreground">
                    {sections.map((section) => (
                      <Fragment key={`${section.label}-${section.sortKey}`}>
                        <tr className="bg-white/5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/90">
                          <td colSpan={7} className="px-6 py-3">
                            {section.label}
                          </td>
                        </tr>
                        {section.items.map((transaction) => (
                          <Row
                            key={transaction.id}
                            transaction={transaction}
                            onEdit={() => setEditingTransaction(transaction)}
                            onDelete={() => handleDelete(transaction)}
                            isDeleting={deletingId === transaction.id}
                            rowIndex={rowIndex++}
                          />
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
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
  rowIndex,
}: {
  transaction: Tables<'transactions'>;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  rowIndex: number;
}) {
  const isIncome = transaction.tipo === "ingreso";
  const cellBase = "px-4 py-4 align-middle first:pl-6 last:pr-6";
  const categoryLabel = transaction.category || "Sin categoría";

  return (
    <tr
      className={cn(
        "transition-all duration-200 hover:translate-x-1 hover:bg-[#3B82F6]/10",
        rowIndex % 2 === 0 ? "bg-white/5" : "bg-transparent",
      )}
    >
      <td className={`${cellBase} whitespace-nowrap text-xs uppercase tracking-wide text-muted-foreground/80`}>
        {formatDate(transaction.date)}
      </td>
      <td className={`${cellBase} text-base font-semibold text-foreground`}>
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", getCategoryBadgeClasses(categoryLabel))}>
          {categoryLabel}
        </span>
      </td>
      <td className={`${cellBase} max-w-[320px] text-sm leading-relaxed text-muted-foreground/90 break-words`}>
        {transaction.nota ?? "—"}
      </td>
      <td className={`${cellBase} text-xs uppercase tracking-wide text-muted-foreground`}>
        {transaction.persona}
      </td>
      <td
        className={`${cellBase} text-right text-base font-semibold ${isIncome ? "text-emerald-200" : "text-rose-300"}`}
      >
        {formatCurrency(transaction.monto)}
      </td>
      <td className={`${cellBase} text-right text-[11px] uppercase tracking-wide text-muted-foreground`}>
        {transaction.metodo ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground/80">
            <CreditCard className="size-3.5" />
            {transaction.metodo}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className={`${cellBase} text-right`}>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground/90 shadow-inner transition hover:border-sky-300/60 hover:bg-sky-400/20 hover:text-sky-100"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-muted-foreground/90 shadow-inner transition hover:border-rose-300/60 hover:bg-rose-400/20 hover:text-rose-200 disabled:cursor-not-allowed"
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

function getCategoryBadgeClasses(category: string) {
  const palettes = [
    "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20",
    "bg-sky-500/15 text-sky-200 border border-sky-400/20",
    "bg-amber-500/15 text-amber-100 border border-amber-400/20",
    "bg-rose-500/15 text-rose-200 border border-rose-400/20",
    "bg-violet-500/15 text-violet-200 border border-violet-400/20",
  ];
  const base = category?.charCodeAt(0) ?? 0;
  const index = Math.abs(base + (category?.length ?? 0)) % palettes.length;
  return palettes[index];
}
