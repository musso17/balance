"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
    value,
    formatter = (val: number) => Math.round(val).toLocaleString("es-PE"),
    duration = 900,
}: {
    value: number;
    formatter?: (value: number) => string;
    duration?: number;
}) {
    // Use state to force re-render on value change
    const [displayValue, setDisplayValue] = useState(value);
    const previousValue = useRef(value);
    const startTimeRef = useRef<number | null>(null);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = previousValue.current;

        // If value hasn't changed, do nothing
        if (startValue === value) return;

        const diff = value - startValue;

        const animate = (time: number) => {
            if (startTimeRef.current === null) {
                startTimeRef.current = time;
            }

            const timeElapsed = time - startTimeRef.current;
            const progress = Math.min(timeElapsed / duration, 1);

            // Easing function: cubic-out
            const ease = 1 - Math.pow(1 - progress, 3);

            const currentValue = startValue + diff * ease;
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete
                setDisplayValue(value);
                previousValue.current = value;
                startTimeRef.current = null;
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [value, duration]);

    // Initial render or if value matches ref
    if (value === previousValue.current) {
        return <span>{formatter(value)}</span>;
    }

    return <span>{formatter(displayValue)}</span>;
}
