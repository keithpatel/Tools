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
        tone === "accent" && "bg-accent/10 text-accent border-transparent",
        tone === "positive" && "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-transparent",
        tone === "warning" && "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-transparent",
        className
      )}
    >
      {icon && <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>}
      {children}
    </span>
  );
}
