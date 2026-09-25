"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  icon,
  children,
  tone = "neutral",
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  tone?: "neutral" | "accent" | "positive" | "warning";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border-soft",
        tone === "neutral" && "bg-surface-hover text-text-secondary",
        tone === "accent" && "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-200 border-transparent",
        tone === "positive" && "bg-success-soft text-success-text border-success-border",
        tone === "warning" && "bg-warning-soft text-warning-text border-warning-border",
        className
      )}
    >
      {icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      {children}
    </span>
  );
}
