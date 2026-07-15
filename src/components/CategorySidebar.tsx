"use client";

import { useState } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { tools, categories, getToolsByCategory, type CategoryId } from "@/data/tools";
import { cn } from "@/lib/utils";

export function CategorySidebar({ currentSlug }: { currentSlug: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const tool = tools.find((t) => t.slug === currentSlug);
  if (!tool) return null;

  const cat = categories.find((c) => c.id === tool.category)!;
  const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
  const siblings = getToolsByCategory(tool.category as CategoryId);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent mb-3 transition-colors"
        aria-label="Toggle category sidebar"
      >
        <LucideIcons.PanelLeft className="w-4 h-4" />
        <span>{cat.label}</span>
      </button>

      {mobileOpen && (
        <div className="lg:hidden mb-4 p-3 bg-surface rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <LucideIcons.ArrowLeft className="w-3.5 h-3.5" /> All Tools
            </Link>
            <button onClick={() => setMobileOpen(false)} className="text-text-secondary hover:text-text-primary">
              <LucideIcons.X className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-0.5" aria-label="Category tools">
            {siblings.map((s) => {
              const Icon = (LucideIcons as any)[s.icon] || LucideIcons.File;
              const active = s.slug === currentSlug;
              return (
                <Link
                  key={s.id}
                  href={`/tools/${s.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                    active
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-secondary hover:bg-surface-hover"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <aside className="w-56 shrink-0 hidden lg:block">
        <div className="sticky top-20">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent mb-4 transition-colors"
          >
            <LucideIcons.ArrowLeft className="w-3.5 h-3.5" /> All Tools
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${cat.color}12` }}>
              <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
            </div>
            <span className="text-xs font-heading font-semibold uppercase tracking-wider" style={{ color: cat.color }}>
              {cat.label}
            </span>
          </div>
          <nav className="space-y-0.5" aria-label="Category tools">
            {siblings.map((s) => {
              const Icon = (LucideIcons as any)[s.icon] || LucideIcons.File;
              const active = s.slug === currentSlug;
              return (
                <Link
                  key={s.id}
                  href={`/tools/${s.slug}`}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
                    active
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-secondary hover:bg-surface-hover"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
