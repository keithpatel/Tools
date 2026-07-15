"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { categories, type CategoryId } from "@/data/tools";

export function Breadcrumbs({ category, toolName }: { category?: string; toolName?: string }) {
  const cat = categories.find((c) => c.id === category);

  return (
    <nav className="flex items-center gap-1.5 text-xs text-text-secondary mb-4" aria-label="Breadcrumb">
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
    </nav>
  );
}
