"use client";

import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { categories } from "@/data/tools";

export function Breadcrumbs({ category, toolName }: { category?: string; toolName?: string }) {
  const cat = categories.find((c) => c.id === category);

  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-secondary mb-4" aria-label="Breadcrumb">
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
      <div className="hidden md:flex items-center gap-1.5">
        <Link href="/" className="hover:text-accent transition-colors">
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3 h-3" />
        {cat ? (
          <>
            <Link href={`/category/${cat.id}`} className="hover:text-accent transition-colors capitalize">
              {cat.label}
            </Link>
            {toolName && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-text-primary">{toolName}</span>
              </>
            )}
          </>
        ) : (
          <span className="text-text-primary">All Tools</span>
        )}
      </div>
    </nav>
  );
}
