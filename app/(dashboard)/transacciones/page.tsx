import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionTable } from "@/components/transactions/transaction-table";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          Registro de transacciones
        </h2>
        <p className="text-sm text-muted-foreground">
          Añade ingresos o gastos y revisa el historial del mes para ambos
          integrantes.
        </p>
      </div>
      <TransactionForm />
      <TransactionTable />
    </div>
  );
}
