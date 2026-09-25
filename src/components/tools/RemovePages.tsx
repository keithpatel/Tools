"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Trash2, Undo2, Sparkles, FileText, FileX } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageThumb {
  page: number;
  src: string;
  isBlank: boolean;
}

export default function RemovePages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [pagesToRemove, setPagesToRemove] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const srcBytesRef = useRef<ArrayBuffer | null>(null);
  const { sendOutput } = useWorkflowStore();

  const isCanvasBlank = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
    // Sample pixels across canvas
    const imgData = ctx.getImageData(0, 0, width, height).data;
    let nonWhitePixels = 0;
    const totalPixels = width * height;
    // Step by 4 (sample 1 in every 4 pixels for speed)
    for (let i = 0; i < imgData.length; i += 16) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];
      // If pixel is not pure white or transparent
      if (a > 20 && (r < 245 || g < 245 || b < 245)) {
        nonWhitePixels++;
      }
    }
    const sampleTotal = totalPixels / 4;
    return nonWhitePixels / sampleTotal < 0.001; // Less than 0.1% non-white
  };

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
    setPagesToRemove(new Set());
    setRangeInput("");

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
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, viewport }).promise;

        const blank = isCanvasBlank(ctx, canvas.width, canvas.height);
        thumbs.push({ page: i, src: canvas.toDataURL(), isBlank: blank });
      }

      setPages(thumbs);
    } catch {
      setError("Failed to load PDF pages. The file may be password protected or corrupted.");
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePageRemoval = (pageNum: number) => {
    setPagesToRemove((prev) => {
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
    setPagesToRemove(parsed);
  };

  const removeBlankPages = () => {
    const blanks = pages.filter((p) => p.isBlank).map((p) => p.page);
    if (blanks.length === 0) {
      setError("No completely blank pages were detected in this document.");
      return;
    }
    const next = new Set([...Array.from(pagesToRemove), ...blanks]);
    setPagesToRemove(next);
    setRangeInput(stringifyRange(next));
  };

  const undoAll = () => {
    setPagesToRemove(new Set());
    setRangeInput("");
  };

  const remainingCount = pages.length - pagesToRemove.size;

  const removePages = async () => {
    if (!srcBytesRef.current || pagesToRemove.size === 0) return;
    if (remainingCount <= 0) {
      setError("You cannot remove all pages from the PDF. At least 1 page must remain.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const srcPdf = await PDFDocument.load(srcBytesRef.current);
      const newPdf = await PDFDocument.create();

      const keptPages = pages
        .filter((p) => !pagesToRemove.has(p.page))
        .map((p) => p.page - 1);

      const copiedPages = await newPdf.copyPages(srcPdf, keptPages);
      copiedPages.forEach((p) => newPdf.addPage(p));

      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const filename = (file?.name || "document").replace(/\.pdf$/i, "") + `_removed_pages.pdf`;

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      sendOutput({
        type: "pdf",
        data: blob,
        filename,
        sourceToolSlug: "remove-pages",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to remove pages from PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_pruned.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setPagesToRemove(new Set());
    setRangeInput("");
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  const blankCount = pages.filter((p) => p.isBlank).length;

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your PDF here to remove unwanted pages"
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
              Analyzing pages and rendering previews...
            </div>
          )}

          {!loading && pages.length > 0 && !resultBlob && (
            <div className="p-5 rounded-2xl border border-border-soft bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft">
                <div>
                  <h3 className="text-sm font-heading font-semibold">Select Pages to Delete</h3>
                  <span className="text-xs text-text-secondary">
                    {pagesToRemove.size} pages marked for removal • {remainingCount} will remain
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {blankCount > 0 && (
                    <button
                      onClick={removeBlankPages}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-detect blank pages ({blankCount})
                    </button>
                  )}
                  {pagesToRemove.size > 0 && (
                    <button
                      onClick={undoAll}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Reset All
                    </button>
                  )}
                </div>
              </div>

              {/* Range input */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Or enter pages to delete (e.g. 2, 4-6):
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => handleRangeChange(e.target.value)}
                  placeholder="e.g. 2, 4-6"
                  className="w-full max-w-sm px-3 py-1.5 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
                {pages.map((p) => {
                  const isMarked = pagesToRemove.has(p.page);
                  return (
                    <button
                      key={p.page}
                      type="button"
                      onClick={() => togglePageRemoval(p.page)}
                      className={`group relative rounded-xl border-2 overflow-hidden transition-all text-left bg-surface-raised p-1.5 focus:outline-none ${
                        isMarked
                          ? "border-red-500/70 bg-red-500/5 shadow-sm opacity-80"
                          : "border-border-soft hover:border-border"
                      }`}
                    >
                      <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.src}
                          alt={`Page ${p.page}`}
                          className={`w-full h-full object-contain transition-all ${
                            isMarked ? "grayscale opacity-40" : ""
                          }`}
                        />
                        {/* Status badge */}
                        <div
                          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            isMarked
                              ? "bg-red-500 text-white"
                              : "bg-black/30 text-white group-hover:bg-red-500"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </div>

                        {p.isBlank && !isMarked && (
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-semibold bg-amber-500/90 text-white text-center py-0.5 rounded">
                            Blank Page
                          </div>
                        )}
                      </div>
                      <div
                        className={`mt-1 text-center text-[11px] font-medium ${
                          isMarked ? "text-red-500 line-through" : "text-text-secondary"
                        }`}
                      >
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
            loadingLabel="Removing Selected Pages..."
            error={error}
            onAction={
              !resultBlob && pagesToRemove.size > 0 && remainingCount > 0
                ? removePages
                : undefined
            }
            actionLabel={`Delete ${pagesToRemove.size} Page${pagesToRemove.size !== 1 ? "s" : ""}`}
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Pruned PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Remove Pages from Another PDF"
            sourceToolSlug="remove-pages"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <FileX className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  Pages Removed Successfully!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Deleted {pagesToRemove.size} page{pagesToRemove.size !== 1 ? "s" : ""}. The output document contains {remainingCount} pages.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
