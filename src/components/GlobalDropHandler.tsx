"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, X } from "lucide-react";
import { tools } from "@/data/tools";
import { inferTypeFromFile, getCompatibleTargets } from "@/data/workflow";
import { useDropQueue } from "@/lib/useDropQueue";
import { getToolBySlug } from "@/data/tools";

/** Global drag-drop: drop a file anywhere outside a DropZone → suggest compatible tools. */
export function GlobalDropHandler() {
  const router = useRouter();
  const { push } = useDropQueue();
  const [staged, setStaged] = useState<File[] | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let depth = 0;
    const onDragEnter = (e: DragEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-dropzone]")) return;
      if (!e.dataTransfer?.types?.includes("Files")) return;
      depth++;
      setDragging(true);
    };
    const onDragLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-dropzone]")) {
        setDragging(false);
        depth = 0;
        return; // let the local DropZone handle it
      }
      const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
      if (!files.length) return;
      e.preventDefault();
      setDragging(false);
      depth = 0;
      setStaged(files);
    };
    const onDragOver = (e: DragEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest?.("[data-dropzone]") && e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragover", onDragOver);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragover", onDragOver);
    };
  }, []);

  if (!dragging && !staged) return null;

  const type = staged?.[0] ? inferTypeFromFile(staged[0]) : null;
  const slugs = type ? getCompatibleTargets(type).slice(0, 6) : [];

  const go = (slug: string) => {
    if (staged) {
      push(staged);
      window.dispatchEvent(new CustomEvent("tool-drop-queue"));
    }
    setStaged(null);
    router.push(`/tools/${slug}`);
  };

  return (
    <>
      {dragging && !staged && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center bg-accent/10 backdrop-blur-[1px]">
          <div className="px-6 py-4 rounded-2xl bg-surface-raised border-2 border-dashed border-accent shadow-xl text-sm font-semibold flex items-center gap-2">
            <FileUp className="w-5 h-5 text-accent" /> Drop file anywhere to find the right tool
          </div>
        </div>
      )}
      {staged && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40" role="dialog" aria-label="Choose a tool for dropped file">
          <div className="w-full max-w-md bg-surface-raised border border-border rounded-2xl shadow-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <FileUp className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-bold">
                {staged.length} file{staged.length > 1 ? "s" : ""} detected ({type})
              </h2>
              <button onClick={() => setStaged(null)} aria-label="Dismiss" className="ml-auto p-2 min-w-[36px] min-h-[36px] rounded-lg hover:bg-surface-hover cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-secondary mb-3 truncate">{staged[0]?.name}</p>
            <div className="grid gap-1.5 max-h-64 overflow-y-auto">
              {slugs.map((slug) => {
                const t = getToolBySlug(slug);
                if (!t) return null;
                return (
                  <button
                    key={slug}
                    onClick={() => go(slug)}
                    className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-border-soft hover:border-accent/50 hover:bg-accent/5 text-sm font-medium text-left transition-all min-h-[44px] cursor-pointer"
                  >
                    {t.name}
                    <span className="ml-auto text-[11px] text-text-secondary">{tools.find((x) => x.slug === slug)?.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
