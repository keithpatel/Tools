"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Download } from "lucide-react";

type Position = "bottom-center" | "bottom-right" | "top-right";
type Format = "page-x-of-y" | "x";

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [startNum, setStartNum] = useState(1);
  const [format, setFormat] = useState<Format>("x");
  const [processing, setProcessing] = useState(false);

  const onFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (f) setFile(f);
  }, []);

  const apply = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;

      for (let i = 0; i < total; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const num = startNum + i;
        const display = format === "page-x-of-y" ? `Page ${num} of ${startNum + total - 1}` : `${num}`;
        const textWidth = font.widthOfTextAtSize(display, 10);

        let x: number;
        let y: number;
        const margin = 40;

        if (position === "bottom-center") {
          x = width / 2 - textWidth / 2;
          y = margin;
        } else if (position === "bottom-right") {
          x = width - margin - textWidth;
          y = margin;
        } else {
          x = width - margin - textWidth;
          y = height - margin;
        }

        page.drawText(display, {
          x,
          y,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }

      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `numbered-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Add Page Numbers"
      description="Add page numbers to your PDF document."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {file && (
        <div className="mt-6 space-y-4 max-w-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Position</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              value={position}
              onChange={(e) => setPosition(e.target.value as Position)}
            >
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="top-right">Top Right</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Starting number</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
              value={startNum}
              onChange={(e) => setStartNum(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Format</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
            >
              <option value="x">Page X</option>
              <option value="page-x-of-y">Page X of Y</option>
            </select>
          </div>
          <button
            onClick={apply}
            disabled={processing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {processing ? "Applying..." : "Apply & Download"}
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
