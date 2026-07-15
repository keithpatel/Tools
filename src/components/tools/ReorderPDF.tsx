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
          <p className="text-sm text-gray-500 mb-3">{pages.length} page{pages.length !== 1 ? "s" : ""}</p>
          <div className="space-y-2 mb-4">
            {pages.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 pr-3">
                <img src={p.src} alt={`Page ${p.index}`} className="w-14 h-auto rounded border border-gray-200 dark:border-gray-700" />
                <span className="text-sm flex-1">Page {p.index}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveDown(i)} disabled={i === pages.length - 1} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => removePage(i)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
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
