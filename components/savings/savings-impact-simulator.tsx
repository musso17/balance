"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatCurrencyNoDecimals } from "@/lib/utils/number";
import { ArrowRight, Calculator, RefreshCw, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import type { Tables, Budget } from "@/lib/database.types";
import { cn } from "@/lib/utils/style";

interface SavingsImpactSimulatorProps {
    income: number;
    currentExpenses: number;
    goals: Tables<'savings'>[];
    budgets: Budget[];
    onClose?: () => void;
}

export function SavingsImpactSimulator({ income, currentExpenses, goals, budgets, onClose }: SavingsImpactSimulatorProps) {
    // Initialize projections with current budget amounts or actuals?
    // Let's initialize with the BUDGET amounts, as we are simulating "What if I budget X?".
    // Or better: Initialize with current ACTUAL expenses if available, or Budget if not.
    // For simplicity, let's start with the current BUDGET plan.

    const [projections, setProjections] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        budgets.forEach(b => {
            initial[b.category] = b.amount;
        });
        return initial;
    });

    const handleProjectionChange = (category: string, value: number) => {
        setProjections(prev => ({
            ...prev,
            [category]: value
        }));
    };

    const resetProjections = () => {
        const initial: Record<string, number> = {};
        budgets.forEach(b => {
            initial[b.category] = b.amount;
        });
        setProjections(initial);
    };

    const {
        projectedTotalExpenses,
        projectedAvailable,
        impactAnalysis,
        projectedSavingsRate
    } = useMemo(() => {
        // Calculate total projected expenses
        // We need to account for expenses that are NOT in the budgets list (e.g. unbudgeted spending).
        // However, for this simulator, we might only focus on the adjustable budgets.
        // Let's assume 'currentExpenses' includes everything. 
        // We need to calculate the DELTA from the original budget to the new projection.

        const originalBudgetTotal = budgets.reduce((acc, b) => acc + b.amount, 0);
        const newProjectionTotal = Object.values(projections).reduce((acc, val) => acc + val, 0);

        const projectionDelta = newProjectionTotal - originalBudgetTotal;

        // We apply this delta to the 'currentExpenses' passed in? 
        // Or do we recalculate total expenses from scratch?
        // Ideally, we start with "Fixed Expenses (Non-Budgeted)" + "Projected Budgeted Expenses".
        // But we don't easily know "Fixed Expenses".
        // Heuristic: Base it on Income. 
        // Available = Income - (Non-Budgeted Actuals + Projected Budgeted).
        // Let's simplify: 
        // Base Available = Income - currentExpenses.
        // New Available = Base Available - (New Projection - Original Budget).
        // This assumes 'currentExpenses' roughly matches 'Original Budget' for those categories.
        // If currentExpenses is way off, this might be weird.

        // Alternative: Just show "Projected Monthly Expenses" based on the sum of these budgets + (Total Actual Expenses - Total Actual Budgeted Expenses).
        // Let's stick to the Delta approach, it's safer for "What-If" scenarios.

        const baseAvailable = Math.max(0, income - currentExpenses);
        const newAvailable = Math.max(0, baseAvailable - projectionDelta);
        const newTotalExpenses = income - newAvailable;
        const rate = income > 0 ? (newAvailable / income) * 100 : 0;

        // Analyze Impact on Goals
        const totalGoalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);

        const goalImpacts = goals.map(goal => {
            // Original Allocation (Proportional)
            let originalAlloc = 0;
            if (totalGoalTarget > 0) {
                originalAlloc = baseAvailable * (goal.target_amount / totalGoalTarget);
            }

            // New Allocation
            let newAlloc = 0;
            if (totalGoalTarget > 0) {
                newAlloc = newAvailable * (goal.target_amount / totalGoalTarget);
            }

            const gap = Math.max(0, goal.target_amount - (goal.current_amount ?? 0));

            return {
                ...goal,
                gap,
                originalAlloc,
                newAlloc,
                delta: newAlloc - originalAlloc
            };
        });

        return {
            projectedTotalExpenses: newTotalExpenses,
            projectedAvailable: newAvailable,
            projectedSavingsRate: rate,
            impactAnalysis: goalImpacts
        };
    }, [income, currentExpenses, budgets, projections, goals]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <header className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Calculator className="size-5 text-sky-400" />
                        Simulador de Impacto
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Ajusta tus presupuestos para ver cómo afectan tus metas.
                    </p>
                </div>
                <button
                    onClick={resetProjections}
                    className="p-2 hover:bg-white/5 rounded-full text-muted-foreground hover:text-foreground transition"
                    title="Restablecer valores"
                >
                    <RotateCcw className="size-4" />
                </button>
            </header>

            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                {/* Left: Budget Adjustments */}
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {budgets.map(budget => (
                            <div key={budget.id} className="subdued-card p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{budget.category}</span>
                                    <span className="text-xs text-muted-foreground">
                                        Actual: {formatCurrencyNoDecimals(budget.amount)}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min={0}
                                        max={budget.amount * 2} // Allow doubling
                                        step={10}
                                        value={projections[budget.category] ?? 0}
                                        onChange={(e) => handleProjectionChange(budget.category, Number(e.target.value))}
                                        className="w-full accent-sky-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={projections[budget.category] ?? 0}
                                                onChange={(e) => handleProjectionChange(budget.category, Number(e.target.value))}
                                                className="w-20 bg-transparent border-b border-white/10 text-sm font-bold text-foreground focus:outline-none focus:border-sky-500 text-right"
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            (projections[budget.category] ?? 0) > budget.amount ? "text-rose-400" : "text-emerald-400"
                                        )}>
                                            {(projections[budget.category] ?? 0) > budget.amount ? "+" : ""}
                                            {formatCurrencyNoDecimals((projections[budget.category] ?? 0) - budget.amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Impact Summary */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="glass-panel p-5 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Resultado Proyectado
                        </h4>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Nuevo Ahorro Disponible</span>
                                <span className={cn(
                                    "text-xl font-bold",
                                    projectedAvailable < (income - currentExpenses) ? "text-rose-400" : "text-emerald-400"
                                )}>
                                    {formatCurrency(projectedAvailable)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Tasa de Ahorro</span>
                                <span className="font-medium">{projectedSavingsRate.toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Impacto en Metas</p>
                            {impactAnalysis.map(goal => (
                                <div key={goal.id} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>{goal.goal_name}</span>
                                        <span className={cn(
                                            goal.delta < 0 ? "text-rose-400" : "text-emerald-400"
                                        )}>
                                            {goal.delta > 0 ? "+" : ""}{formatCurrencyNoDecimals(goal.delta)}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden flex">
                                        {/* Original (Ghost) */}
                                        <div
                                            className="h-full bg-white/10"
                                            style={{ width: `${(goal.originalAlloc / (goal.gap || 1)) * 100}%` }}
                                        />
                                    </div>
                                    {/* New Allocation Bar */}
                                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden -mt-1.5">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-500",
                                                goal.delta < 0 ? "bg-rose-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${(goal.newAlloc / (goal.gap || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4 text-sm text-sky-200">
                        <p className="flex gap-2">
                            <RefreshCw className="size-4 shrink-0 mt-0.5" />
                            <span>
                                Ajustar tus gastos en <strong>{formatCurrencyNoDecimals(Math.abs(projectedAvailable - (income - currentExpenses)))}</strong>
                                {projectedAvailable < (income - currentExpenses) ? " reducirá " : " aumentará "}
                                tu capacidad de ahorro mensual.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
