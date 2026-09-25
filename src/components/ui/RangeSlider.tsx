"use client";

import { cn } from "@/lib/utils";

export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  className,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  return (
    <div
      className={cn("relative h-5 flex items-center select-none touch-none", className)}
      aria-hidden="true"
    >
      {/* Track */}
      <div className="absolute left-0 right-0 h-1.5 rounded-full bg-border-soft" />
      {/* Filled portion */}
      <div
        className="absolute left-0 h-1.5 rounded-full bg-accent transition-[width] duration-150"
        style={{ width: `${pct}%` }}
      />
      {/* Thumb */}
      <div
        className={cn(
          "absolute w-4 h-4 -ml-2 rounded-full bg-surface border border-border shadow-sm transition-transform duration-150 hover:scale-110",
          disabled && "opacity-40"
        )}
        style={{ left: `${pct}%` }}
      />
      {/* Native input on top (handles all pointer + keyboard interaction) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label="Range"
      />
    </div>
  );
}
