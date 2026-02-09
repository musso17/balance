"use client";

import { useMemo, useState } from "react";
import { useSavings, useCreateSaving, useUpdateSaving } from "@/hooks/use-savings";
import { Loader2, TrendingUp, Calendar, Target, Banknote, Pencil, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrencyNoDecimals } from "@/lib/utils/number";

// Configuration for the savings goal
const GOAL_CONFIG = {
    departmentValue: 1_000_000,
    downPaymentPercent: 0.20,
    monthlyTarget: 4_500,
    goalName: "Inicial Departamento"
};

interface HouseSavingsTrackerProps {
    monthlySavingsRate?: number;
}

export function HouseSavingsTracker({
    monthlySavingsRate = GOAL_CONFIG.monthlyTarget,
}: HouseSavingsTrackerProps) {
    const { data: savingsGoals, isLoading } = useSavings();
    const createMutation = useCreateSaving();
    const updateMutation = useUpdateSaving();

    const houseGoal = savingsGoals?.find(g => g.goal_name === GOAL_CONFIG.goalName);
    const currentSavings = houseGoal?.current_amount ?? 0;
    const downPaymentGoal = houseGoal?.target_amount ?? (GOAL_CONFIG.departmentValue * GOAL_CONFIG.downPaymentPercent);

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");

    const handleSave = async () => {
        const newValue = Number(editValue) || 0;

        try {
            if (houseGoal) {
                await updateMutation.mutateAsync({
                    id: houseGoal.id,
                    current_amount: newValue
                });
            } else {
                await createMutation.mutateAsync({
                    goal_name: GOAL_CONFIG.goalName,
                    target_amount: downPaymentGoal,
                    current_amount: newValue,
                    deadline: null // Optional: could calculate based on monthly target
                });
            }
            toast.success("Meta actualizada");
            setIsEditing(false);
        } catch (error) {
            toast.error("Error al guardar");
            console.error(error);
        }
    };

    const handleCancel = () => {
        setEditValue(String(currentSavings));
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        setEditValue(String(currentSavings));
        setIsEditing(true);
    };

    const stats = useMemo(() => {
        const remaining = Math.max(0, downPaymentGoal - currentSavings);
        const progressPercent = Math.min((currentSavings / downPaymentGoal) * 100, 100);
        const monthsRemaining = monthlySavingsRate > 0
            ? Math.ceil(remaining / monthlySavingsRate)
            : Infinity;

        const projectedDate = new Date();
        projectedDate.setMonth(projectedDate.getMonth() + monthsRemaining);

        return {
            remaining,
            progressPercent,
            monthsRemaining,
            projectedDate,
            yearsRemaining: monthsRemaining / 12,
        };
    }, [currentSavings, downPaymentGoal, monthlySavingsRate]);

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Meta de Ahorro
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Inicial para Departamento
                    </p>
                </div>
            </div>

            {/* Editable Current Savings */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 p-6 text-white shadow-lg transition-all hover:scale-[1.01]">
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-full bg-white/20">
                            <Banknote className="size-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-purple-100">Monto ahorrado actualmente</p>
                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-2xl font-bold text-white/90">S/.</span>
                                    <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-1 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-white/30 w-48"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSave();
                                            if (e.key === "Escape") handleCancel();
                                        }}
                                    />
                                    <button
                                        onClick={handleSave}
                                        className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
                                    >
                                        <Check className="size-5" />
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 transition"
                                    >
                                        <X className="size-5" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-4xl font-bold text-white tracking-tight">
                                    {formatCurrencyNoDecimals(currentSavings)}
                                </p>
                            )}
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={handleStartEdit}
                            className="group/btn flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                        >
                            <Pencil className="size-4" />
                            <span>Actualizar</span>
                        </button>
                    )}
                </div>
                {/* Decorative blob */}
                <div className="absolute -right-12 -top-12 size-48 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
            </div>

            {/* Main Progress Card */}
            <div className="glass-panel overflow-hidden p-6 md:p-8">
                <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
                    {/* Progress Circle */}
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative">
                            <svg className="size-56 drop-shadow-2xl" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-white/5"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={`${stats.progressPercent * 2.64} 264`}
                                    transform="rotate(-90 50 50)"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="100%" stopColor="#a78bfa" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-bold text-foreground tracking-tighter">
                                    {stats.progressPercent.toFixed(1)}%
                                </span>
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">completado</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col justify-center space-y-4">
                        <StatRow
                            icon={<Target className="size-5 text-primary" />}
                            label="Meta"
                            value={formatCurrencyNoDecimals(downPaymentGoal)}
                        />
                        <StatRow
                            icon={<Banknote className="size-5 text-emerald-500" />}
                            label="Ahorrado"
                            value={formatCurrencyNoDecimals(currentSavings)}
                            highlight
                        />
                        <StatRow
                            icon={<TrendingUp className="size-5 text-amber-500" />}
                            label="Falta"
                            value={formatCurrencyNoDecimals(stats.remaining)}
                        />
                        <StatRow
                            icon={<Calendar className="size-5 text-violet-500" />}
                            label="Meta en"
                            value={stats.monthsRemaining === Infinity
                                ? "—"
                                : `${stats.monthsRemaining} meses`}
                            subvalue={stats.monthsRemaining !== Infinity
                                ? formatDate(stats.projectedDate)
                                : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Monthly Target Card */}
            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    title="Ahorro Mensual Objetivo"
                    value={formatCurrencyNoDecimals(GOAL_CONFIG.monthlyTarget)}
                    subtitle="Para alcanzar la meta"
                    gradient="from-blue-500/20 to-cyan-500/20"
                />
                <MetricCard
                    title="Ahorro Este Mes"
                    value={formatCurrencyNoDecimals(monthlySavingsRate)}
                    subtitle={monthlySavingsRate >= GOAL_CONFIG.monthlyTarget ? "¡En camino! 🎯" : "Por debajo del objetivo"}
                    gradient={monthlySavingsRate >= GOAL_CONFIG.monthlyTarget
                        ? "from-emerald-500/20 to-green-500/20"
                        : "from-amber-500/20 to-orange-500/20"}
                />
                <MetricCard
                    title="Tiempo Restante"
                    value={stats.monthsRemaining === Infinity
                        ? "—"
                        : stats.yearsRemaining >= 1
                            ? `${stats.yearsRemaining.toFixed(1)} años`
                            : `${stats.monthsRemaining} meses`}
                    subtitle={stats.monthsRemaining !== Infinity
                        ? `~${formatDate(stats.projectedDate)}`
                        : "Ahorra para proyectar"}
                    gradient="from-violet-500/20 to-purple-500/20"
                />
            </div>

            {/* Progress Bar */}
            <div className="glass-panel p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso hacia la inicial</span>
                    <span className="font-medium text-foreground">
                        {formatCurrencyNoDecimals(currentSavings)} / {formatCurrencyNoDecimals(downPaymentGoal)}
                    </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000"
                        style={{ width: `${stats.progressPercent}%` }}
                    />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>S/. 0</span>
                    <span>S/. 50K</span>
                    <span>S/. 100K</span>
                    <span>S/. 150K</span>
                    <span>S/. 200K</span>
                </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h4 className="mb-2 font-medium text-emerald-400">💡 Tips para acelerar tu ahorro</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Automatiza transferencias el día de pago</li>
                    <li>• Considera inversiones de bajo riesgo para generar intereses</li>
                    <li>• Revisa gastos hormiga que puedas reducir</li>
                </ul>
            </div>
        </div>
    );
}

function StatRow({
    icon,
    label,
    value,
    subvalue,
    highlight = false
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    subvalue?: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            {icon}
            <div className="flex-1">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-lg font-semibold ${highlight ? "text-emerald-400" : "text-foreground"}`}>
                    {value}
                </p>
                {subvalue && <p className="text-xs text-muted-foreground">{subvalue}</p>}
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    gradient,
}: {
    title: string;
    value: string;
    subtitle: string;
    gradient: string;
}) {
    return (
        <div className={`glass-panel bg-gradient-to-br ${gradient} p-4`}>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
    );
}
