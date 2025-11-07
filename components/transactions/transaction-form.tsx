"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useCreateTransaction } from "@/hooks/use-transactions";
import { useActiveDebts, useDebtAction } from "@/hooks/use-debts";
import { formatCurrencyNoDecimals } from "@/lib/utils/number";
import { useMediaQuery } from "@/hooks/use-media-query";

import {
  incomeCategoryOptions,
  expenseCategoryOptions,
  metodosOptions,
  personasOptions,
  transactionSchema,
  type TransactionFormValues,
  isIncomeCategory,
  isExpenseCategory,
} from "./schema";

export function TransactionForm() {
  const mutation = useCreateTransaction();
  const debtActionMutation = useDebtAction();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const {
    register,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver:
      zodResolver(transactionSchema) as unknown as Resolver<TransactionFormValues>,
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      tipo: "gasto",
      metodo: "Yape",
    },
  });

  const transactionType = watch("tipo");
  const selectedDebtId = watch("debt_id");
  const debtAction = watch("debt_action");
  const categoryValue = watch("category");
  const { data: activeDebts, isLoading: isLoadingActiveDebts } = useActiveDebts();
  const availableCategories =
    transactionType === "ingreso" ? incomeCategoryOptions : expenseCategoryOptions;

  const selectedDebt = useMemo(
    () => activeDebts?.find((debt) => debt.id === selectedDebtId) ?? null,
    [activeDebts, selectedDebtId],
  );

  const isDebtTransaction = transactionType === "deuda";

  useEffect(() => {
    if (!isDebtTransaction) {
      setValue("debt_id", undefined, { shouldValidate: true });
      setValue("debt_action", undefined, { shouldValidate: true });
      return;
    }

    if (selectedDebt) {
      setValue("category", selectedDebt.entity, { shouldValidate: true });
    } else {
      setValue("category", "", { shouldValidate: true });
    }
  }, [isDebtTransaction, selectedDebt, setValue]);

  useEffect(() => {
    if (isDebtTransaction) return;
    if (!categoryValue) return;

    const isValid =
      transactionType === "ingreso"
        ? isIncomeCategory(categoryValue)
        : isExpenseCategory(categoryValue);

    if (!isValid) {
      setValue("category", "", { shouldValidate: true });
    }
  }, [categoryValue, isDebtTransaction, transactionType, setValue]);

  useEffect(() => {
    if (!isDebtTransaction || !selectedDebt) return;
    if (debtAction === undefined) {
      setValue("debt_action", "pay_installment");
    }
    if ((debtAction ?? "pay_installment") === "pay_installment") {
      setValue("monto", selectedDebt.monthly_payment, { shouldValidate: true });
    }
  }, [isDebtTransaction, selectedDebt, debtAction, setValue]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      if (values.tipo === "deuda") {
        if (!selectedDebt) {
          toast.error("Selecciona una deuda activa.");
          return;
        }

        const action = values.debt_action ?? "pay_installment";
        const amount =
          action === "pay_installment"
            ? selectedDebt.monthly_payment
            : values.monto;

        await debtActionMutation.mutateAsync({
          debt_id: selectedDebt.id,
          action,
          monto: amount,
          date: values.date,
          persona: values.persona,
          metodo: values.metodo ?? null,
          nota: values.nota ?? null,
        });
      } else {
        const payload = {
          ...values,
          category: values.category ?? "",
          metodo: values.metodo ?? null,
          nota: values.nota ?? null,
        };

        await mutation.mutateAsync(payload);
      }

      toast.success("Transacción registrada con éxito.");
      reset({
        date: values.date,
        category: "",
        monto: 0,
        persona: values.persona,
        tipo: values.tipo,
        metodo: values.metodo,
        debt_id: undefined,
        debt_action: undefined,
        nota: "",
      });
    } catch (error) {
      console.error("[transactions] create", error);
      toast.error("No pudimos registrar la transacción.");
    }
  };

  const FormFields = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tipo" error={errors.tipo?.message}>
          <select
            {...register("tipo")}
            className="soft-input"
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
            <option value="deuda">Deuda</option>
          </select>
        </Field>

        <Field label="Fecha" error={errors.date?.message}>
          <input
            type="date"
            {...register("date")}
            className="soft-input"
          />
        </Field>

        {transactionType !== "deuda" && (
          <Field label="Categoría" error={errors.category?.message}>
            <select
              {...register("category")}
              className="soft-input"
            >
              <option value="">Selecciona una categoría</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
        )}

        {isDebtTransaction && (
          <div className="md:col-span-2 rounded-2xl border border-white/50 bg-white/60 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-foreground">
              {selectedDebt ? selectedDebt.entity : "Selecciona una deuda"}
            </p>
            {selectedDebt && (
              <p className="text-xs">
                Saldo actual {formatCurrencyNoDecimals(selectedDebt.balance)}
              </p>
            )}
          </div>
        )}

        <Field label="Monto" error={errors.monto?.message}>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("monto")}
            className="soft-input"
            readOnly={isDebtTransaction && (debtAction ?? "pay_installment") === "pay_installment"}
          />
        </Field>

        <Field label="Persona" error={errors.persona?.message}>
          <select
            {...register("persona")}
            className="soft-input"
          >
            <option value="">Selecciona</option>
            {personasOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>

        {isDebtTransaction && (
          <Field label="Deuda" error={errors.debt_id?.message}>
            <select
              {...register("debt_id")}
              className="soft-input"
              disabled={isLoadingActiveDebts}
            >
              <option value="">Selecciona una deuda</option>
              {activeDebts?.map((debt) => (
                <option key={debt.id} value={debt.id}>
                  {debt.entity} · {formatCurrencyNoDecimals(debt.balance)}
                </option>
              ))}
            </select>
          </Field>
        )}

        {isDebtTransaction && selectedDebt && (
          <Field label="Acción" error={errors.debt_action?.message}>
            <select
              {...register("debt_action")}
              className="soft-input"
            >
              <option value="">Selecciona una acción</option>
              <option value="pay_installment">Pagar cuota</option>
              <option value="amortize">Amortizar</option>
            </select>
          </Field>
        )}

        {transactionType !== "ingreso" && (
          <Field label="Método de pago" error={errors.metodo?.message}>
            <select
              {...register("metodo")}
              className="soft-input"
            >
              <option value="">Selecciona</option>
              {metodosOptions.map((metodo) => (
                <option key={metodo} value={metodo}>
                  {metodo}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field label="Nota" error={errors.nota?.message}>
        <textarea
          rows={3}
          placeholder="Contexto, acuerdos o recordatorios"
          {...register("nota")}
          className="soft-input"
        />
      </Field>
    </>
  );

  const submitButton = (
    <button
      type="submit"
      disabled={mutation.isPending || debtActionMutation.isPending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {(mutation.isPending || debtActionMutation.isPending) && (
        <Loader2 className="size-4 animate-spin" />
      )}
      Registrar transacción
    </button>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-panel space-y-6 p-4 sm:p-6"
    >
      <FormFields />
      {submitButton}
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
