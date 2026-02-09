"use client";

import type { CSSProperties, ElementType } from "react";
import { cn } from "@/lib/utils/style";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function MetricCard({
    title,
    value,
    hint,
    icon: Icon,
    tone = "default",
    subcopy,
    className,
    highlight = false,
    valueFormatter,
    style,
    sparklineData,
    gradient,
    subtitle,
}: {
    title: string;
    value: number | string;
    hint?: string;
    subtitle?: string;
    icon?: ElementType;
    tone?: "default" | "positive" | "negative" | "info";
    subcopy?: string;
    className?: string;
    highlight?: boolean;
    valueFormatter?: (value: number) => string;
    style?: CSSProperties;
    sparklineData?: number[];
    gradient?: string;
}) {
    // Vibrant gradient backgrounds per tone type
    const gradients = {
        positive: "bg-gradient-to-br from-teal-500 to-teal-600", // Income - Teal
        negative: "bg-gradient-to-br from-pink-500 to-pink-600", // Expenses - Magenta/Pink
        info: "bg-gradient-to-br from-cyan-500 via-teal-500 to-blue-500", // Balance - Gradient
        default: "bg-gradient-to-br from-violet-500 to-purple-600", // Savings - Purple
    } as const;

    const gradientClass = gradient ?? (gradients[tone] ?? gradients.default);

    return (
        <div
            data-highlight={highlight ? "true" : undefined}
            className={cn(
                "animate-card-pop group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-6 text-white shadow-lg transition duration-300 ease-out",
                gradientClass,
                className,
            )}
            style={style}
        >
            {/* Header with icon and title */}
            <div className="flex items-center gap-2">
                {Icon && (
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
                        <Icon className="size-4" />
                    </span>
                )}
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
                    {title}
                </span>
            </div>

            {/* Main value */}
            <p className="text-[32px] font-bold leading-tight tracking-tight md:text-[38px]">
                {typeof value === "number" ? (
                    <AnimatedNumber value={value} formatter={valueFormatter} />
                ) : (
                    value
                )}
            </p>

            {/* Hint and subcopy */}
            <div className="mt-auto space-y-1">
                {(hint || subtitle) && (
                    <p className="text-sm leading-relaxed text-white/80">{hint ?? subtitle}</p>
                )}
                {subcopy && <p className="text-xs text-white/60">{subcopy}</p>}
            </div>

            {/* Mini Sparkline Chart (decorative) */}
            <div className="absolute bottom-4 right-4 h-12 w-24 opacity-30">
                <MiniSparkline data={sparklineData} />
            </div>
        </div>
    );
}

export function InsightCard({
    title,
    value,
    description,
    icon: Icon,
    tone = "default",
}: {
    title: string;
    value: string;
    description: string;
    icon?: ElementType;
    tone?: "default" | "warning" | "success";
}) {
    // Colorful backgrounds based on tone
    const backgrounds = {
        default: "bg-gradient-to-br from-violet-600 to-purple-700 text-white", // Projection - Purple
        warning: "bg-gradient-to-br from-pink-100 to-rose-100 text-rose-900", // Alerts - Light pink
        success:
            "bg-gradient-to-br from-purple-500 via-cyan-500 to-teal-500 text-white", // Daily avg - Gradient
    } as const;

    const bgClass = backgrounds[tone] ?? backgrounds.default;
    const isLight = tone === "warning";

    return (
        <div
            className={cn(
                "flex h-full flex-col gap-4 rounded-3xl p-6 shadow-lg",
                bgClass,
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]",
                    isLight ? "text-rose-600" : "text-white/80",
                )}
            >
                {Icon && (
                    <span
                        className={cn(
                            "flex size-8 items-center justify-center rounded-full",
                            isLight ? "bg-rose-200/50" : "bg-white/20",
                        )}
                    >
                        <Icon className="size-4" />
                    </span>
                )}
                <span>{title}</span>
            </div>
            <p
                className={cn(
                    "text-3xl font-bold",
                    isLight ? "text-rose-900" : "text-white",
                )}
            >
                {value}
            </p>
            <p
                className={cn(
                    "text-sm leading-relaxed",
                    isLight ? "text-rose-700" : "text-white/70",
                )}
            >
                {description}
            </p>
        </div>
    );
}

export function MiniSparkline({ data }: { data?: number[] }) {
    // Default decorative data if none provided
    const points = data ?? [30, 45, 35, 60, 50, 70, 55, 80];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;

    const height = 48;
    const width = 96;
    const pathPoints = points.map((val, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
    });

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
            className="h-full w-full"
            preserveAspectRatio="none"
        >
            <path
                d={pathPoints.join(" ")}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
