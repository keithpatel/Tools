"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-[14px] transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 text-white shadow-sm hover:shadow-hover hover:brightness-[1.04]",
        secondary: "bg-surface-hover text-text-primary hover:bg-border border border-border-soft",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
        outline: "border border-border-soft text-text-primary hover:bg-surface-hover hover:border-accent/40",
        danger: "text-error-text hover:bg-error-soft border border-transparent",
        success:
          "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm hover:shadow-hover hover:brightness-[1.04]",
      },
      size: {
        sm: "px-3 py-1.5 text-xs min-h-[36px]",
        md: "px-4 py-2 min-h-[44px]",
        lg: "px-5 py-2.5 text-[15px] min-h-[48px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  loading?: boolean;
}

export function Button({ className, variant, size, type = "button", loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0"
        />
      )}
      {children}
    </button>
  );
}
