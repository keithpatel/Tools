"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { tools, categories, getToolsByCategory, type CategoryId } from "@/data/tools";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function MobileSheet({
  open,
  onClose,
  currentSlug,
  cat,
  siblings,
}: {
  open: boolean;
  onClose: () => void;
  currentSlug: string;
  cat: { id: string; label: string; icon: string; color: string };
  siblings: typeof tools;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
  const filteredTools = searchQuery
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (!open) setSearchQuery("");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-surface-raised rounded-t-2xl shadow-2xl z-50 overflow-hidden flex flex-col lg:hidden"
          >
            <div className="w-12 h-1.5 bg-text-secondary/20 rounded-full mx-auto my-3 shrink-0 cursor-grab active:cursor-grabbing" />
            <div className="px-4 pb-3 flex items-center justify-between border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${cat.color}12` }}>
                  <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-heading font-bold text-text-primary">{cat.label} Tools</h2>
                  <p className="text-xs text-text-secondary">Browse or search all tools</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <LucideIcons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-surface border-b border-border shrink-0">
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search 50+ offline tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/70"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                    aria-label="Clear search"
                  >
                    <LucideIcons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto px-4 py-4 space-y-4 flex-1 pb-16">
              {searchQuery ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                    Search Results ({filteredTools.length})
                  </h3>
                  {filteredTools.length > 0 ? (
                    <div className="space-y-1">
                      {filteredTools.map((t) => {
                        const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
                        const active = t.slug === currentSlug;
                        return (
                          <Link
                            key={t.id}
                            href={`/tools/${t.slug}`}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-150 active:scale-99 min-h-[44px]",
                              active
                                ? "bg-accent/15 text-accent font-semibold"
                                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{t.name}</div>
                              <div className="text-xs opacity-80 truncate">{t.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-text-secondary">
                      No tools found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Tools in this category
                    </h3>
                    <nav className="space-y-1" aria-label="Category tools">
                      {siblings.map((s) => {
                        const Icon = (LucideIcons as any)[s.icon] || LucideIcons.File;
                        const active = s.slug === currentSlug;
                        return (
                          <Link
                            key={s.id}
                            href={`/tools/${s.slug}`}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-150 active:scale-99 min-h-[44px]",
                              active
                                ? "bg-accent/15 text-accent font-semibold"
                                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                            )}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon className="w-4.5 h-4.5 shrink-0" />
                            <span className="truncate">{s.name}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Other Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {categories
                        .filter((c) => c.id !== cat.id)
                        .map((c) => {
                          const Icon = (LucideIcons as any)[c.icon] || LucideIcons.Folder;
                          return (
                            <Link
                              key={c.id}
                              href={`/category/${c.id}`}
                              onClick={onClose}
                              className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all active:scale-97"
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                              <span className="truncate">{c.label}</span>
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CategorySidebar({ currentSlug }: { currentSlug: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tool = tools.find((t) => t.slug === currentSlug);
  if (!tool) return null;

  const cat = categories.find((c) => c.id === tool.category)!;
  const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
  const siblings = getToolsByCategory(tool.category as CategoryId);

  return (
    <>
      {/* Mobile trigger button (hidden on desktop) */}
      <div className="block lg:hidden w-full">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-between w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover hover:border-accent/40 active:scale-98 transition-all duration-150 mb-4 cursor-pointer"
          aria-label="Show tools in this category"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${cat.color}12` }}>
              <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
            </div>
            <span className="font-bold">{cat.label} Tools</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <span>{siblings.length} tools</span>
            <LucideIcons.ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      <MobileSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currentSlug={currentSlug}
        cat={cat}
        siblings={siblings}
      />

      {/* Desktop Sidebar (stays hidden on mobile, visible on desktop lg screen) */}
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
