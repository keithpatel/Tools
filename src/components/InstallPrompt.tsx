"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

let deferredPrompt: any = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Don't show on desktop (>= 768px)
    if (window.innerWidth >= 768) return;

    // Check if dismissed before
    const wasDismissed = localStorage.getItem("multitool-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check for recent tool usage (at least 2 unique tools)
    const raw = localStorage.getItem("multitool-history");
    if (raw) {
      try {
        const history: { slug: string }[] = JSON.parse(raw);
        const uniqueTools = new Set(history.map((h) => h.slug));
        if (uniqueTools.size < 2) return;
      } catch {
        return;
      }
    } else {
      return;
    }

    const checkPrompt = () => {
      if (deferredPrompt) {
        setShow(true);
      }
    };
    checkPrompt();
    const t = setTimeout(checkPrompt, 3000);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
      localStorage.setItem("multitool-install-dismissed", "true");
    }
    deferredPrompt = null;
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("multitool-install-dismissed", "true");
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 md:hidden">
      <div className="bg-surface-raised rounded-2xl shadow-xl border border-border p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Install MultiTool</p>
          <p className="text-xs text-text-secondary">Instant access, offline-ready</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
