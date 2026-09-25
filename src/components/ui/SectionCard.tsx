"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "bg-surface rounded-2xl border border-border-soft shadow-xs overflow-hidden",
        className
      )}
    >
      {title && (
        <header className="flex items-center gap-2 px-5 pt-4 pb-3">
          {icon && <span className="text-text-secondary shrink-0 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
          <h2 className="text-sm font-heading font-semibold text-text-primary">{title}</h2>
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      <div className={cn(title ? "px-5 pb-5" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
