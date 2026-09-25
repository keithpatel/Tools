"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { PDFDocument } from "pdf-lib";
import { Download, Split } from "lucide-react";

function parseRanges(input: string, max: number): number[] {
  const pages: Set<number> = new Set();
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const range = trimmed.split("-").map(Number);
    if (range.length === 1 && !isNaN(range[0]) && range[0] >= 1 && range[0] <= max) {
      pages.add(range[0]);
    } else if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
      const [start, end] = [Math.max(1, range[0]), Math.min(max, range[1])];
      for (let i = start; i <= end; i++) pages.add(i);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rangeInput, setRangeInput] = useState("");
  const [splitting, setSplitting] = useState(false);

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setPageCount(pdf.getPageCount());
  }, []);

  const extractRange = async () => {
    if (!file || !rangeInput) return;
    const pages = parseRanges(rangeInput, pageCount);
    if (pages.length === 0) return;
    setSplitting(true);
    try {
      const srcBytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(srcBytes);
      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(srcPdf, pages.map((p) => p - 1));
      copied.forEach((p) => newPdf.addPage(p));
      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `split-${pages.join("-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSplitting(false);
    }
  };

  const splitAll = async () => {
    if (!file) return;
    setSplitting(true);
    try {
      const srcBytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(srcBytes);
      const total = srcPdf.getPageCount();
      for (let i = 0; i < total; i++) {
        const newPdf = await PDFDocument.create();
        const [copied] = await newPdf.copyPages(srcPdf, [i]);
        newPdf.addPage(copied);
        const out = await newPdf.save();
        const blob = new Blob([out as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `page-${i + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setSplitting(false);
    }
  };

  return (
    <ToolLayout
      title="Split PDF"
      description="Extract specific pages or split every page into separate PDFs."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {file && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span> &mdash; {pageCount} page{pageCount !== 1 ? "s" : ""}
          </p>
          <div>
            <label className="block text-xs text-text-secondary font-medium mb-1.5">Page ranges (e.g. 1-3,5,7-9)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="1-3,5,7-9"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
              />
              <button
                onClick={extractRange}
                disabled={splitting || !rangeInput}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors min-h-[44px] cursor-pointer"
              >
                {splitting ? "Extracting..." : "Extract Pages"}
              </button>
            </div>
          </div>
          <div className="border-t border-border-soft pt-4">
            <button
              onClick={splitAll}
              disabled={splitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-surface-hover border border-border text-text-primary rounded-xl hover:bg-border text-sm font-medium transition-colors min-h-[44px] cursor-pointer"
            >
              <Split className="w-4 h-4" />
              Split all pages (download each individually)
            </button>
          </div>

          {/* Mobile Sticky Action Bar */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border px-4 py-2.5 shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.6rem)" }}
          >
            <button
              onClick={rangeInput ? extractRange : splitAll}
              disabled={splitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-green-600 text-white rounded-xl hover:opacity-90 active:scale-[0.98] text-sm font-semibold transition-all shadow-md min-h-[48px] disabled:opacity-50 cursor-pointer"
            >
              <Split className="w-4 h-4" />
              {splitting ? "Splitting..." : rangeInput ? "Extract Specified Pages" : "Split All Pages"}
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
