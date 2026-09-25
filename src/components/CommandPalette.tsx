"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { tools, categories } from "@/data/tools";
import { type HistoryEntry } from "@/lib/useHistory";

const RECENT_KEY = "multitool-cmd-recent";

export function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      if (isControlled) {
        const next = typeof val === "function" ? val(open) : val;
        onOpenChange?.(next);
      } else {
        setInternalOpen(val);
      }
    },
    [isControlled, open, onOpenChange]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [setOpen]);

  // Lock body scroll on mobile when command palette is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const run = useCallback(
    (slug: string) => {
      setOpen(false);
      const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      const next = [slug, ...stored.filter((s) => s !== slug)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      router.push(`/tools/${slug}`);
    },
    [router, setOpen]
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
      {showTrigger && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs text-text-secondary border border-border rounded-lg px-2.5 sm:px-3 py-1.5 hover:border-accent/40 transition-colors min-h-[36px] sm:min-h-0"
          aria-label="Open command palette"
        >
          <LucideIcons.Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search tools...</span>
          <kbd className="hidden sm:inline text-[10px] bg-surface-hover px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 pt-0 sm:pt-[15vh] bg-black/60 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-lg bg-surface-raised sm:rounded-2xl shadow-2xl border-0 sm:border border-border flex flex-col overflow-hidden"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Tool search" className="flex flex-col h-full sm:h-auto">
              <div className="flex items-center border-b border-border px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 gap-2">
                <LucideIcons.Search className="w-5 h-5 sm:w-4 sm:h-4 text-text-secondary shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder={"Search " + tools.length + " tools..."}
                  className="w-full bg-transparent px-2 py-1.5 text-base sm:text-sm outline-none placeholder:text-text-secondary text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="sm:hidden text-xs font-semibold text-accent px-2 py-1.5 rounded-lg active:opacity-70 min-h-[44px] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <Command.List className="flex-1 sm:max-h-80 overflow-y-auto p-2 pb-24 sm:pb-2">
                <Command.Empty className="text-center text-sm text-text-secondary py-8">
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
                          className="flex items-center gap-3 px-3 py-3 sm:py-2 rounded-xl text-sm cursor-pointer aria-selected:bg-surface-hover min-h-[44px]"
                        >
                          <Icon className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                          <span className="truncate">{tool.name}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60 shrink-0" style={{ color: cat.color }}>
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
                      return (
                        <Command.Item
                          key={tool.slug}
                          onSelect={() => run(tool.slug)}
                          className="flex items-center gap-3 px-3 py-3 sm:py-2 rounded-xl text-sm cursor-pointer aria-selected:bg-surface-hover min-h-[44px]"
                        >
                          <LucideIcons.Clock className="w-4 h-4 text-text-secondary shrink-0" />
                          <span className="truncate">{tool.name}</span>
                          <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60 shrink-0" style={{ color: cat.color }}>
                            {cat.label}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}
                {categories.map((cat) => {
                  const items = tools.filter((t) => t.category === cat.id);
                  return (
                    <Command.Group key={cat.id} heading={cat.label}>
                      {items.map((tool) => {
                        const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                        return (
                          <Command.Item
                            key={tool.slug}
                            onSelect={() => run(tool.slug)}
                            className="flex items-center gap-3 px-3 py-3 sm:py-2 rounded-xl text-sm cursor-pointer aria-selected:bg-surface-hover min-h-[44px]"
                          >
                            <Icon className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                            <span className="truncate">{tool.name}</span>
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
