"use client";

import { useMemo, useState, useEffect } from "react";
import { Home, TrendingUp, Calendar, Target, Banknote, Pencil, Check, X } from "lucide-react";

import { formatCurrencyNoDecimals } from "@/lib/utils/number";

// Configuration for the savings goal
const GOAL_CONFIG = {
    departmentValue: 1_000_000, // S/. 1M
    downPaymentPercent: 0.20,   // 20% inicial
    monthlyTarget: 4_500,       // S/. 4.5K mensual
};

const STORAGE_KEY = "house-savings-current";

interface HouseSavingsTrackerProps {
    monthlySavingsRate?: number;
}

export function HouseSavingsTracker({
    monthlySavingsRate = GOAL_CONFIG.monthlyTarget,
}: HouseSavingsTrackerProps) {
    const [currentSavings, setCurrentSavings] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const downPaymentGoal = GOAL_CONFIG.departmentValue * GOAL_CONFIG.downPaymentPercent;

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setCurrentSavings(Number(saved) || 0);
        }
    }, []);

    const handleSave = () => {
        const newValue = Number(editValue) || 0;
        setCurrentSavings(newValue);
        localStorage.setItem(STORAGE_KEY, String(newValue));
        setIsEditing(false);
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Meta de ahorro
                </p>
                <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground">
                    <Home className="size-6 text-primary" />
                    Inicial para Departamento
                </h2>
                <p className="text-sm text-muted-foreground">
                    Departamento de {formatCurrencyNoDecimals(GOAL_CONFIG.departmentValue)} — Inicial del {GOAL_CONFIG.downPaymentPercent * 100}%
                </p>
            </div>

            {/* Editable Current Savings */}
            <div className="glass-panel p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Banknote className="size-6 text-emerald-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Monto ahorrado actualmente</p>
                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-lg text-muted-foreground">S/.</span>
                                    <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="soft-input w-40 text-lg font-bold"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSave();
                                            if (e.key === "Escape") handleCancel();
                                        }}
                                    />
                                    <button
                                        onClick={handleSave}
                                        className="rounded-full bg-emerald-500/20 p-2 text-emerald-400 hover:bg-emerald-500/30"
                                    >
                                        <Check className="size-4" />
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="rounded-full bg-white/10 p-2 text-muted-foreground hover:bg-white/20"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-2xl font-bold text-emerald-400">
                                    {formatCurrencyNoDecimals(currentSavings)}
                                </p>
                            )}
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={handleStartEdit}
                            className="rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        >
                            <Pencil className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Progress Card */}
            <div className="glass-panel overflow-hidden p-6">
                <div className="grid gap-8 md:grid-cols-2">
                    {/* Progress Circle */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                            <svg className="size-48" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-white/10"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="42"
                                    fill="none"
                                    stroke="url(#progressGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${stats.progressPercent * 2.64} 264`}
                                    transform="rotate(-90 50 50)"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#10B981" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-foreground">
                                    {stats.progressPercent.toFixed(1)}%
                                </span>
                                <span className="text-sm text-muted-foreground">completado</span>
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
