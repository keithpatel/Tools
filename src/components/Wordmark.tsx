"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 shrink-0 rounded-lg transition-all duration-200 ease-out hover:opacity-85 min-h-[44px]"
      aria-label="MultiTool home"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
      </span>
      {!compact && (
        <span className={cn("font-heading font-bold tracking-tight text-text-primary text-base")}>
          MultiTool
        </span>
      )}
    </Link>
  );
}
