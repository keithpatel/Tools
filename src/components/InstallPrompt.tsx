"use client";

import { useEffect, useState } from "react";

let deferredPrompt: any = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      if (deferredPrompt) {
        setShow(true);
      }
    };
    // Check immediately and also after a delay for slow-loading prompts
    check();
    const t = setTimeout(check, 3000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
    }
    deferredPrompt = null;
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dark transition-colors"
      aria-label="Install app"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
      </svg>
      Install App
    </button>
  );
}
