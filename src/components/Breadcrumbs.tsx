"use client";

import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { categories } from "@/data/tools";

export function Breadcrumbs({ category, toolName }: { category?: string; toolName?: string }) {
  const cat = categories.find((c) => c.id === category);

  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-secondary mb-4 rounded-full" aria-label="Breadcrumb">
      {/* Mobile Breadcrumb (Back arrow + category and tool name) */}
      <div className="flex md:hidden items-center gap-2">
        <Link
          href={cat ? `/category/${cat.id}` : "/"}
          className="flex items-center gap-1 py-1 text-xs text-text-secondary hover:text-accent font-medium active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{cat ? cat.label : "All Tools"}</span>
        </Link>
        {toolName && (
          <>
            <span className="text-text-secondary/30">/</span>
            <span className="text-text-primary font-semibold truncate max-w-[150px]">{toolName}</span>
          </>
        )}
      </div>

      {/* Desktop Breadcrumb */}
      <ol className="hidden md:flex items-center gap-1.5 bg-surface border border-border-soft rounded-full px-3 py-1.5 shadow-resting">
        <li>
          <Link href="/" className="flex items-center gap-1.5 hover:text-accent transition-colors duration-200" aria-label="Home">
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </li>
        <ChevronRight className="w-3 h-3 opacity-40" aria-hidden="true" />
        {cat ? (
          <>
            <li>
              <Link href={`/category/${cat.id}`} className="font-medium hover:text-accent transition-colors duration-200 capitalize">
                {cat.label}
              </Link>
            </li>
            {toolName && (
              <>
                <ChevronRight className="w-3 h-3 opacity-40" aria-hidden="true" />
                <li aria-current="page" className="text-text-primary font-semibold truncate max-w-[220px]">{toolName}</li>
              </>
            )}
          </>
        ) : (
          <li aria-current="page" className="text-text-primary font-semibold">All Tools</li>
        )}
      </ol>
    </nav>
  );
}
