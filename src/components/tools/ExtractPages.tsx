"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Check, FileText, CheckSquare, Square, FileCheck } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageThumb {
  page: number;
  src: string;
}

export default function ExtractPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const srcBytesRef = useRef<ArrayBuffer | null>(null);
  const { sendOutput } = useWorkflowStore();

  const parseRange = (input: string, max: number): Set<number> => {
    const selected = new Set<number>();
    const parts = input.split(",").map((p) => p.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((n) => parseInt(n.trim(), 10));
        if (!isNaN(startStr) && !isNaN(endStr)) {
          const start = Math.max(1, Math.min(startStr, endStr));
          const end = Math.min(max, Math.max(startStr, endStr));
          for (let i = start; i <= end; i++) selected.add(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= max) {
          selected.add(num);
        }
      }
    }
    return selected;
  };

  const stringifyRange = (set: Set<number>): string => {
    const sorted = Array.from(set).sort((a, b) => a - b);
    if (sorted.length === 0) return "";
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = start;

    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        if (i < sorted.length) {
          start = sorted[i];
          prev = start;
        }
      }
    }
    return ranges.join(", ");
  };

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setError("");
    setResultBlob(null);
    setResultUrl("");

    try {
      const bytes = await f.arrayBuffer();
      srcBytesRef.current = bytes;
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;
      const thumbs: PageThumb[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;
        thumbs.push({ page: i, src: canvas.toDataURL() });
      }

      setPages(thumbs);
      // Select first page by default
      const initial = new Set<number>([1]);
      setSelectedPages(initial);
      setRangeInput("1");
    } catch {
      setError("Failed to load PDF pages. The file may be password protected or corrupted.");
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      setRangeInput(stringifyRange(next));
      return next;
    });
  };

  const handleRangeChange = (val: string) => {
    setRangeInput(val);
    const parsed = parseRange(val, pages.length);
    setSelectedPages(parsed);
  };

  const selectAll = () => {
    const all = new Set(pages.map((p) => p.page));
    setSelectedPages(all);
    setRangeInput(stringifyRange(all));
  };

  const selectNone = () => {
    setSelectedPages(new Set());
    setRangeInput("");
  };

  const selectOdd = () => {
    const odd = new Set(pages.map((p) => p.page).filter((p) => p % 2 === 1));
    setSelectedPages(odd);
    setRangeInput(stringifyRange(odd));
  };

  const selectEven = () => {
    const even = new Set(pages.map((p) => p.page).filter((p) => p % 2 === 0));
    setSelectedPages(even);
    setRangeInput(stringifyRange(even));
  };

  const extract = async () => {
    if (!srcBytesRef.current || selectedPages.size === 0) return;
    setProcessing(true);
    setError("");

    try {
      const srcPdf = await PDFDocument.load(srcBytesRef.current);
      const newPdf = await PDFDocument.create();

      const sorted = Array.from(selectedPages).sort((a, b) => a - b);
      const zeroIndices = sorted.map((p) => p - 1);

      const copiedPages = await newPdf.copyPages(srcPdf, zeroIndices);
      copiedPages.forEach((p) => newPdf.addPage(p));

      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const filename = (file?.name || "document").replace(/\.pdf$/i, "") + `_extracted_p${sorted.join("_")}.pdf`;

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      sendOutput({
        type: "pdf",
        data: blob,
        filename,
        sourceToolSlug: "extract-pages",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to extract pages from PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_extracted.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setSelectedPages(new Set());
    setRangeInput("");
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your PDF here to extract pages"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-soft bg-surface">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-text-secondary">
                  {pages.length} total pages • {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-text-secondary hover:text-red-500 transition-colors px-2 py-1"
            >
              Change file
            </button>
          </div>

          {loading && (
            <div className="text-center py-12 text-sm text-text-secondary">
              Rendering page previews...
            </div>
          )}

          {!loading && pages.length > 0 && !resultBlob && (
            <div className="p-5 rounded-2xl border border-border-soft bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft">
                <div>
                  <h3 className="text-sm font-heading font-semibold">Select Pages to Extract</h3>
                  <span className="text-xs text-text-secondary">
                    {selectedPages.size} of {pages.length} pages selected
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={selectAll}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                  >
                    All
                  </button>
                  <button
                    onClick={selectNone}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                  >
                    None
                  </button>
                  <button
                    onClick={selectOdd}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                  >
                    Odd
                  </button>
                  <button
                    onClick={selectEven}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                  >
                    Even
                  </button>
                </div>
              </div>

              {/* Page Range input */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Or enter page range (e.g. 1-3, 5, 8-10):
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => handleRangeChange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full max-w-sm px-3 py-1.5 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </div>

              {/* Page thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
                {pages.map((p) => {
                  const isSelected = selectedPages.has(p.page);
                  return (
                    <button
                      key={p.page}
                      type="button"
                      onClick={() => togglePage(p.page)}
                      className={`group relative rounded-xl border-2 overflow-hidden transition-all text-left bg-surface-raised p-1.5 focus:outline-none ${
                        isSelected
                          ? "border-accent shadow-sm ring-2 ring-accent/20"
                          : "border-border-soft hover:border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.src}
                          alt={`Page ${p.page}`}
                          className="w-full h-full object-contain"
                        />
                        {/* Checkbox indicator */}
                        <div
                          className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-accent text-white"
                              : "bg-black/40 text-white/70 group-hover:bg-black/60"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                      <div className="mt-1 text-center text-[11px] font-medium text-text-secondary">
                        Page {p.page}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <ResultPanel
            loading={processing}
            loadingLabel="Extracting Pages into New PDF..."
            error={error}
            onAction={!resultBlob && selectedPages.size > 0 ? extract : undefined}
            actionLabel={`Extract ${selectedPages.size} Page${selectedPages.size !== 1 ? "s" : ""}`}
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Extracted PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Extract from Another PDF"
            sourceToolSlug="extract-pages"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  Pages Extracted Successfully!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Created a new document containing only your {selectedPages.size} selected page{selectedPages.size !== 1 ? "s" : ""}.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
