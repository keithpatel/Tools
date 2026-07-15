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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {pages.map((p, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-2 bg-gray-50 dark:bg-gray-800">
                  <img
                    src={p.src}
                    alt={`Page ${p.page}`}
                    className="w-full h-auto mx-auto"
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs text-gray-500">Page {p.page}</span>
                  <div className="flex gap-1">
                    <button onClick={() => rotate(i, 90)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Rotate 90°">
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => rotate(i, 180)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-xs font-medium" title="Rotate 180°">
                      180
                    </button>
                    <button onClick={() => rotate(i, 270)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-xs font-medium" title="Rotate 270°">
                      270
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {saving ? "Saving..." : "Save & Download"}
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
