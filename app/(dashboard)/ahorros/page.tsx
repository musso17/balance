import { SavingForm } from "@/components/savings/saving-form";
import { SavingList } from "@/components/savings/saving-list";

export default function SavingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Plan de ahorro
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          Metas y progreso
        </h2>
        <p className="text-sm text-muted-foreground">
          Organicen sus objetivos y midan cuánto les falta para lograrlos.
        </p>
      </div>
      <SavingForm />
      <SavingList />
    </div>
  );
}

