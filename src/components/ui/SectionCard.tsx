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
        "bg-surface rounded-[18px] border border-border-soft shadow-resting overflow-hidden transition-shadow duration-200 ease-out",
        className
      )}
    >
      {title && (
        <header className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b border-border-soft/70">
          {icon && (
            <span className="flex items-center justify-center w-7 h-7 rounded-[10px] bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-200 shrink-0 [&>svg]:w-4 [&>svg]:h-4">
              {icon}
            </span>
          )}
          <h2 className="text-sm font-heading font-semibold tracking-tight text-text-primary">{title}</h2>
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      <div className={cn(title ? "px-5 py-4" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
