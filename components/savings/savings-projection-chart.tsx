"use client";

import { useMemo, useState } from "react";
import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
    ReferenceLine
} from "recharts";
import { addMonths, differenceInMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency, formatCurrencyNoDecimals } from "@/lib/utils/number";
import type { Tables } from "@/lib/database.types";
import { TrendingUp, AlertTriangle, CheckCircle2, Wallet } from "lucide-react";

interface SavingsProjectionChartProps {
    goals: Tables<'savings'>[];
    currentSavings: number;
    monthlySavingsRate: number;
}

// Color palette for goals
const GOAL_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
];

export function SavingsProjectionChart({ goals, currentSavings, monthlySavingsRate }: SavingsProjectionChartProps) {
    const [hiddenGoals, setHiddenGoals] = useState<string[]>([]);

    const { data, sortedGoals, mandatoryMonthlySavings, netAvailable, isAffordable } = useMemo(() => {
        if (goals.length === 0) return {
            data: [],
            sortedGoals: [],
            mandatoryMonthlySavings: 0,
            netAvailable: monthlySavingsRate,
            isAffordable: true
        };

        // 1. Calculate Mandatory Monthly Savings
        // For each goal, calculate (Target - Current) / MonthsRemaining
        const now = new Date();
        let mandatoryMonthlySavings = 0;
        const goalNeeds = new Map<string, number>();

        goals.forEach(g => {
            const current = g.current_amount ?? 0;
            const gap = Math.max(0, g.target_amount - current);

            if (gap > 0 && g.deadline) {
                const deadlineDate = parseISO(g.deadline);
                const monthsRemaining = Math.max(1, differenceInMonths(deadlineDate, now));
                const monthlyNeed = gap / monthsRemaining;
                goalNeeds.set(g.id, monthlyNeed);
                mandatoryMonthlySavings += monthlyNeed;
            } else {
                goalNeeds.set(g.id, 0);
            }
        });

        const netAvailable = monthlySavingsRate - mandatoryMonthlySavings;
        const isAffordable = netAvailable >= 0;

        // 2. Determine Timeline based on VISIBLE goals
        const visibleGoals = goals.filter(g => !hiddenGoals.includes(g.id));
        // If no goals visible, fallback to all goals or default 12 months
        const goalsForTimeline = visibleGoals.length > 0 ? visibleGoals : goals;

        const goalDeadlines = goalsForTimeline
            .map(g => ({
                id: g.id,
                date: g.deadline ? parseISO(g.deadline) : addMonths(now, 12),
            }));

        const maxDate = new Date(Math.max(...goalDeadlines.map(d => d.date.getTime())));
        const endDate = addMonths(maxDate, 3);
        const monthsCount = differenceInMonths(endDate, now) + 1;
        const timelineMonths = Math.max(monthsCount, 6);

        // 3. Initialize Goal Progress
        const goalProgress = new Map<string, number>();
        goals.forEach(g => {
            goalProgress.set(g.id, g.current_amount ?? 0);
        });

        const chartData = [];

        // 4. Simulate Month by Month
        for (let i = 0; i <= timelineMonths; i++) {
            const date = addMonths(now, i);
            const monthLabel = format(date, "MMM yy", { locale: es });

            const dataPoint: any = {
                month: monthLabel,
                date: date.toISOString(),
            };

            if (i > 0) {
                // Distribute Savings
                // Mandatory Savings Logic: "Si o si"
                // We always allocate the NEED, regardless of affordability.
                // The "Net Available" metric handles the reality check.

                goals.forEach(g => {
                    const need = goalNeeds.get(g.id) ?? 0;
                    const allocation = need;

                    const current = goalProgress.get(g.id) ?? 0;
                    // Cap at Target for visual clarity
                    if (current < g.target_amount) {
                        goalProgress.set(g.id, Math.min(g.target_amount, current + allocation));
                    }
                });
            }

            // Fill data point
            goals.forEach(g => {
                const amount = goalProgress.get(g.id) ?? 0;
                dataPoint[g.id] = Math.round(amount);
            });

            chartData.push(dataPoint);
        }

        const sortedGoals = [...goals].sort((a, b) => {
            const dateA = a.deadline ? parseISO(a.deadline).getTime() : Infinity;
            const dateB = b.deadline ? parseISO(b.deadline).getTime() : Infinity;
            return dateA - dateB;
        });

        return {
            data: chartData,
            sortedGoals,
            mandatoryMonthlySavings,
            netAvailable,
            isAffordable
        };
    }, [goals, currentSavings, monthlySavingsRate]);

    if (goals.length === 0) return null;

    return (
        <div className="glass-panel p-6 space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="size-4 text-sky-400" />
                        Proyección de Metas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Crecimiento proyectado basado en tus obligaciones mensuales.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isAffordable
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        }`}>
                        {isAffordable ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                        <span className="text-xs font-medium">
                            {isAffordable
                                ? `Disponible: +${formatCurrencyNoDecimals(netAvailable)}`
                                : `Faltante: ${formatCurrencyNoDecimals(netAvailable)}`
                            }
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        Ahorro Obligatorio: {formatCurrencyNoDecimals(mandatoryMonthlySavings)}
                    </span>
                </div>
            </header>

            {/* Goal Filters */}
            <div className="flex flex-wrap gap-2">
                {sortedGoals.map((g, index) => {
                    const isHidden = hiddenGoals.includes(g.id);
                    const color = GOAL_COLORS[index % GOAL_COLORS.length];
                    return (
                        <button
                            key={g.id}
                            onClick={() => setHiddenGoals(prev =>
                                isHidden ? prev.filter(id => id !== g.id) : [...prev, g.id]
                            )}
                            className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${isHidden
                                ? "bg-muted/50 text-muted-foreground border-transparent opacity-60 hover:opacity-100"
                                : "bg-background border-border shadow-sm"
                                }`}
                            style={!isHidden ? { borderColor: color, color: "inherit" } : {}}
                        >
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: isHidden ? "#94a3b8" : color }}
                            />
                            {g.goal_name}
                        </button>
                    );
                })}
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `S/${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px" }}
                            itemStyle={{ color: "#f8fafc" }}
                            formatter={(value: number, name: string) => [formatCurrency(value), name]}
                            labelStyle={{ color: "#94a3b8", marginBottom: "0.5rem" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />

                        {sortedGoals.map((g, index) => {
                            if (hiddenGoals.includes(g.id)) return null;
                            return (
                                <Line
                                    key={g.id}
                                    type="monotone"
                                    dataKey={g.id}
                                    name={g.goal_name}
                                    stroke={GOAL_COLORS[index % GOAL_COLORS.length]}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
