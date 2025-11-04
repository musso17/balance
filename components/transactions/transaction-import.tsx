"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useDashboardStore } from "@/store/dashboard-store";
import {
  useImportTransactions,
  type CreateTransactionInput,
} from "@/hooks/use-transactions";

interface ParsedRow extends Omit<CreateTransactionInput, "monto"> {
  monto: number;
}

const templateHeaders = [
  "date",
  "category",
  "monto",
  "persona",
  "tipo",
  "nota",
  "metodo",
] as const;

export function TransactionImport() {
  const { monthKey } = useDashboardStore();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mutation = useImportTransactions();

  const handleFile = (file: File) => {
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const message = "No pudimos leer el archivo. Revisa el formato.";
          setError(message);
          toast.error(message);
          return;
        }

        const parsed = (results.data as Record<string, string>[]).map((row) => {
          const monto = parseFloat(row.monto ?? "0");
          const tipo =
            row.tipo?.toLowerCase() === "ingreso" ? "ingreso" : "gasto";

          return {
            date: row.date ? row.date : `${monthKey}-01`,
            category: row.category ?? "Sin categoría",
            monto: Number.isFinite(monto) ? monto : 0,
            persona: row.persona ?? "Marcelo",
            tipo,
            nota: row.nota ?? null,
            metodo: row.metodo ?? null,
          } satisfies ParsedRow;
        });

        setRows(parsed);
      },
      error: () => {
        const message = "Error al procesar el archivo. Intenta nuevamente.";
        setError(message);
        toast.error(message);
      },
    });
  };

  const handleImport = async () => {
    if (rows.length === 0) return;

    try {
      const result = await mutation.mutateAsync(
        rows.map((row) => ({
          ...row,
          monto: row.monto,
        })),
      );
      setRows([]);
      if (result.imported > 0) {
        toast.success(`${result.imported} transacciones importadas correctamente.`);
      } else {
        toast.info("No se importaron nuevas transacciones.");
      }
    } catch (err) {
      console.error("[transactions] import", err);
      const message = err instanceof Error ? err.message : "No pudimos importar las transacciones.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Importar desde CSV
          </h3>
          <p className="text-sm text-muted-foreground">
            Sube un archivo CSV para registrar múltiples transacciones a la vez.
          </p>
        </div>
        <a
          href="/templates/transacciones.csv"
          download
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground underline"
        >
          <FileSpreadsheet className="size-4" />
          Descargar plantilla
        </a>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-semibold">Formato esperado:</span> un archivo CSV con las columnas: <code>date</code>, <code>category</code>, <code>monto</code>, <code>persona</code>, <code>tipo</code>, <code>nota</code>, <code>metodo</code>.</p>
        <p><span className="font-semibold">Notas:</span> La columna <code>date</code> debe tener el formato <code>YYYY-MM-DD</code>. La columna <code>tipo</code> debe ser <code>ingreso</code> o <code>gasto</code>.</p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground transition hover:border-foreground/20 hover:text-foreground">
        <UploadCloud className="size-6" />
        <span>
          Arrastra tu CSV o{" "}
          <span className="font-semibold text-foreground">
            haz clic para seleccionarlo
          </span>
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleFile(file);
            }
          }}
          className="hidden"
        />
      </label>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-foreground">
              Listas {rows.length} transacciones para importar.
            </p>
            <button
              onClick={handleImport}
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Importar todo
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border/70">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  {templateHeaders.map((header) => (
                    <th key={header} className="px-3 py-2 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((row, index) => (
                  <tr key={`${row.category}-${index}`}>
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.monto.toFixed(2)}</td>
                    <td className="px-3 py-2">{row.persona}</td>
                    <td className="px-3 py-2">{row.tipo}</td>
                    <td className="px-3 py-2">{row.nota ?? "—"}</td>
                    <td className="px-3 py-2">{row.metodo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
