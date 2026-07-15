"use client";

import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, Wrench } from "lucide-react";

export function NavBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:text-accent transition-colors">
          <Wrench className="w-5 h-5 text-accent" />
          <span>MultiTool</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-accent transition-colors hidden sm:inline">Tools</Link>
          <Link href="/about" className="hover:text-accent transition-colors hidden sm:inline">About</Link>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
