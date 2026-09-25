"use client";

import { type ReactNode, useEffect, useState, useRef, createContext, useContext } from "react";
import * as LucideIcons from "lucide-react";
import { getToolBySlug, categories } from "@/data/tools";
import { Breadcrumbs } from "./Breadcrumbs";
import { CategorySidebar } from "./CategorySidebar";
import { useFavorites } from "@/lib/useFavorites";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { getToolBySlug as getTool } from "@/data/tools";
import Link from "next/link";
import { toolMeta } from "./ToolMeta";
import type { PendingOutput } from "@/data/workflow";
import { StructuredData } from "./StructuredData";
import { getRelatedTools } from "@/lib/seo";

const ChainInputContext = createContext<PendingOutput | null>(null);
export const useChainInput = () => useContext(ChainInputContext);

function InfoSection({ slug }: { slug: string }) {
  // Default open on first render (including SSR) so About/How-to/Benefits/FAQ
  // are present in the static HTML for crawlers; the effect below then
  // applies the user's persisted/collapsed preference on the client.
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const seen = localStorage.getItem(`seen_tool_info_${slug}`);
      return seen !== "true" && window.innerWidth >= 768;
    } catch {
      return true;
    }
  });
  const [init, setInit] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`seen_tool_info_${slug}`);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    setOpen(seen !== "true" && !isMobile);
    setInit(true);
  }, [slug]);

  useEffect(() => {
    if (init) localStorage.setItem(`seen_tool_info_${slug}`, String(!open));
  }, [open, init, slug]);

  const tm = toolMeta[slug];
  if (!tm) return null;

  return (
    <section className="mt-6 md:mt-12 border-t border-border-soft pt-4 md:pt-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-1 w-full"
      >
        <LucideIcons.ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
        <span>About This Tool &middot; How to Use &middot; FAQ</span>
      </button>

      {open && (
        <div className="space-y-8 mt-5">
          <div className="space-y-3">
            <h2 className="text-lg font-heading font-semibold">About This Tool</h2>
            {tm.body.map((p, i) => (
              <p key={i} className="text-sm text-text-secondary leading-relaxed">{p}</p>
            ))}
          </div>

          {tm.howTo.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-semibold mb-3">How to Use</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-text-secondary">
                {tm.howTo.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {tm.benefits && tm.benefits.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-semibold mb-3">Key Benefits</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-text-secondary">
                {tm.benefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {tm.faq.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {tm.faq.map((item, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-medium mb-1">{item.q}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function ToolPageLayout({ slug, children }: { slug: string; children: ReactNode }) {
  const tool = getToolBySlug(slug);
  const { value: favorites, update: setFavorites } = useFavorites();
  const toolRef = useRef<HTMLDivElement>(null);
  const [showBackLink, setShowBackLink] = useState(false);
  const { consumeOutput } = useWorkflowStore();
  const [chainInput, setChainInput] = useState<PendingOutput | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("multitool-history");
    const arr: { slug: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const next = [{ slug, ts: Date.now() }, ...arr.filter((e) => e.slug !== slug)].slice(0, 10);
    localStorage.setItem("multitool-history", JSON.stringify(next));
  }, [slug]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowBackLink(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (toolRef.current) observer.observe(toolRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const incoming = consumeOutput();
    if (incoming) setChainInput(incoming);
  }, [consumeOutput]);

  if (!tool) {
    return <div className="text-center py-12 text-text-secondary">Tool not found</div>;
  }

  const cat = categories.find((c) => c.id === tool.category);
  const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
  const isFav = favorites.includes(slug);
  const meta = toolMeta[slug];
  const sourceTool = chainInput ? getTool(chainInput.sourceToolSlug) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
      <StructuredData slug={slug} />
      <Breadcrumbs category={tool.category} toolName={tool.name} />

      {chainInput && sourceTool && (
        <div className="mb-4 flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-900">
          <LucideIcons.ArrowRight className="w-4 h-4 shrink-0" />
          <span>
            Output from <strong>{sourceTool.name}</strong> loaded — ready to process
          </span>
          <button
            onClick={() => setChainInput(null)}
            className="ml-auto p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
            aria-label="Dismiss"
          >
            <LucideIcons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <CategorySidebar currentSlug={slug} />

        <div className="flex-1 min-w-0 pb-28 md:pb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-2.5 sm:mb-2">
            <div className="p-2 sm:p-2.5 rounded-2xl shrink-0 shadow-xs bg-surface" style={{ boxShadow: `0 0 0 1px ${cat?.color}22, 0 4px 16px 0 ${cat?.color}14` }}>
              <Icon className="w-5 h-5" style={{ color: cat?.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight truncate" id="tool-top">{tool.name}</h1>
                <button
                  onClick={() =>
                    setFavorites((prev: string[]) =>
                      isFav ? prev.filter((s) => s !== slug) : [...prev, slug]
                    )
                  }
                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <LucideIcons.Star
                    className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-400" : "text-text-secondary/40 hover:text-amber-400"}`}
                  />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5 line-clamp-2">{tool.description}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50/70 dark:bg-green-950/30 px-3 py-1.5 rounded-full mb-3 md:mb-6">
            <LucideIcons.Shield className="w-3.5 h-3.5" />
            Runs entirely in your browser — files are never uploaded
          </div>

          <div ref={toolRef}>
            <ChainInputContext.Provider value={chainInput}>
              {children}
            </ChainInputContext.Provider>
          </div>

          {showBackLink && (
            <a
              href="#tool-top"
              className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border rounded-full shadow-lg text-sm text-text-primary hover:text-accent transition-all min-h-[44px]"
            >
              <LucideIcons.ArrowUp className="w-4 h-4" />
              Back to tool
            </a>
          )}

          {meta && <InfoSection slug={slug} />}

          <RelatedTools slug={slug} />
        </div>
      </div>
    </div>
  );
}

function RelatedTools({ slug }: { slug: string }) {
  const related = getRelatedTools(slug, 4);
  if (related.length === 0) return null;
  return (
    <section className="mt-8 md:mt-10 border-t border-border-soft pt-4 md:pt-6">
      <h2 className="text-lg font-heading font-semibold mb-1">You Might Also Need</h2>
      <p className="text-sm text-text-secondary mb-4">Related free tools that run in your browser.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((t) => {
          const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
          const rc = categories.find((c) => c.id === t.category);
          return (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-surface hover:border-accent/40 transition-colors"
            >
              <span className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${rc?.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: rc?.color }} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{t.name}</span>
                <span className="block text-xs text-text-secondary truncate">{t.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
