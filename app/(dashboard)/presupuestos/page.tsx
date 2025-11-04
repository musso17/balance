import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetList } from "@/components/budgets/budget-list";
import { MonthHeading } from "@/components/budgets/month-heading";

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <MonthHeading />
        <h2 className="text-lg font-semibold text-foreground">
          Planificación de presupuestos
        </h2>
        <p className="text-sm text-muted-foreground">
          Define los límites por categoría y haz seguimiento al gasto real.
        </p>
      </div>
      <BudgetList />
      <BudgetForm />
    </div>
  );
}
