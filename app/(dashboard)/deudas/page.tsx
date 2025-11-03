import { DebtForm } from "@/components/debts/debt-form";
import { DebtList } from "@/components/debts/debt-list";

export default function DebtsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Compromisos financieros
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          Deudas y obligaciones
        </h2>
        <p className="text-sm text-muted-foreground">
          Registra créditos, préstamos o tarjetas para medir su impacto mensual.
        </p>
      </div>
      <DebtForm />
      <DebtList />
    </div>
  );
}

