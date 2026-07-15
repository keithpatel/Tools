"use client";

import Link from "next/link";
import { categories, type Tool } from "@/data/tools";
import * as LucideIcons from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";

export function ToolCard({ tool }: { tool: Tool }) {
  const cat = categories.find((c) => c.id === tool.category)!;
  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
  const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
  const { value: favorites, update: setFavorites } = useFavorites();
  const isFav = favorites.includes(tool.slug);

  return (
    <div className="group relative block p-4 rounded-xl border border-border-soft bg-surface hover:border-accent/30 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <button
        onClick={(e) => {
          e.preventDefault();
          setFavorites((prev: string[]) =>
            isFav ? prev.filter((s) => s !== tool.slug) : [...prev, tool.slug]
          );
        }}
        className="absolute top-2 right-2 p-1 rounded hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <LucideIcons.Star
          className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400 text-amber-400" : "text-text-secondary/40"}`}
        />
      </button>
      <Link href={`/tools/${tool.slug}`}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${cat.color}12` }}>
            <Icon className="w-5 h-5" style={{ color: cat.color }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-medium text-sm group-hover:text-accent transition-colors truncate">
              {tool.name}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
              {tool.description}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium mt-1.5 uppercase tracking-wider opacity-60"
              style={{ color: cat.color }}
            >
              <CatIcon className="w-3 h-3" />
              {cat.label}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
