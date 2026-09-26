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
import { ToolErrorBoundary } from "./ToolErrorBoundary";
import { OfflineBadge } from "./OfflineBadge";

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
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting p-5">
            <h2 className="text-[15px] font-heading font-semibold tracking-tight mb-2">About This Tool</h2>
            <div className="space-y-2.5">
              {tm.body.map((p, i) => (
                <p key={i} className="text-sm text-text-secondary leading-relaxed">{p}</p>
              ))}
            </div>
            {tm.benefits && tm.benefits.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border-soft">
                <h3 className="text-sm font-heading font-semibold mb-2">Key Benefits</h3>
                <ul className="space-y-1.5 text-sm text-text-secondary">
                  {tm.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <LucideIcons.Check className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {tm.howTo.length > 0 && (
              <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting p-5">
                <h2 className="text-[15px] font-heading font-semibold tracking-tight mb-3">How to Use</h2>
                <ol className="space-y-2.5">
                  {tm.howTo.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-200 text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {tm.faq.length > 0 && (
              <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting p-5">
                <h2 className="text-[15px] font-heading font-semibold tracking-tight mb-3">Frequently Asked Questions</h2>
                <div className="divide-y divide-border-soft">
                  {tm.faq.map((item, i) => (
                    <details key={i} className="group py-2.5 first:pt-0 last:pb-0">
                      <summary className="flex items-center justify-between gap-2 text-sm font-medium text-text-primary cursor-pointer list-none min-h-[36px] [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <LucideIcons.ChevronDown className="w-4 h-4 text-text-secondary shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <p className="text-sm text-text-secondary leading-relaxed mt-1.5 pr-6">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
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
    try {
      const raw = localStorage.getItem("multitool-history");
      const parsed = raw ? JSON.parse(raw) : [];
      const arr: { slug: string; ts: number }[] = Array.isArray(parsed) ? parsed : [];
      const next = [{ slug, ts: Date.now() }, ...arr.filter((e) => e.slug !== slug)].slice(0, 10);
      localStorage.setItem("multitool-history", JSON.stringify(next));
    } catch {
      // Corrupted history — reset it rather than crash the page
      try {
        localStorage.setItem("multitool-history", JSON.stringify([{ slug, ts: Date.now() }]));
      } catch {}
    }
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
    if (incoming) {
      setChainInput(incoming);
    } else {
      // Fresh tool open (no chained output) — start at the top.
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="mb-4 flex items-center gap-2 text-sm bg-info-soft text-info-text px-4 py-2.5 rounded-[14px] border border-info-border">
          <LucideIcons.ArrowRight className="w-4 h-4 shrink-0" />
          <span>
            Output from <strong>{sourceTool.name}</strong> loaded — ready to process
          </span>
          <button
            onClick={() => setChainInput(null)}
            className="ml-auto p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-info-soft rounded-lg transition-all duration-200 cursor-pointer"
            aria-label="Dismiss"
          >
            <LucideIcons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <CategorySidebar currentSlug={slug} />

        <div className="flex-1 min-w-0 pb-28 md:pb-8">
          <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting p-4 sm:p-5 mb-3 md:mb-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] shrink-0 border"
                style={{ backgroundColor: `${cat?.color}14`, borderColor: `${cat?.color}26` }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: cat?.color }} aria-hidden="true" />
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
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[12px] hover:bg-surface-hover transition-all duration-200 ease-out cursor-pointer"
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
            <div className="mt-3 pt-3 border-t border-border-soft flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-success-text bg-success-soft border border-success-border rounded-full px-3 py-1.5">
                <LucideIcons.Lock className="w-3.5 h-3.5" aria-hidden="true" />
                Processed locally — your files never leave your device
              </span>
              <OfflineBadge slug={slug} />
            </div>
          </div>

          <div ref={toolRef} className="rounded-[18px] border border-border-soft bg-surface-raised shadow-resting p-4 sm:p-6">
            <ChainInputContext.Provider value={chainInput}>
              <ToolErrorBoundary toolName={tool.name}>{children}</ToolErrorBoundary>
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

          <div className="rounded-[18px] border border-border-soft bg-surface shadow-resting p-4 sm:p-5 mt-4">
            <RelatedTools slug={slug} bare />
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedTools({ slug, bare = false }: { slug: string; bare?: boolean }) {
  const related = getRelatedTools(slug, 4);
  if (related.length === 0) return null;
  const body = (
    <>
      <h2 className="text-[15px] font-heading font-semibold tracking-tight mb-1">You Might Also Need</h2>
      <p className="text-sm text-text-secondary mb-4">Related free tools that run in your browser.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((t) => {
          const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
          const rc = categories.find((c) => c.id === t.category);
          return (
            <Link
              key={t.slug}
              href={`/tools/${t.slug}`}
              className="group flex items-center gap-3 p-3 rounded-[14px] border border-border-soft bg-surface hover:border-accent/40 hover:shadow-hover hover:-translate-y-px transition-all duration-200 ease-out min-h-[44px]"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-[12px] shrink-0 border" style={{ backgroundColor: `${rc?.color}14`, borderColor: `${rc?.color}22` }}>
                <Icon className="w-4 h-4" style={{ color: rc?.color }} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold truncate group-hover:text-accent transition-colors duration-200">{t.name}</span>
                <span className="block text-xs text-text-secondary truncate">{t.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
  if (bare) return <section aria-label="Related tools">{body}</section>;
  return (
    <section aria-label="Related tools" className="mt-8 md:mt-10 border-t border-border-soft pt-4 md:pt-6">
      {body}
    </section>
  );
}
