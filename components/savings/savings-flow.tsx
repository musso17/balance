"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils/number";
import { ArrowDown, PiggyBank, Target, TrendingUp, AlertTriangle } from "lucide-react";
import type { Tables, Budget } from "@/lib/database.types";

interface SavingsFlowProps {
    income: number;
    expenses: number;
    goals: Tables<'savings'>[];
    budgets?: Budget[];
    transactions?: Tables<'transactions'>[];
}

export function SavingsFlow({ income, expenses, goals, budgets = [], transactions = [] }: SavingsFlowProps) {
    const { availableForSavings, distribution, leaks, totalLeak, plannedAvailable } = useMemo(() => {
        const available = Math.max(0, income - expenses);

        // 1. Calculate Budget Leaks (Actual > Budget)
        const spendMap = new Map<string, number>();
        transactions.filter(t => t.tipo === 'gasto').forEach(t => {
            const current = spendMap.get(t.category) || 0;
            spendMap.set(t.category, current + t.monto);
        });

        const leaks: { category: string; budget: number; actual: number; excess: number }[] = [];
        budgets.forEach(b => {
            const actual = spendMap.get(b.category) || 0;
            if (actual > b.amount) {
                leaks.push({
                    category: b.category,
                    budget: b.amount,
                    actual,
                    excess: actual - b.amount
                });
            }
        });

        const totalLeak = leaks.reduce((acc, l) => acc + l.excess, 0);

        // Planned Available = Actual Available + Leaks (Money we WOULD have had)
        const plannedAvailable = available + totalLeak;

        const totalGoalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);

        const distribution = goals.map((goal) => {
            const gap = Math.max(0, goal.target_amount - (goal.current_amount ?? 0));

            let allocated = 0;
            let plannedAlloc = 0;

            if (totalGoalTarget > 0) {
                const share = goal.target_amount / totalGoalTarget;
                allocated = available * share;
                plannedAlloc = plannedAvailable * share;
            }

            return {
                ...goal,
                gap,
                allocated,
                plannedAlloc,
                lost: plannedAlloc - allocated
            };
        });

        return {
            availableForSavings: available,
            distribution,
            leaks,
            totalLeak,
            plannedAvailable
        };
    }, [income, expenses, goals, budgets, transactions]);

    const savingsRate = income > 0 ? (availableForSavings / income) * 100 : 0;
    const isDeficit = expenses > income;

    return (
        <div className="space-y-8">
            {/* Top Section: Flow Visualization */}
            <div className="glass-panel p-6 space-y-6">
                <header className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="size-4 text-emerald-400" />
                        Flujo de Caja Mensual
                    </h3>
                    <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${isDeficit ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                        {isDeficit ? "Déficit" : `Tasa de Ahorro: ${savingsRate.toFixed(1)}%`}
                    </span>
                </header>

                {/* Main Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Ingresos: {formatCurrency(income)}</span>
                        <span>Gastos: {formatCurrency(expenses)}</span>
                    </div>

                    <div className="relative h-12 w-full bg-white/5 rounded-full overflow-hidden ring-1 ring-white/10">
                        {/* Income Base (Background is effectively 100% of container if we treat container as Income?) 
                Actually, let's make the container width represent Income. 
                If Expenses > Income, we need to handle overflow.
            */}

                        {/* Expenses Bar */}
                        <div
                            className={`absolute top-0 left-0 h-full transition-all duration-700 ${isDeficit ? "bg-rose-500/50" : "bg-rose-500/30"
                                }`}
                            style={{ width: `${Math.min(100, (expenses / income) * 100)}%` }}
                        >
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white/70">
                                Gastos
                            </div>
                        </div>

                        {/* Savings Bar (The Remainder) */}
                        {!isDeficit && (
                            <div
                                className="absolute top-0 right-0 h-full bg-emerald-500/30 transition-all duration-700"
                                style={{ width: `${(availableForSavings / income) * 100}%` }}
                            >
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white/70">
                                    Ahorro
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <p className={`text-lg font-bold ${isDeficit ? "text-rose-400" : "text-emerald-400"}`}>
                            {isDeficit ? "-" : "+"}{formatCurrency(availableForSavings)}
                            <span className="text-xs font-normal text-muted-foreground ml-2">disponibles</span>
                        </p>
                    </div>
                </div>

                {/* Leak Alert */}
                {totalLeak > 0 && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div className="space-y-1 flex-1">
                                <h4 className="text-sm font-semibold text-rose-200">
                                    Fugas de Presupuesto detectadas
                                </h4>
                                <p className="text-xs text-rose-200/80 leading-relaxed">
                                    Has gastado <strong>{formatCurrency(totalLeak)}</strong> más de lo planeado en tus presupuestos.
                                    Esto ha reducido tu capacidad de ahorro.
                                </p>
                                <div className="pt-2 flex flex-wrap gap-2">
                                    {leaks.map(leak => (
                                        <span key={leak.category} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/20 text-[10px] font-medium text-rose-200 border border-rose-500/20">
                                            {leak.category}: +{formatCurrency(leak.excess)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Connector Arrow */}
            <div className="flex justify-center -my-4 relative z-10">
                <div className="bg-background border border-white/10 p-2 rounded-full text-muted-foreground shadow-xl">
                    <ArrowDown className="size-5" />
                </div>
            </div>

            {/* Bottom Section: Goal Distribution */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider pl-1">
                    Distribución Sugerida
                </h3>

                {goals.length === 0 ? (
                    <div className="subdued-card p-8 text-center space-y-3">
                        <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                            <Target className="size-6" />
                        </div>
                        <p className="text-muted-foreground">No tienes metas de ahorro activas.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {distribution.map((goal) => (
                            <div key={goal.id} className="subdued-card p-5 space-y-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                                {/* Background Progress Fill based on Allocation */}
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-emerald-500/50 transition-all duration-700 z-10"
                                    style={{ width: `${goal.gap > 0 ? (goal.allocated / goal.gap) * 100 : 100}%` }}
                                />
                                {/* Ghost Bar (Planned) */}
                                {goal.lost > 0 && (
                                    <div
                                        className="absolute bottom-0 left-0 h-1 bg-white/20 transition-all duration-700"
                                        style={{ width: `${goal.gap > 0 ? (goal.plannedAlloc / goal.gap) * 100 : 100}%` }}
                                    />
                                )}

                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-foreground">{goal.goal_name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Meta: {formatCurrency(goal.target_amount)}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-xl text-emerald-400">
                                        <PiggyBank className="size-5" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-muted-foreground">Asignación mensual</span>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-emerald-400 block">
                                                +{formatCurrency(goal.allocated)}
                                            </span>
                                            {goal.lost > 0 && (
                                                <span className="text-[10px] text-rose-400 font-medium">
                                                    Perdido: -{formatCurrency(goal.lost)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mini Progress Bar for Total Goal Progress */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>Progreso Total</span>
                                            <span>{Math.round(((goal.current_amount ?? 0) / goal.target_amount) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500/30 rounded-full"
                                                style={{ width: `${((goal.current_amount ?? 0) / goal.target_amount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
