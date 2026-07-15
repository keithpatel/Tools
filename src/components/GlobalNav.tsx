"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { CommandPalette } from "./CommandPalette";
import * as LucideIcons from "lucide-react";
import { tools, categories } from "@/data/tools";
import { cn } from "@/lib/utils";

export function GlobalNav() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold text-base shrink-0 hover:text-accent transition-colors">
          <LucideIcons.Wrench className="w-5 h-5 text-accent" />
          <span className="hidden sm:inline">MultiTool</span>
        </Link>

        <div ref={menuRef} className="relative hidden md:block">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="All tools menu"
            aria-expanded={menuOpen}
          >
            <LucideIcons.Grid3x3 className="w-4 h-4" />
            <span>Tools</span>
            <LucideIcons.ChevronDown className={cn("w-3.5 h-3.5 transition-transform", menuOpen && "rotate-180")} />
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 w-[600px] bg-surface-raised rounded-xl shadow-xl border border-border p-4 grid grid-cols-5 gap-4">
              {categories.map((cat) => {
                const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
                const items = tools.filter((t) => t.category === cat.id);
                return (
                  <div key={cat.id}>
                    <Link
                      href={`/category/${cat.id}`}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 hover:opacity-80 transition-opacity"
                      style={{ color: cat.color }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                      {cat.label}
                    </Link>
                    <ul className="space-y-0.5">
                      {items.map((tool) => {
                        const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                        return (
                          <li key={tool.id}>
                            <Link
                              href={`/tools/${tool.slug}`}
                              className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <Icon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{tool.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <CommandPalette />
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <LucideIcons.Sun className="w-4 h-4" /> : <LucideIcons.Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors md:hidden"
            aria-label="Open navigation menu"
          >
            <LucideIcons.Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-3 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="relative">
              <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              <input
                type="text"
                placeholder="Search tools..."
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
              />
            </div>
            {categories.map((cat) => {
              const CatIcon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
              const items = tools.filter((t) => t.category === cat.id && (!mobileSearch || t.name.toLowerCase().includes(mobileSearch.toLowerCase()) || t.description.toLowerCase().includes(mobileSearch.toLowerCase())));
              if (mobileSearch && items.length === 0) return null;
              return (
                <div key={cat.id}>
                  <Link
                    href={`/category/${cat.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: cat.color }}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    {cat.label}
                  </Link>
                  <div className="space-y-0.5 ml-5">
                    {items.map((tool) => {
                      const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.File;
                      return (
                        <Link
                          key={tool.id}
                          href={`/tools/${tool.slug}`}
                          className="flex items-center gap-2 py-1.5 text-sm text-text-secondary hover:text-accent"
                          onClick={() => { setMobileNavOpen(false); setMobileSearch(""); }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tool.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
