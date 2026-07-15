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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {converting && <Loader2 className="w-4 h-4 animate-spin" />}
            {converting ? `Converting (${progress}%)...` : "Convert to Images"}
          </button>
          {converting && (
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">{images.length} page{images.length !== 1 ? "s" : ""} converted</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.page} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <img src={img.src} alt={`Page ${img.page}`} className="w-full h-auto" />
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800">
                  <span className="text-xs text-gray-500">Page {img.page}</span>
                  <button onClick={() => download(img.src, img.page)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
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
