"use client";

import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { useCreateDebt } from "@/hooks/use-debts";
import { formatCurrency } from "@/lib/utils/number";

import { debtSchema, type DebtFormValues } from "./schema";

export function DebtForm() {
  const mutation = useCreateDebt();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema) as unknown as Resolver<DebtFormValues>,
    defaultValues: {
      status: "activa",
    },
  });

  const balance = useWatch({ control, name: "balance" }) ?? 0;
  const monthly = useWatch({ control, name: "monthly_payment" }) ?? 0;
  const isBalloon = useWatch({ control, name: "is_balloon" });
  const installments = useWatch({ control, name: "installments" }) ?? 0;
  const balloonPayment = useWatch({ control, name: "balloon_payment" }) ?? 0;

  // Auto-calculate balance when in balloon mode
  // Effect to update balance when inputs change
  // We can't use useEffect easily inside the render loop with setValue unless we are careful.
  // Better to handle it in onChange handlers or a useEffect.
  // Let's use onChange in the inputs for simplicity and direct feedback.

  const onSubmit = async (values: DebtFormValues) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { installments, balloon_payment, is_balloon, ...payload } = values;
      await mutation.mutateAsync(payload);
      toast.success("Deuda registrada con éxito.");
      reset({ entity: "", balance: undefined, monthly_payment: undefined, interest_rate: undefined, installments: undefined, status: "activa" });
    } catch (error) {
      console.error("[debts] create", error);
      toast.error("No pudimos registrar la deuda.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-panel space-y-6 p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          id="is_balloon"
          {...register("is_balloon")}
          className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
        />
        <label htmlFor="is_balloon" className="text-sm font-medium text-foreground cursor-pointer">
          ¿Tiene cuota final (Balón)?
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Entidad" error={errors.entity?.message}>
          <input
            type="text"
            placeholder="Banco, tarjeta o prestamista"
            {...register("entity")}
            className="soft-input"
          />
        </Field>
        <Field label="Saldo restante / Total" error={errors.balance?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("balance", {
              onChange: (e) => {
                const val = parseFloat(e.target.value);
                const monthly = getValues("monthly_payment");

                if (isBalloon) {
                  const balloon = getValues("balloon_payment") || 0;
                  if (val && monthly) {
                    // (monthly * installments) + balloon = balance
                    // monthly * installments = balance - balloon
                    // installments = (balance - balloon) / monthly
                    const calculatedInstallments = (val - balloon) / monthly;
                    setValue("installments", Number(Math.max(0, calculatedInstallments).toFixed(1)));
                  }
                } else {
                  if (val && monthly) {
                    setValue("installments", Number((val / monthly).toFixed(1)));
                  }
                }
              },
            })}
            className="soft-input"
          />
        </Field>
        <Field label={isBalloon ? "Monto Cuota Fija" : "Pago mensual"} error={errors.monthly_payment?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("monthly_payment", {
              onChange: (e) => {
                const val = parseFloat(e.target.value);
                if (isBalloon) {
                  const inst = getValues("installments") || 0;
                  const ball = getValues("balloon_payment") || 0;
                  setValue("balance", (val * inst) + ball);
                } else {
                  const bal = getValues("balance");
                  if (val && bal) {
                    setValue("installments", Number((bal / val).toFixed(1)));
                  }
                }
              },
            })}
            className="soft-input"
          />
        </Field>
        <Field label="Cuotas restantes" error={errors.installments?.message}>
          <input
            type="number"
            step="1"
            placeholder="0"
            {...register("installments", {
              onChange: (e) => {
                const val = parseFloat(e.target.value);
                if (isBalloon) {
                  const monthly = getValues("monthly_payment") || 0;
                  const ball = getValues("balloon_payment") || 0;
                  setValue("balance", (monthly * val) + ball);
                } else {
                  const bal = getValues("balance");
                  if (val && bal) {
                    setValue("monthly_payment", Number((bal / val).toFixed(2)));
                  }
                }
              },
            })}
            className="soft-input"
          />
        </Field>

        {isBalloon && (
          <Field label="Monto Cuota Balón" error={errors.balloon_payment?.message}>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("balloon_payment", {
                onChange: (e) => {
                  const val = parseFloat(e.target.value);
                  const monthly = getValues("monthly_payment") || 0;
                  const inst = getValues("installments") || 0;
                  setValue("balance", (monthly * inst) + val);
                },
              })}
              className="soft-input"
            />
          </Field>
        )}
        <Field label="Tasa de interés (%)" error={errors.interest_rate?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("interest_rate")}
            className="soft-input"
          />
        </Field>
      </div>

      <Field label="Estado" error={errors.status?.message}>
        <select
          {...register("status")}
          className="soft-input"
        >
          <option value="activa">Activa</option>
          <option value="pagada">Pagada</option>
          <option value="morosa">Morosa</option>
        </select>
      </Field>

      <div className="subdued-card border-dashed px-4 py-3 text-sm text-muted-foreground">
        Estás destinando{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(monthly || 0)}
        </span>{" "}
        al mes para reducir un saldo de{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(balance || 0)}
        </span>
        .
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="cta-button w-full disabled:cursor-not-allowed"
      >
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Guardar deuda
      </button>

    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
