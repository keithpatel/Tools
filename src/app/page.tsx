"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tools, categories } from "@/data/tools";
import { ToolCard } from "@/components/ToolCard";
import { useFavorites } from "@/lib/useFavorites";
import { useHistory } from "@/lib/useHistory";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { HomeStructuredData } from "@/components/StructuredData";

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
        className="w-full pl-12 pr-4 py-3.5 sm:py-4 text-base rounded-full border border-border-soft bg-surface text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 transition-all placeholder:text-text-secondary/60"
      />
      {focused && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-raised rounded-2xl shadow-xl border border-border p-2 max-h-72 overflow-y-auto z-20">
          {filtered.map((tool) => {
            const cat = categories.find((c) => c.id === tool.category);
            const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
            return (
              <button
                key={tool.id}
                onClick={() => { setQuery(""); setFocused(false); router.push(`/tools/${tool.slug}`); }}
                className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm hover:bg-surface-hover transition-colors text-left min-h-[44px] cursor-pointer"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: cat?.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{tool.name}</div>
                </div>
                {cat && (
                  <span className="text-[10px] uppercase tracking-wider opacity-60 shrink-0" style={{ color: cat.color }}>
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

  const recentAdditions = [...tools].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <div className="hero-mesh grain">
      <HomeStructuredData toolCount={tools.length} />
      {/* Ambient blobs */}
      <div aria-hidden="true" className="hero-blob w-72 h-72 -top-10 -left-16 bg-brand-300/30 dark:bg-brand-500/20" />
      <div aria-hidden="true" className="hero-blob w-80 h-80 top-24 -right-20 bg-brand-200/40 dark:bg-brand-700/20" />
      <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-12 relative">
        <section className="text-center pt-10 pb-6 sm:pt-16 sm:pb-8 md:pt-20 md:pb-10 max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-200 bg-brand-50 dark:bg-brand-950 border border-brand-200/60 dark:border-brand-800/60 rounded-full px-3 py-1.5 mb-4 animate-fade-up">
            <LucideIcons.ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Private by design — runs in your browser
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] animate-fade-up">
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 dark:from-brand-200 dark:via-brand-300 dark:to-brand-400 bg-clip-text text-transparent">{tools.length} Free</span>{" "}
            Online Tools
          </h1>
          <p className="text-text-secondary text-[15px] sm:text-lg max-w-xl mx-auto mt-3 mb-6 animate-fade-up animate-fade-up-d1 leading-relaxed">
            Professional-grade tools for PDF, images, text, video, and development.
            No uploads, no signup — your files never leave your device.
          </p>
          <div className="relative z-30 animate-fade-up animate-fade-up-d2">
            <HeroSearch />
          </div>
          {/* Polished stat bar */}
          <dl className="mt-6 inline-flex items-stretch divide-x divide-border-soft bg-surface/90 backdrop-blur border border-border-soft rounded-[18px] shadow-resting px-1 py-1 animate-fade-up animate-fade-up-d3 max-w-full overflow-x-auto">
            {[
              { icon: LucideIcons.Grid3x3, value: String(tools.length), label: "Tools", tint: "text-accent" },
              { icon: LucideIcons.Lock, value: "Zero", label: "Uploads", tint: "text-success" },
              { icon: LucideIcons.Heart, value: "100%", label: "Free", tint: "text-rose-500" },
              { icon: LucideIcons.Zap, value: "Local", label: "Processing", tint: "text-warning" },
            ].map(({ icon: Icon, value, label, tint }) => (
              <div key={label} className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5 min-w-0">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-surface-hover shrink-0">
                  <Icon className={`w-4 h-4 ${tint}`} aria-hidden="true" />
                </span>
                <span className="text-left leading-none">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-sm font-bold text-text-primary">{value}</dd>
                  <dd className="text-[11px] text-text-secondary mt-0.5">{label}</dd>
                </span>
              </div>
            ))}
          </dl>
        </section>

        {/* Recently Added — keeps homepage feeling alive */}
        <section aria-label="Recently added tools" className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-heading font-semibold tracking-tight flex items-center gap-2 text-text-primary">
              <span className="flex items-center justify-center w-7 h-7 rounded-[10px] bg-success-soft border border-success-border">
                <LucideIcons.Sparkles className="w-4 h-4 text-success" aria-hidden="true" />
              </span>
              Recently Added
            </h2>
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">New &amp; updated</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {recentAdditions.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {favTools.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-heading font-semibold flex items-center gap-2 text-amber-500 mb-3">
              <LucideIcons.Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Favorites
            </h2>
            <div className="flex overflow-x-auto gap-2 pb-1.5 -mx-4 px-4 snap-x md:flex-wrap md:overflow-visible md:mx-0 md:px-0">
              {favTools.map((tool) => {
                const cat = categories.find((c) => c.id === tool.category)!;
                const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full border border-border-soft bg-surface text-xs hover:border-accent/40 hover:bg-accent/5 transition-all whitespace-nowrap snap-start shrink-0 min-h-[36px] sm:min-h-0"
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
              <LucideIcons.Clock className="w-4 h-4 text-accent" /> Recently Used
            </h2>
            <div className="flex overflow-x-auto gap-2 pb-1.5 -mx-4 px-4 snap-x">
              {recentTools.map((tool) => {
                const cat = categories.find((c) => c.id === tool.category)!;
                const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-full border border-border-soft bg-surface text-xs hover:border-accent/40 hover:bg-accent/5 transition-all whitespace-nowrap snap-start shrink-0 min-h-[36px] sm:min-h-0"
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
            <section key={cat.id} className="mb-8 sm:mb-12">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base font-heading font-semibold tracking-tight flex items-center gap-2.5">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-[12px] border"
                    style={{ backgroundColor: `${cat.color}14`, borderColor: `${cat.color}26`, color: cat.color }}
                  >
                    {(() => {
                      const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
                      return <CatIcon className="w-4 h-4" aria-hidden="true" />;
                    })()}
                  </span>
                  <span className="text-text-primary">{cat.label}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary">{cat.items.length}</span>
                </h2>
                <Link
                  href={`/category/${cat.id}`}
                  className="group inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-accent border border-border-soft hover:border-accent/40 bg-surface hover:bg-brand-50 dark:hover:bg-brand-950 rounded-full px-3 py-2 min-h-[36px] transition-all duration-200 ease-out"
                >
                  View all <LucideIcons.ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
