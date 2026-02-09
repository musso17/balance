import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { MonthSelector } from "@/components/ui/month-selector";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 pr-14 sm:flex-row sm:items-center sm:justify-between sm:pr-16">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Registro de transacciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Añade ingresos o gastos y revisa el historial del mes para ambos
            integrantes.
          </p>
        </div>
        <MonthSelector />
      </div>
      <TransactionForm />
      <TransactionTable />
    </div>
  );
}
