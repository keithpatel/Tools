"use client";

import * as LucideIcons from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const SHORTCUTS = [
  { keys: ["⌘", "K"], desc: "Search all tools" },
  { keys: ["?"], desc: "Show keyboard shortcuts" },
  { keys: ["Esc"], desc: "Close menu / modal" },
];

export function ShortcutCheatSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-surface-raised rounded-2xl shadow-2xl border border-border p-5 w-full max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-heading font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close shortcuts"
          >
            <LucideIcons.X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys.join("")} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">{s.desc}</span>
              <kbd className="flex items-center gap-0.5">
                {s.keys.map((k) => (
                  <span
                    key={k}
                    className="px-1.5 py-0.5 bg-surface-hover rounded text-[10px] font-mono border border-border"
                  >
                    {k}
                  </span>
                ))}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
