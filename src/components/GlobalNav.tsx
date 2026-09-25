"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { CommandPalette } from "./CommandPalette";
import * as LucideIcons from "lucide-react";
import { tools, categories } from "@/data/tools";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/lib/useFavorites";

export function GlobalNav() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const [drawerIntent, setDrawerIntent] = useState<"menu" | "search" | "favorites" | "recent">("menu");
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() || "";
  const { value: favorites } = useFavorites();

  // Open drawer with a specific intent
  const openDrawer = (intent: "menu" | "search" | "favorites" | "recent") => {
    setDrawerIntent(intent);
    setMobileSearch("");
    setMobileNavOpen(true);
  };

  // Auto-focus search input when drawer opens with search intent
  useEffect(() => {
    if (mobileNavOpen && drawerIntent === "search" && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [mobileNavOpen, drawerIntent]);

  // Close desktop menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  // Determine current context for Mobile Title & Back Button navigation
  const currentTool = pathname.startsWith("/tools/")
    ? tools.find((t) => t.slug === pathname.split("/").pop())
    : null;
  const currentCategory = pathname.startsWith("/category/")
    ? categories.find((c) => c.id === pathname.split("/").pop())
    : null;

  let mobileTitle = "MultiTool";
  let backUrl = "/";
  let hasBack = false;

  if (currentTool) {
    mobileTitle = currentTool.name;
    backUrl = `/category/${currentTool.category}`;
    hasBack = true;
  } else if (currentCategory) {
    mobileTitle = currentCategory.label;
    backUrl = "/";
    hasBack = true;
  } else if (pathname === "/about") {
    mobileTitle = "About";
    backUrl = "/";
    hasBack = true;
  }

  // Filtered tools in Mobile Drawer Search
  const filteredTools = mobileSearch
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(mobileSearch.toLowerCase()) ||
          t.description.toLowerCase().includes(mobileSearch.toLowerCase())
      )
    : [];

  const favoriteTools = tools.filter((t) => favorites.includes(t.slug));

  return (<>
    <header
      className="sticky top-0 z-40 border-b border-border-soft bg-surface/85 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Desktop Header Layout */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 h-14 items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading font-semibold text-base shrink-0 hover:text-accent transition-colors"
        >
          <LucideIcons.Wrench className="w-5 h-5 text-accent" />
          <span>MultiTool</span>
        </Link>

        {/* Categories Menu Trigger */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent px-3 py-1.5 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="All tools menu"
            aria-expanded={menuOpen}
          >
            <LucideIcons.Grid3x3 className="w-4 h-4" />
            <span>Tools</span>
            <LucideIcons.ChevronDown className={cn("w-3.5 h-3.5 transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 w-[600px] bg-surface-raised rounded-xl shadow-xl border border-border p-4 grid grid-cols-5 gap-4 z-50">
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
                      {items.map((t) => {
                        const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
                        return (
                          <li key={t.id}>
                            <Link
                              href={`/tools/${t.slug}`}
                              className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs text-text-secondary hover:bg-surface-hover hover:text-accent transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <Icon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{t.name}</span>
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

        {/* Global actions */}
        <div className="flex items-center gap-2 ml-auto">
          <CommandPalette />
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <LucideIcons.Sun className="w-4 h-4" /> : <LucideIcons.Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile-Native Header Layout */}
      <div className="flex md:hidden max-w-7xl mx-auto px-4 h-14 items-center justify-between w-full">
        {hasBack ? (
          <Link
            href={backUrl}
            className="flex items-center gap-1.5 text-text-primary hover:text-accent active:scale-95 transition-all py-1.5"
            aria-label={`Go back to ${mobileTitle}`}
          >
            <LucideIcons.ChevronLeft className="w-6 h-6" />
            <span className="font-heading font-semibold text-sm max-w-[180px] truncate">{mobileTitle}</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1.5 font-heading font-bold text-base hover:text-accent active:scale-97 transition-all"
          >
            <LucideIcons.Wrench className="w-5 h-5 text-accent" />
            <span>MultiTool</span>
          </Link>
        )}

        <div className="flex items-center gap-1">
          {/* Main mobile consolidated menu/overflow trigger */}
          <button
            onClick={() => openDrawer("menu")}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-90 transition-all cursor-pointer"
            aria-label="Open mobile menu"
          >
            <LucideIcons.Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile-Native Overflow Slide-In Drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Menu Drawer */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] z-50 bg-surface-raised border-l border-border shadow-2xl p-4 flex flex-col md:hidden overflow-hidden"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4 shrink-0">
                <div className="flex items-center gap-2 font-heading font-bold text-sm">
                  <LucideIcons.Wrench className="w-4 h-4 text-accent" />
                  <span>MultiTool Navigation</span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <LucideIcons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search */}
              <div className="relative mb-4 shrink-0">
                <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${tools.length}+ offline tools...`}
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                />
                {mobileSearch && (
                  <button
                    onClick={() => setMobileSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary p-0.5 hover:text-text-primary"
                  >
                    <LucideIcons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Drawer Content Area */}
              <div className="flex-1 overflow-y-auto space-y-5 pb-8">
                {mobileSearch ? (
                  /* Search Results Mode */
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                      Search Results ({filteredTools.length})
                    </h3>
                    {filteredTools.length > 0 ? (
                      <div className="space-y-1.5">
                        {filteredTools.map((t) => {
                          const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
                          return (
                            <Link
                              key={t.id}
                              href={`/tools/${t.slug}`}
                              onClick={() => setMobileNavOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-xl text-sm hover:bg-surface text-text-secondary hover:text-text-primary transition-all active:scale-99"
                            >
                              <Icon className="w-4 h-4 shrink-0 text-accent" />
                              <div className="min-w-0">
                                <div className="font-semibold truncate text-text-primary">{t.name}</div>
                                <div className="text-xs opacity-80 truncate">{t.description}</div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-sm text-text-secondary">
                        No matches found for "{mobileSearch}"
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard List Mode */
                  <>
                    {/* General Settings Row */}
                    <div className="bg-surface rounded-xl p-3 border border-border space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-text-primary">Theme Mode</span>
                        <button
                          onClick={toggle}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover hover:text-accent transition-all active:scale-95"
                        >
                          {theme === "dark" ? (
                            <>
                              <LucideIcons.Sun className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Light</span>
                            </>
                          ) : (
                            <>
                              <LucideIcons.Moon className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Dark</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="border-t border-border pt-2.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-text-primary font-heading">MultiTool Info</span>
                        <Link
                          href="/about"
                          onClick={() => setMobileNavOpen(false)}
                          className="text-xs text-accent font-semibold hover:underline"
                        >
                          About Us &rarr;
                        </Link>
                      </div>
                    </div>

                    {/* Favorites Section (if present) */}
                    {favoriteTools.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1">
                          <LucideIcons.Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>Favorites</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {favoriteTools.map((t) => (
                            <Link
                              key={t.id}
                              href={`/tools/${t.slug}`}
                              onClick={() => setMobileNavOpen(false)}
                              className="flex items-center gap-1.5 p-2 bg-surface rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary transition-all active:scale-97"
                            >
                              <span className="truncate">{t.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Categories list */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                        Categories
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => {
                          const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
                          return (
                            <Link
                              key={cat.id}
                              href={`/category/${cat.id}`}
                              onClick={() => setMobileNavOpen(false)}
                              className="flex items-center gap-2 p-2 bg-surface rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary hover:border-accent/35 transition-all active:scale-97"
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                              <span className="truncate">{cat.label}</span>
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
    </header>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", height: "60px" }}
      >
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full rounded-lg transition-colors ${
            pathname === "/" ? "text-accent" : "text-text-secondary hover:text-text-primary"
          }`}
          aria-label="Home"
        >
          <LucideIcons.House className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Home</span>
        </Link>

        <button
          onClick={() => openDrawer("search")}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Search tools"
        >
          <LucideIcons.Search className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Search</span>
        </button>

        <button
          onClick={() => openDrawer("favorites")}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Favorites"
        >
          <LucideIcons.Star className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Favorites</span>
        </button>

        <button
          onClick={() => openDrawer("recent")}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Recent"
        >
          <LucideIcons.Clock className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Recent</span>
        </button>

        <button
          onClick={() => openDrawer("menu")}
          className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Menu"
        >
          <LucideIcons.Grid3x3 className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">Menu</span>
        </button>
      </nav>
    </>
  );
}
