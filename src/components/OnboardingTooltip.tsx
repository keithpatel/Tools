"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function OnboardingTooltip() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    const flag = localStorage.getItem("cmdk_hint_dismissed");
    if (flag === "true") return;
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      localStorage.setItem("cmdk_hint_dismissed", "true");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("cmdk_hint_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-xs transition-opacity duration-500">
      <div className="bg-surface-raised rounded-xl shadow-xl border border-border p-4">
        <p className="text-xs text-text-primary mb-2">
          Press <kbd className="px-1 py-0.5 bg-surface-hover rounded text-[10px] font-mono border border-border">⌘K</kbd> to instantly jump to any of the 50 tools.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={dismiss} className="text-xs text-text-secondary hover:text-text-primary">Got it</button>
        </div>
      </div>
    </div>
  );
}
