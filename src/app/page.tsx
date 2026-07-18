"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tools, categories } from "@/data/tools";
import { ToolCard } from "@/components/ToolCard";
import { useFavorites } from "@/lib/useFavorites";
import { useHistory } from "@/lib/useHistory";
import Link from "next/link";
import * as LucideIcons from "lucide-react";

function HeroSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto">
      <LucideIcons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
      <input
        type="text"
        placeholder={`Search ${tools.length} tools... (e.g. compress pdf, json formatter)`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base rounded-xl border border-border bg-surface text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/60"
      />
      {focused && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-raised rounded-xl shadow-xl border border-border p-2 max-h-72 overflow-y-auto z-10">
          {filtered.map((tool) => {
            const cat = categories.find((c) => c.id === tool.category);
            const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
            return (
              <button
                key={tool.id}
                onClick={() => { setQuery(""); setFocused(false); router.push(`/tools/${tool.slug}`); }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm hover:bg-surface-hover transition-colors text-left"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: cat?.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{tool.name}</div>
                </div>
                {cat && (
                  <span className="text-[10px] uppercase tracking-wider opacity-50 shrink-0" style={{ color: cat.color }}>
                    {cat.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { value: favorites } = useFavorites();
  const { value: history } = useHistory();

  const favTools = favorites.map((s) => tools.find((t) => t.slug === s)).filter(Boolean) as typeof tools;
  const recentSlugs = history.map((e) => e.slug);
  const recentTools = recentSlugs.map((s) => tools.find((t) => t.slug === s)).filter(Boolean) as typeof tools;
  const grouped = categories.map((cat) => ({
    ...cat,
    items: tools.filter((t) => t.category === cat.id),
  }));

  return (
    <div className="hero-mesh">
      <div className="max-w-7xl mx-auto px-4">
        <section className="text-center pt-10 pb-6 md:pt-16 md:pb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-fade-up">
            <span className="text-accent">{tools.length} Free</span> Online Tools
          </h1>
          <p className="text-text-secondary text-base max-w-lg mx-auto mb-5 animate-fade-up animate-fade-up-d1">
            Privacy-first tools for PDF, images, text, video, development, and everyday tasks.
            <br />All processing happens in your browser — nothing is ever uploaded.
          </p>
          <div className="animate-fade-up animate-fade-up-d2">
            <HeroSearch />
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 animate-fade-up animate-fade-up-d3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-surface-hover px-3 py-1.5 rounded-full border border-border-soft">
              <LucideIcons.Grid3x3 className="w-3 h-3" /> {tools.length} Tools
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-surface-hover px-3 py-1.5 rounded-full border border-border-soft">
              <LucideIcons.Lock className="w-3 h-3" /> Zero Uploads
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-surface-hover px-3 py-1.5 rounded-full border border-border-soft">
              <LucideIcons.Heart className="w-3 h-3" /> 100% Free
            </span>
          </div>
        </section>

        {favTools.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-heading font-semibold flex items-center gap-2 text-amber-500 mb-3">
              <LucideIcons.Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Favorites
            </h2>
            <div className="flex overflow-x-auto gap-2 pb-1 -mx-4 px-4 snap-x md:flex-wrap md:overflow-visible md:mx-0 md:px-0">
              {favTools.map((tool) => {
                const cat = categories.find((c) => c.id === tool.category)!;
                const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-soft text-xs hover:border-accent/40 hover:bg-accent/5 transition-all"
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    {tool.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {recentTools.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-heading font-semibold flex items-center gap-2 text-text-secondary mb-3">
              <LucideIcons.Clock className="w-4 h-4" /> Recently Used
            </h2>
            <div className="flex overflow-x-auto gap-2 pb-1 -mx-4 px-4 snap-x">
              {recentTools.map((tool) => {
                const cat = categories.find((c) => c.id === tool.category)!;
                const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-soft text-xs hover:border-accent/40 hover:bg-accent/5 transition-all whitespace-nowrap snap-start shrink-0"
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    {tool.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {grouped.map((cat) =>
          cat.items.length > 0 ? (
            <section key={cat.id} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-heading font-semibold flex items-center gap-2" style={{ color: cat.color }}>
                  <span>{cat.label}</span>
                  <span className="text-xs font-normal opacity-60">({cat.items.length})</span>
                </h2>
                <Link
                  href={`/category/${cat.id}`}
                  className="text-xs text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
                >
                  View all <LucideIcons.ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cat.items.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ) : null
        )}
      </div>
    </div>
  );
}
