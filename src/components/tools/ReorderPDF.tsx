"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Download, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageItem {
  index: number;
  src: string;
}

export default function ReorderPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setLoaded(false);
    const bytes = await f.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
    const pdf = await loadingTask.promise;
    const total = pdf.numPages;
    const results: PageItem[] = [];

    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      results.push({ index: i, src: canvas.toDataURL() });
    }
    setPages(results);
    setLoaded(true);
  }, []);

  const moveUp = (i: number) => {
    if (i === 0) return;
    setPages((prev) => {
      const arr = [...prev];
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      return arr;
    });
  };

  const moveDown = (i: number) => {
    setPages((prev) => {
      if (i === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      return arr;
    });
  };

  const removePage = (i: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    if (!file || pages.length === 0) return;
    setSaving(true);
    try {
      const srcBytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(srcBytes);
      const newPdf = await PDFDocument.create();
      const indices = pages.map((p) => p.index - 1);
      const copied = await newPdf.copyPages(srcPdf, indices);
      copied.forEach((p) => newPdf.addPage(p));
      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reordered-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ToolLayout
      title="Reorder PDF"
      description="Rearrange, remove, and reorder pages in a PDF."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {loaded && pages.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-text-secondary mb-3">{pages.length} page{pages.length !== 1 ? "s" : ""}</p>
          <div className="space-y-2 mb-4">
            {pages.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface-hover dark:bg-surface-hover rounded-lg p-2 pr-3">
                <img src={p.src} alt={`Page ${p.index}`} className="w-14 h-auto rounded border border-border-soft" />
                <span className="text-sm flex-1">Page {p.index}</span>
                <div className="flex items-center gap-1 sm:gap-1">
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    aria-label={`Move page ${p.index} up`}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-border rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i === pages.length - 1}
                    aria-label={`Move page ${p.index} down`}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-border rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => removePage(i)}
                    aria-label={`Remove page ${p.index}`}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-red-100 dark:hover:bg-error-soft rounded-lg transition-colors ml-1"
                  >
                    <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-error-text" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            {saving ? "Saving..." : "Save & Download"}
          </button>

          {/* Mobile sticky action bar */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border-t border-border-soft dark:border-border-soft z-50 flex gap-2"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={save}
              disabled={saving}
              className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl font-medium text-base active:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg"
            >
              <Download className="w-5 h-5" />
              {saving ? "Saving..." : "Save & Download"}
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
