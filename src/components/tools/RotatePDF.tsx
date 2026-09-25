"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Download, RotateCw } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageThumb {
  page: number;
  src: string;
  rotation: number;
}

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const srcBytesRef = useRef<ArrayBuffer | null>(null);

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setLoaded(false);
    const bytes = await f.arrayBuffer();
    srcBytesRef.current = bytes;
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
    const pdf = await loadingTask.promise;
    const total = pdf.numPages;
    const results: PageThumb[] = [];

    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      results.push({ page: i, src: canvas.toDataURL(), rotation: 0 });
    }
    setPages(results);
    setLoaded(true);
  }, []);

  const rotate = (idx: number, deg: number) => {
    setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + deg) % 360 } : p)));
  };

  const save = async () => {
    if (!srcBytesRef.current) return;
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(srcBytesRef.current.slice(0));
      for (const p of pages) {
        const page = pdfDoc.getPage(p.page - 1);
        page.setRotation(degrees(p.rotation));
      }
      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rotated-${file!.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate individual pages in a PDF document."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {loaded && pages.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {pages.map((p, i) => (
              <div key={i} className="border border-border rounded-xl bg-surface overflow-hidden shadow-xs">
                <div className="p-3 bg-surface-raised flex items-center justify-center min-h-[160px]">
                  <img
                    src={p.src}
                    alt={`Page ${p.page}`}
                    className="max-h-56 max-w-full h-auto mx-auto object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-border-soft">
                  <span className="text-xs text-text-secondary font-medium">Page {p.page}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => rotate(i, 90)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-surface-hover rounded-lg transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
                      title="Rotate 90°"
                      aria-label="Rotate 90 degrees"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rotate(i, 180)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-surface-hover rounded-lg transition-colors text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                      title="Rotate 180°"
                      aria-label="Rotate 180 degrees"
                    >
                      180°
                    </button>
                    <button
                      onClick={() => rotate(i, 270)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-surface-hover rounded-lg transition-colors text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                      title="Rotate 270°"
                      aria-label="Rotate 270 degrees"
                    >
                      270°
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all min-h-[48px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {saving ? "Saving..." : "Save & Download"}
          </button>

          {/* Mobile Sticky Action Bar */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-2.5 shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.6rem)" }}
          >
            <button
              onClick={save}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-green-600 text-white rounded-xl hover:opacity-90 active:scale-[0.98] text-sm font-semibold transition-all shadow-md min-h-[48px] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {saving ? "Saving PDF..." : "Save & Download"}
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
