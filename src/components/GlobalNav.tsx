"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { CommandPalette } from "./CommandPalette";
import { Wordmark } from "./Wordmark";
import * as LucideIcons from "lucide-react";
import { tools, categories } from "@/data/tools";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/useFavorites";
import { useHistory } from "@/lib/useHistory";

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
  const { value: favorites, update: setFavorites } = useFavorites();
  const { value: history } = useHistory();

  // Open drawer with a specific intent
  const openDrawer = (intent: "menu" | "search" | "favorites" | "recent") => {
    setDrawerIntent(intent);
    setMobileSearch("");
    setMobileNavOpen(true);
  };

  const openSearch = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-command-palette"));
    }
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

  // Close drawer on Escape
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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
  const recentTools = history
    .map((e) => tools.find((t) => t.slug === e.slug))
    .filter(Boolean) as typeof tools;

  return (
    <>
      <CommandPalette showTrigger={false} />

      <header
        className="sticky top-0 z-40 border-b border-border-soft bg-surface/85 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Desktop Header Layout */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 h-16 items-center gap-3">
          <Wordmark />

          {/* Categories Menu Trigger */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="All tools menu"
              aria-expanded={menuOpen}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full min-h-[40px] transition-all duration-200 ease-out cursor-pointer",
                menuOpen
                  ? "bg-brand-50 dark:bg-brand-950 text-accent"
                  : pathname === "/" || pathname.startsWith("/tools") || pathname.startsWith("/category")
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <LucideIcons.Grid3x3 className="w-4 h-4" aria-hidden="true" />
              <span>Tools</span>
              <LucideIcons.ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", menuOpen && "rotate-180")} />
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
          <div className="flex items-center gap-1.5 ml-auto">
            <Link
              href="/about"
              className={cn(
                "hidden lg:inline-flex items-center text-sm font-medium px-3 py-2 rounded-full min-h-[40px] transition-all duration-200 ease-out",
                pathname === "/about" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              About
            </Link>
            <button
              onClick={toggle}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-[12px] hover:bg-surface-hover transition-all duration-200 ease-out cursor-pointer"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <LucideIcons.Sun className="w-4 h-4" /> : <LucideIcons.Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile-Native Header Layout */}
        <div className="flex md:hidden max-w-7xl mx-auto px-3 sm:px-4 h-14 items-center justify-between w-full">
          {hasBack ? (
            <Link
              href={backUrl}
              className="flex items-center gap-1.5 text-text-primary hover:text-accent active:scale-95 transition-all py-1.5 min-h-[44px]"
              aria-label={`Go back to ${mobileTitle}`}
            >
              <LucideIcons.ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="font-heading font-semibold text-sm max-w-[150px] sm:max-w-[200px] truncate">{mobileTitle}</span>
            </Link>
          ) : (
            <Wordmark />
          )}

          <div className="flex items-center gap-0.5">
            {/* Direct 1-tap mobile search icon */}
            <button
              onClick={openSearch}
              className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Search all tools"
            >
              <LucideIcons.Search className="w-5 h-5" />
            </button>

            {/* Quick theme toggle */}
            <button
              onClick={toggle}
              className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <LucideIcons.Sun className="w-5 h-5" /> : <LucideIcons.Moon className="w-5 h-5" />}
            </button>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => openDrawer("menu")}
              aria-expanded={mobileNavOpen}
              className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Open mobile menu"
            >
              <LucideIcons.Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

      </header>

      {/* Mobile drawer overlay — sibling of <header> (not inside it) so the
          header's backdrop-blur containing block can't squash the fixed
          positioning. CSS transition instead of framer-motion so the drawer
          can never get stuck off-screen if animation fails to run. */}
      <div
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-200",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Menu Drawer */}
      <div
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        aria-hidden={!mobileNavOpen}
        inert={!mobileNavOpen}
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[90%] max-w-[360px] z-[70] bg-surface-raised border-l border-border shadow-2xl p-4 flex flex-col md:hidden overflow-hidden transition-transform duration-300 ease-out",
          mobileNavOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3 shrink-0">
                  <Wordmark />
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                    aria-label="Close menu"
                  >
                    <LucideIcons.X className="w-5 h-5" />
                  </button>
                </div>

                {/* Intent Switching Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-xl border border-border mb-3 shrink-0">
                  <button
                    onClick={() => setDrawerIntent("menu")}
                    className={cn(
                      "py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[36px]",
                      drawerIntent === "menu" ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <LucideIcons.Grid3x3 className="w-3.5 h-3.5" />
                    <span>Categories</span>
                  </button>
                  <button
                    onClick={() => setDrawerIntent("favorites")}
                    className={cn(
                      "py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[36px]",
                      drawerIntent === "favorites" ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <LucideIcons.Star className="w-3.5 h-3.5" />
                    <span>Favorites</span>
                    {favoriteTools.length > 0 && <span className="text-[10px] opacity-80">({favoriteTools.length})</span>}
                  </button>
                  <button
                    onClick={() => setDrawerIntent("recent")}
                    className={cn(
                      "py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 min-h-[36px]",
                      drawerIntent === "recent" ? "bg-accent text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <LucideIcons.Clock className="w-3.5 h-3.5" />
                    <span>Recent</span>
                    {recentTools.length > 0 && <span className="text-[10px] opacity-80">({recentTools.length})</span>}
                  </button>
                </div>

                {/* Drawer Search Input */}
                <div className="relative mb-3 shrink-0">
                  <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={`Filter ${tools.length} offline tools...`}
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-base sm:text-sm rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all placeholder:text-text-secondary/70"
                  />
                  {mobileSearch && (
                    <button
                      onClick={() => setMobileSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary p-1 min-w-[32px] min-h-[32px] flex items-center justify-center hover:text-text-primary"
                      aria-label="Clear filter"
                    >
                      <LucideIcons.X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Drawer Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-20">
                  {mobileSearch ? (
                    /* Search Results View */
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                        Matching Tools ({filteredTools.length})
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
                                className="flex items-center gap-3 p-3 rounded-xl text-sm bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all active:scale-[0.98] min-h-[44px]"
                              >
                                <Icon className="w-4 h-4 shrink-0 text-accent" />
                                <div className="min-w-0">
                                  <div className="font-semibold truncate text-text-primary">{t.name}</div>
                                  <div className="text-xs opacity-75 truncate">{t.description}</div>
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
                  ) : drawerIntent === "favorites" ? (
                    /* Dedicated Favorites View */
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                        <LucideIcons.Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Saved Favorites ({favoriteTools.length})</span>
                      </h3>
                      {favoriteTools.length > 0 ? (
                        <div className="space-y-1.5">
                          {favoriteTools.map((t) => {
                            const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
                            return (
                              <div
                                key={t.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-soft hover:bg-surface-hover transition-colors"
                              >
                                <Link
                                  href={`/tools/${t.slug}`}
                                  onClick={() => setMobileNavOpen(false)}
                                  className="flex items-center gap-2.5 min-w-0 flex-1 min-h-[40px]"
                                >
                                  <Icon className="w-4 h-4 shrink-0 text-accent" />
                                  <span className="font-medium text-sm text-text-primary truncate">{t.name}</span>
                                </Link>
                                <button
                                  onClick={() => setFavorites((prev) => prev.filter((s) => s !== t.slug))}
                                  className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-amber-400 hover:text-red-500 transition-colors"
                                  aria-label="Remove favorite"
                                >
                                  <LucideIcons.Star className="w-4 h-4 fill-amber-400" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 px-4 bg-surface rounded-2xl border border-border space-y-2">
                          <LucideIcons.Star className="w-8 h-8 text-amber-400/50 mx-auto" />
                          <p className="text-sm font-semibold text-text-primary">No Favorites Yet</p>
                          <p className="text-xs text-text-secondary">
                            Tap the star icon on any tool card to keep your most-used tools handy here.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : drawerIntent === "recent" ? (
                    /* Dedicated Recent History View */
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                        <LucideIcons.Clock className="w-3.5 h-3.5 text-accent" />
                        <span>Recently Used Tools ({recentTools.length})</span>
                      </h3>
                      {recentTools.length > 0 ? (
                        <div className="space-y-1.5">
                          {recentTools.map((t) => {
                            const Icon = (LucideIcons as any)[t.icon] || LucideIcons.File;
                            return (
                              <Link
                                key={t.id}
                                href={`/tools/${t.slug}`}
                                onClick={() => setMobileNavOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border-soft hover:bg-surface-hover transition-colors min-h-[44px]"
                              >
                                <Icon className="w-4 h-4 shrink-0 text-accent" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm text-text-primary truncate">{t.name}</div>
                                  <div className="text-xs text-text-secondary truncate">{t.description}</div>
                                </div>
                                <LucideIcons.ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-10 px-4 bg-surface rounded-2xl border border-border space-y-2">
                          <LucideIcons.Clock className="w-8 h-8 text-text-secondary/40 mx-auto" />
                          <p className="text-sm font-semibold text-text-primary">No Recent Tools</p>
                          <p className="text-xs text-text-secondary">
                            Tools you open will automatically appear here for quick access.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default Categories View */
                    <>
                      {/* Quick Settings Card */}
                      <div className="bg-surface rounded-2xl p-3 border border-border space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-text-primary">Appearance</span>
                          <button
                            onClick={toggle}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-surface-hover hover:text-accent transition-all active:scale-95 min-h-[36px]"
                          >
                            {theme === "dark" ? (
                              <>
                                <LucideIcons.Sun className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-xs font-semibold">Light Mode</span>
                              </>
                            ) : (
                              <>
                                <LucideIcons.Moon className="w-3.5 h-3.5 text-indigo-500" />
                                <span className="text-xs font-semibold">Dark Mode</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-text-primary">MultiTool Info</span>
                          <Link
                            href="/about"
                            onClick={() => setMobileNavOpen(false)}
                            className="text-xs text-accent font-semibold hover:underline min-h-[36px] flex items-center"
                          >
                            About Us &rarr;
                          </Link>
                        </div>
                      </div>

                      {/* All Categories Grid */}
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                          Categories ({categories.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map((cat) => {
                            const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.Folder;
                            const count = tools.filter((t) => t.category === cat.id).length;
                            return (
                              <Link
                                key={cat.id}
                                href={`/category/${cat.id}`}
                                onClick={() => setMobileNavOpen(false)}
                                className="flex items-center gap-2 p-3 bg-surface rounded-xl border border-border text-xs text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all active:scale-97 min-h-[44px]"
                              >
                                <Icon className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                                <div className="min-w-0">
                                  <div className="font-semibold text-text-primary truncate">{cat.label}</div>
                                  <div className="text-[10px] text-text-secondary">{count} tools</div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
      </div>

      {/* Mobile Bottom Tab Navigation — floating pill, safe-area aware */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-3 left-3 right-3 z-30 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch gap-1 rounded-2xl border border-border bg-surface-raised/95 backdrop-blur-md shadow-lg px-1.5 py-1.5">
          <Link
            href="/"
            aria-label="Home"
            onClick={() => setMobileNavOpen(false)}
            aria-current={pathname === "/" && !mobileNavOpen ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[52px] rounded-xl transition-colors ${
              pathname === "/" && !mobileNavOpen
                ? "bg-accent/10 text-accent font-semibold"
                : "text-text-secondary hover:text-text-primary active:bg-surface-hover"
            }`}
          >
            <LucideIcons.House className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Home</span>
          </Link>

          <button
            type="button"
            onClick={openSearch}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[52px] rounded-xl text-text-secondary hover:text-text-primary active:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Search tools"
          >
            <LucideIcons.Search className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Search</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer("favorites")}
            aria-expanded={mobileNavOpen && drawerIntent === "favorites"}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[52px] rounded-xl transition-colors cursor-pointer ${
              mobileNavOpen && drawerIntent === "favorites"
                ? "bg-accent/10 text-accent font-semibold"
                : "text-text-secondary hover:text-text-primary active:bg-surface-hover"
            }`}
            aria-label="Favorites"
          >
            <span className="relative">
              <LucideIcons.Star className="w-5 h-5" />
              {favoriteTools.length > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 bg-amber-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {favoriteTools.length > 9 ? "9+" : favoriteTools.length}
                </span>
              )}
            </span>
            <span className="text-[10px] leading-tight">Favorites</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer("recent")}
            aria-expanded={mobileNavOpen && drawerIntent === "recent"}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[52px] rounded-xl transition-colors cursor-pointer ${
              mobileNavOpen && drawerIntent === "recent"
                ? "bg-accent/10 text-accent font-semibold"
                : "text-text-secondary hover:text-text-primary active:bg-surface-hover"
            }`}
            aria-label="Recent tools"
          >
            <LucideIcons.Clock className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Recent</span>
          </button>

          <button
            type="button"
            onClick={() => openDrawer("menu")}
            aria-expanded={mobileNavOpen && drawerIntent === "menu"}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[52px] rounded-xl transition-colors cursor-pointer ${
              mobileNavOpen && drawerIntent === "menu"}
                ? "bg-accent/10 text-accent font-semibold"
                : "text-text-secondary hover:text-text-primary active:bg-surface-hover"
            }`}
            aria-label="Categories menu"
          >
            <LucideIcons.Grid3x3 className="w-5 h-5" />
            <span className="text-[10px] leading-tight">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
