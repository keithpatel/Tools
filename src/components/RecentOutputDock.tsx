"use client";

import { FileCheck, X } from "lucide-react";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { getToolBySlug } from "@/data/tools";

function sizeOf(o: unknown): string {
  try {
    const d = (o as { data?: Blob }).data;
    if (d instanceof Blob) return `${(d.size / 1024).toFixed(1)} KB`;
  } catch {}
  return "";
}

/** Session-only dock showing the last tool output, with discard. Privacy: Blobs never persist. */
export function RecentOutputDock() {
  const { pending, clear } = useWorkflowStore();
  if (!pending) return null;
  const source = getToolBySlug(pending.sourceToolSlug);
  const batch = pending.type === "file-batch";
  const label = batch
    ? `${(pending as { items: unknown[] }).items.length} files`
    : (pending as { filename?: string }).filename || pending.type;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex items-center gap-2.5 pl-3 pr-2 py-2 bg-surface-raised border border-border shadow-xl rounded-2xl text-sm max-w-[calc(100vw-2rem)]" role="status">
      <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-success-soft border border-success-border shrink-0">
        <FileCheck className="w-4 h-4 text-success" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate">Output ready{source ? ` · ${source.name}` : ""}</span>
        <span className="block text-[11px] text-text-secondary truncate">{label} {sizeOf(pending)}</span>
      </span>
      <button
        onClick={clear}
        aria-label="Discard output"
        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
