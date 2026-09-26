"use client";

import { useEffect, useState } from "react";
import { WifiOff, Check } from "lucide-react";

/** Explicit offline badge — all tools are local-first after first load. */
export function OfflineBadge({ slug }: { slug: string }) {
  const [offline, setOffline] = useState(() =>
    typeof navigator === "undefined" ? false : !navigator.onLine
  );

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <span
      title={offline ? "You are offline — this tool still works" : "Works offline after first load"}
      className="inline-flex items-center gap-1.5 font-semibold rounded-full px-3 py-1.5 border bg-surface-hover border-border-soft text-text-secondary"
    >
      {offline ? <WifiOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />}
      {offline ? "Offline ready" : "Available offline"}
      <span className="sr-only">tool {slug}</span>
    </span>
  );
}
