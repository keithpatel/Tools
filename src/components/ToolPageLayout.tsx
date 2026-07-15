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

const ChainInputContext = createContext<PendingOutput | null>(null);
export const useChainInput = () => useContext(ChainInputContext);

function InfoSection({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`seen_tool_info_${slug}`);
    setOpen(seen !== "true");
    setInit(true);
  }, [slug]);

  useEffect(() => {
    if (init) localStorage.setItem(`seen_tool_info_${slug}`, String(!open));
  }, [open, init, slug]);

  const tm = toolMeta[slug];
  if (!tm) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-1"
      >
        <LucideIcons.ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
        <span>About This Tool &middot; How to Use &middot; FAQ</span>
      </button>

      {open && (
        <div className="space-y-6 mt-4">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-3">
            <h2 className="text-lg font-heading font-semibold">About This Tool</h2>
            {tm.body.map((p, i) => (
              <p key={i} className="text-sm text-text-secondary leading-relaxed">{p}</p>
            ))}
          </div>

          {tm.howTo.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-semibold mb-2">How to Use</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm text-text-secondary">
                {tm.howTo.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {tm.faq.length > 0 && (
            <div>
              <h2 className="text-lg font-heading font-semibold mb-3">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {tm.faq.map((item, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-medium mb-0.5">{item.q}</h3>
                    <p className="text-sm text-text-secondary">{item.a}</p>
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
    <div className="max-w-7xl mx-auto px-4 py-6">
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

      <div className="flex gap-8">
        <CategorySidebar currentSlug={slug} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${cat?.color}12` }}>
              <Icon className="w-5 h-5" style={{ color: cat?.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-heading font-bold" id="tool-top">{tool.name}</h1>
                <button
                  onClick={() =>
                    setFavorites((prev: string[]) =>
                      isFav ? prev.filter((s) => s !== slug) : [...prev, slug]
                    )
                  }
                  className="p-1 rounded hover:bg-surface-hover transition-colors"
                  aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                >
                  <LucideIcons.Star
                    className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-400" : "text-text-secondary/40"}`}
                  />
                </button>
              </div>
              <p className="text-sm text-text-secondary">{tool.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mb-6 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full w-fit">
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
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-surface-raised border border-border rounded-full shadow-lg text-sm text-text-primary hover:text-accent transition-all"
            >
              <LucideIcons.ArrowUp className="w-4 h-4" />
              Back to tool
            </a>
          )}

          {meta && <InfoSection slug={slug} />}
        </div>
      </div>
    </div>
  );
}
