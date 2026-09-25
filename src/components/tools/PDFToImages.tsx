"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import * as pdfjsLib from "pdfjs-dist";
import { Download, Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function PDFToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<{ src: string; page: number }[]>([]);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (f) {
      setFile(f);
      setImages([]);
      setProgress(0);
    }
  }, []);

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setProgress(0);
    try {
      const srcBytes = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(srcBytes) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;
      const results: { src: string; page: number }[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        results.push({ src: canvas.toDataURL("image/png"), page: i });
        setProgress(Math.round((i / total) * 100));
      }
      setImages(results);
    } finally {
      setConverting(false);
    }
  };

  const download = (src: string, page: number) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `page-${page}.png`;
    a.click();
  };

  return (
    <ToolLayout
      title="PDF to Images"
      description="Convert each PDF page into a PNG image."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {file && !images.length && (
        <div className="mt-6">
          <button
            onClick={convert}
            disabled={converting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-brand-600 text-white rounded-xl sm:rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium transition-colors min-h-[48px] sm:min-h-0 shadow-sm"
          >
            {converting && <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />}
            {converting ? `Converting (${progress}%)...` : "Convert to Images"}
          </button>
          {converting && (
            <div className="mt-3 w-full bg-surface-hover rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Mobile sticky action */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border-t border-border-soft dark:border-border-soft z-50 flex gap-2"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={convert}
              disabled={converting}
              className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl font-medium text-base active:bg-brand-700 disabled:opacity-50 transition-colors shadow-lg"
            >
              {converting && <Loader2 className="w-5 h-5 animate-spin" />}
              {converting ? `Converting (${progress}%)...` : "Convert to Images"}
            </button>
          </div>
        </div>
      )}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">{images.length} page{images.length !== 1 ? "s" : ""} converted</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.page} className="border border-border-soft rounded-xl overflow-hidden bg-surface">
                <img src={img.src} alt={`Page ${img.page}`} className="w-full h-auto object-contain max-h-72" />
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-hover dark:bg-surface-hover/80 border-t border-border-soft">
                  <span className="text-xs font-medium text-text-secondary dark:text-text-secondary/70">Page {img.page}</span>
                  <button
                    onClick={() => download(img.src, img.page)}
                    aria-label={`Download Page ${img.page}`}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-border rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
