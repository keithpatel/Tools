"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Download, Info } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [newSize, setNewSize] = useState<number | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [mode, setMode] = useState<"rewrite" | "rerender">("rewrite");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (f) {
      setFile(f);
      setOriginalSize(f.size);
      setNewSize(null);
    }
  }, []);

  const compress = async () => {
    if (!file) return;
    setCompressing(true);
    try {
      const srcBytes = await file.arrayBuffer();
      let outBytes: Uint8Array;

      if (mode === "rewrite") {
        const pdfDoc = await PDFDocument.load(srcBytes);
        outBytes = await pdfDoc.save();
      } else {
        const pdfDoc = await PDFDocument.create();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(srcBytes) });
        const pdf = await loadingTask.promise;
        const total = pdf.numPages;

        for (let i = 1; i <= total; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvas, viewport }).promise;
          const pngData = canvas.toDataURL("image/png");
          const pngBytes = Uint8Array.from(atob(pngData.split(",")[1]), (c) => c.charCodeAt(0));
          const img = await pdfDoc.embedPng(pngBytes);
          const { width, height } = img.scale(1);
          const pdfPage = pdfDoc.addPage([width, height]);
          pdfPage.drawImage(img, { x: 0, y: 0, width, height });
        }
        outBytes = await pdfDoc.save();
      }

      setNewSize(outBytes.length);
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCompressing(false);
    }
  };

  return (
    <ToolLayout
      title="Compress PDF"
      description="Reduce PDF file size by rewriting or re-rendering pages as images."
    >
      <canvas ref={canvasRef} className="hidden" />
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {file && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{file.name}</span> &mdash; {(originalSize / 1024).toFixed(1)} KB
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <label className="flex items-center gap-2.5 text-sm p-2 sm:p-0 rounded-lg hover:bg-surface-hover sm:hover:bg-transparent cursor-pointer min-h-[40px] sm:min-h-0">
              <input type="radio" name="mode" checked={mode === "rewrite"} onChange={() => setMode("rewrite")} className="accent-accent w-4 h-4" />
              <span>Rewrite (remove metadata)</span>
            </label>
            <label className="flex items-center gap-2.5 text-sm p-2 sm:p-0 rounded-lg hover:bg-surface-hover sm:hover:bg-transparent cursor-pointer min-h-[40px] sm:min-h-0">
              <input type="radio" name="mode" checked={mode === "rerender"} onChange={() => setMode("rerender")} className="accent-accent w-4 h-4" />
              <span>Re-render as images (better compression)</span>
            </label>
          </div>
          {mode === "rewrite" && (
            <div className="flex items-start gap-2 p-3 bg-info-soft rounded-xl text-xs text-info-text dark:text-info-text">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Rewriting only removes metadata and recompresses internal streams. For true size reduction, use the re-render option which converts pages to images.</span>
            </div>
          )}
          <button
            onClick={compress}
            disabled={compressing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all min-h-[48px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {compressing ? "Compressing..." : "Compress & Download"}
          </button>
          {newSize !== null && (
            <div className="text-sm space-y-1 bg-surface p-3 rounded-xl border border-border-soft">
              <p>Original: <span className="font-medium">{(originalSize / 1024).toFixed(1)} KB</span></p>
              <p>New: <span className="font-medium">{(newSize / 1024).toFixed(1)} KB</span></p>
              <p className={newSize < originalSize ? "text-success font-semibold" : "text-error-text font-semibold"}>
                {((1 - newSize / originalSize) * 100).toFixed(1)}% reduction
              </p>
            </div>
          )}

          {/* Mobile Sticky Action Bar */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-2.5 shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.6rem)" }}
          >
            <button
              onClick={compress}
              disabled={compressing}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-600 text-white rounded-xl hover:opacity-90 active:scale-[0.98] text-sm font-semibold transition-all shadow-md min-h-[48px] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {compressing ? "Compressing..." : "Compress & Download"}
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
