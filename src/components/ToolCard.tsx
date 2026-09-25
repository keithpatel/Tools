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
    <div className="group relative block p-3.5 sm:p-4 rounded-2xl border border-border-soft bg-surface shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-accent/30 transition-all duration-200">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFavorites((prev: string[]) =>
            isFav ? prev.filter((s) => s !== tool.slug) : [...prev, tool.slug]
          );
        }}
        className={`absolute top-1.5 right-1.5 p-2 rounded-full hover:bg-surface-hover min-w-[44px] min-h-[44px] flex items-center justify-center transition-all z-10 cursor-pointer ${
          isFav ? "opacity-100" : "opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <LucideIcons.Star
          className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-400" : "text-text-secondary/60 hover:text-amber-400"}`}
        />
      </button>
      <Link href={`/tools/${tool.slug}`} className="block pr-8 sm:pr-6 min-h-[44px]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${cat.color}12` }}>
            <Icon className="w-5 h-5" style={{ color: cat.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading font-semibold text-sm group-hover:text-accent transition-colors truncate">
              {tool.name}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
              {tool.description}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium mt-2 uppercase tracking-wider opacity-60"
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
