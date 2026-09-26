"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DropQueueValue {
  files: File[];
  push: (f: File[]) => void;
  consume: () => File[];
  clear: () => void;
}

const Ctx = createContext<DropQueueValue | null>(null);

export function DropQueueProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<File[]>([]);

  const push = useCallback((f: File[]) => {
    if (!f.length) return;
    lastPushed.push(...f);
    try {
      const w = window as unknown as { __dropQueue?: File[] };
      w.__dropQueue = [...(w.__dropQueue ?? []), ...f];
    } catch {}
    setFiles((prev) => [...prev, ...f]);
  }, []);

  const consume = useCallback(() => {
    let out: File[] = [];
    setFiles((prev) => {
      out = prev;
      return [];
    });
    // Note: state updater runs async; also return current snapshot via ref-free fallback.
    // Consumers should prefer subscribing to `files` + calling clear(), but for
    // event-driven handoff we snapshot through a module-level last push.
    return out.length ? out : lastPushed.splice(0);
  }, []);

  const clear = useCallback(() => {
    lastPushed.splice(0);
    setFiles([]);
  }, []);

  return <Ctx.Provider value={{ files, push: (f) => { lastPushed.push(...f); push(f); }, consume, clear }}>{children}</Ctx.Provider>;
}

const lastPushed: File[] = [];

export function useDropQueue() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDropQueue must be used within DropQueueProvider");
  return ctx;
}
