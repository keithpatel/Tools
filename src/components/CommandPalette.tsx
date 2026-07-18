"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { tools, categories } from "@/data/tools";
import { type HistoryEntry } from "@/lib/useHistory";

const RECENT_KEY = "multitool-cmd-recent";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = useCallback(
    (slug: string) => {
      setOpen(false);
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      const next = [slug, ...stored.filter((s) => s !== slug)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      router.push(`/tools/${slug}`);
    },
    [router]
  );

  const recentSlugs: string[] =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(RECENT_KEY) || "[]")
      : [];

  const recentTools = recentSlugs
    .map((s) => tools.find((t) => t.slug === s)!)
    .filter(Boolean);

  const historyRaw: HistoryEntry[] =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("multitool-history") || "[]")
      : [];

  const historyTools = historyRaw
    .map((e) => tools.find((t) => t.slug === e.slug)!)
    .filter(Boolean)
    .slice(0, 5);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-text-secondary border border-border rounded-lg px-3 py-1.5 hover:border-accent/40 transition-colors"
        aria-label="Open command palette"
      >
        <LucideIcons.Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search tools...</span>
        <kbd className="hidden sm:inline text-[10px] bg-surface-hover px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-surface-raised rounded-xl shadow-xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Tool search">
              <div className="flex items-center border-b border-border px-3">
                <LucideIcons.Search className="w-4 h-4 text-text-secondary shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder={"Search all " + tools.length + " tools..."}
                  className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-text-secondary"
                />
              </div>
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="text-center text-sm text-text-secondary py-6">
                  No tools found.
                </Command.Empty>
                {recentTools.length > 0 && (
                  <Command.Group heading="Recent">
                    {recentTools.map((tool) => {
                      const cat = categories.find((c) => c.id === tool.category)!;
                      const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                      return (
                        <Command.Item
                          key={tool.slug}
                          onSelect={() => run(tool.slug)}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-surface-hover"
                        >
                          <Icon className="w-4 h-4" style={{ color: cat.color }} />
                          <span>{tool.name}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider opacity-50" style={{ color: cat.color }}>
                            {cat.label}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}
                {historyTools.length > 0 && (
                  <Command.Group heading="History">
                    {historyTools.map((tool) => {
                      const cat = categories.find((c) => c.id === tool.category)!;
                      const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                      return (
                        <Command.Item
                          key={tool.slug}
                          onSelect={() => run(tool.slug)}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-surface-hover"
                        >
                          <LucideIcons.Clock className="w-3.5 h-3.5 text-text-secondary" />
                          <span>{tool.name}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider opacity-50" style={{ color: cat.color }}>
                            {cat.label}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}
                {categories.map((cat) => {
                  const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
                  const items = tools.filter((t) => t.category === cat.id);
                  return (
                    <Command.Group key={cat.id} heading={cat.label}>
                      {items.map((tool) => {
                        const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                        return (
                          <Command.Item
                            key={tool.slug}
                            onSelect={() => run(tool.slug)}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-surface-hover"
                          >
                            <Icon className="w-4 h-4" style={{ color: cat.color }} />
                            <span>{tool.name}</span>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
