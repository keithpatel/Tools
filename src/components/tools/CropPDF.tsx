"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Crop, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Unit = "pt" | "mm" | "in";
type Scope = "all" | "current" | "odd" | "even";

export default function CropPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewSrc, setPreviewSrc] = useState("");
  const [pageWidth, setPageWidth] = useState(612);
  const [pageHeight, setPageHeight] = useState(792);

  // Margins in PDF points (72 pt = 1 in)
  const [topPt, setTopPt] = useState(36);
  const [bottomPt, setBottomPt] = useState(36);
  const [leftPt, setLeftPt] = useState(36);
  const [rightPt, setRightPt] = useState(36);
  const [unit, setUnit] = useState<Unit>("pt");
  const [scope, setScope] = useState<Scope>("all");

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const srcBytesRef = useRef<ArrayBuffer | null>(null);
  const pdfDocJsRef = useRef<any>(null);
  const { sendOutput } = useWorkflowStore();

  const ptToUnit = (pt: number, u: Unit): number => {
    if (u === "in") return Number((pt / 72).toFixed(2));
    if (u === "mm") return Number(((pt * 25.4) / 72).toFixed(1));
    return Math.round(pt);
  };

  const unitToPt = (val: number, u: Unit): number => {
    if (u === "in") return Math.round(val * 72);
    if (u === "mm") return Math.round((val * 72) / 25.4);
    return Math.round(val);
  };

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      setPageWidth(viewport.width);
      setPageHeight(viewport.height);

      const displayScale = Math.min(1.2, 500 / viewport.width);
      const scaledViewport = page.getViewport({ scale: displayScale });

      const canvas = document.createElement("canvas");
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      await page.render({ canvas, viewport: scaledViewport }).promise;
      setPreviewSrc(canvas.toDataURL());
    } catch (e) {
      console.error(e);
    }
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
      pdfDocJsRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      await renderPage(pdf, 1);
    } catch {
      setError("Failed to load PDF. The file may be password protected or corrupted.");
    } finally {
      setLoading(false);
    }
  }, []);

  const changePage = async (pageNum: number) => {
    if (!pdfDocJsRef.current || pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
    await renderPage(pdfDocJsRef.current, pageNum);
  };

  const applyPreset = (preset: "tight" | "standard" | "headerFooter" | "reset") => {
    if (preset === "tight") {
      setTopPt(20);
      setBottomPt(20);
      setLeftPt(20);
      setRightPt(20);
    } else if (preset === "standard") {
      setTopPt(36);
      setBottomPt(36);
      setLeftPt(36);
      setRightPt(36);
    } else if (preset === "headerFooter") {
      setTopPt(54);
      setBottomPt(54);
      setLeftPt(20);
      setRightPt(20);
    } else {
      setTopPt(0);
      setBottomPt(0);
      setLeftPt(0);
      setRightPt(0);
    }
  };

  const crop = async () => {
    if (!srcBytesRef.current) return;
    setProcessing(true);
    setError("");

    try {
      const pdfDoc = await PDFDocument.load(srcBytesRef.current);
      const total = pdfDoc.getPageCount();

      for (let i = 0; i < total; i++) {
        const pageNum = i + 1;
        let shouldCrop = false;
        if (scope === "all") shouldCrop = true;
        else if (scope === "current" && pageNum === currentPage) shouldCrop = true;
        else if (scope === "odd" && pageNum % 2 === 1) shouldCrop = true;
        else if (scope === "even" && pageNum % 2 === 0) shouldCrop = true;

        if (shouldCrop) {
          const page = pdfDoc.getPage(i);
          const origW = page.getWidth();
          const origH = page.getHeight();

          const cropX = Math.max(0, leftPt);
          const cropY = Math.max(0, bottomPt);
          const cropW = Math.max(20, origW - leftPt - rightPt);
          const cropH = Math.max(20, origH - topPt - bottomPt);

          page.setCropBox(cropX, cropY, cropW, cropH);
          page.setMediaBox(cropX, cropY, cropW, cropH);
        }
      }

      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const filename = (file?.name || "document").replace(/\.pdf$/i, "") + `_cropped.pdf`;

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      sendOutput({
        type: "pdf",
        data: blob,
        filename,
        sourceToolSlug: "crop-pdf",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to crop PDF document.");
    } finally {
      setProcessing(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_cropped.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setTotalPages(0);
    setCurrentPage(1);
    setPreviewSrc("");
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  // Crop overlay box coordinates (relative percentages)
  const overlayLeft = Math.max(0, (leftPt / pageWidth) * 100);
  const overlayRight = Math.max(0, (rightPt / pageWidth) * 100);
  const overlayTop = Math.max(0, (topPt / pageHeight) * 100);
  const overlayBottom = Math.max(0, (bottomPt / pageHeight) * 100);

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your PDF here to crop and trim margins"
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
                  {totalPages} total pages • {(file.size / 1024 / 1024).toFixed(2)} MB
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

          {!resultBlob && (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Preview canvas with crop overlay */}
              <div className="lg:col-span-7 p-6 rounded-2xl border border-border-soft bg-surface flex flex-col items-center justify-center">
                <div className="relative inline-block border border-border rounded-lg overflow-hidden bg-white shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {previewSrc && (
                    <img
                      src={previewSrc}
                      alt={`Page ${currentPage}`}
                      className="block max-h-[480px] w-auto"
                    />
                  )}
                  {/* Crop region box */}
                  <div
                    className="absolute border-2 border-accent bg-accent/10 transition-all pointer-events-none"
                    style={{
                      top: `${overlayTop}%`,
                      bottom: `${overlayBottom}%`,
                      left: `${overlayLeft}%`,
                      right: `${overlayRight}%`,
                    }}
                  >
                    <div className="absolute top-1 left-1 bg-accent text-white text-[9px] px-1 py-0.5 rounded font-mono">
                      Crop Area
                    </div>
                  </div>
                </div>

                {/* Page pagination */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => changePage(currentPage - 1)}
                    aria-label="Previous page"
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-border-soft hover:bg-surface-hover disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-xs font-medium text-text-secondary">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => changePage(currentPage + 1)}
                    aria-label="Next page"
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-border-soft hover:bg-surface-hover disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {/* Crop controls */}
              <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl border border-border-soft bg-surface space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-border-soft">
                  <div className="flex items-center gap-2">
                    <Crop className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-heading font-semibold">Margin Controls</h3>
                  </div>
                  {/* Unit switcher */}
                  <div className="flex rounded-lg border border-border-soft p-0.5 bg-surface-raised">
                    {(["pt", "mm", "in"] as Unit[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`text-xs px-2.5 py-1 sm:text-[11px] sm:px-2 sm:py-0.5 rounded font-medium min-h-[32px] sm:min-h-0 flex items-center justify-center ${
                          unit === u
                            ? "bg-surface text-accent shadow-xs font-semibold"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-xs font-medium text-text-secondary block mb-2">Presets</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyPreset("tight")}
                      className="text-xs px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary text-left min-h-[38px] flex items-center"
                    >
                      Tight (20pt / ~0.3&quot;)
                    </button>
                    <button
                      onClick={() => applyPreset("standard")}
                      className="text-xs px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary text-left min-h-[38px] flex items-center"
                    >
                      Standard (36pt / 0.5&quot;)
                    </button>
                    <button
                      onClick={() => applyPreset("headerFooter")}
                      className="text-xs px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary text-left min-h-[38px] flex items-center"
                    >
                      Trim Header/Footer
                    </button>
                    <button
                      onClick={() => applyPreset("reset")}
                      className="text-xs px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary hover:text-text-primary text-left min-h-[38px] flex items-center"
                    >
                      Reset (0pt)
                    </button>
                  </div>
                </div>

                {/* Margins form */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Top Margin</label>
                    <input
                      type="number"
                      step={unit === "in" ? 0.05 : 1}
                      min={0}
                      value={ptToUnit(topPt, unit)}
                      onChange={(e) => setTopPt(unitToPt(parseFloat(e.target.value) || 0, unit))}
                      className="w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Bottom Margin</label>
                    <input
                      type="number"
                      step={unit === "in" ? 0.05 : 1}
                      min={0}
                      value={ptToUnit(bottomPt, unit)}
                      onChange={(e) => setBottomPt(unitToPt(parseFloat(e.target.value) || 0, unit))}
                      className="w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Left Margin</label>
                    <input
                      type="number"
                      step={unit === "in" ? 0.05 : 1}
                      min={0}
                      value={ptToUnit(leftPt, unit)}
                      onChange={(e) => setLeftPt(unitToPt(parseFloat(e.target.value) || 0, unit))}
                      className="w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Right Margin</label>
                    <input
                      type="number"
                      step={unit === "in" ? 0.05 : 1}
                      min={0}
                      value={ptToUnit(rightPt, unit)}
                      onChange={(e) => setRightPt(unitToPt(parseFloat(e.target.value) || 0, unit))}
                      className="w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                  </div>
                </div>

                {/* Scope selector */}
                <div>
                  <span className="text-xs font-medium text-text-secondary block mb-2">Apply Crop To</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "all", label: "All Pages" },
                      { id: "current", label: `Page ${currentPage} Only` },
                      { id: "odd", label: "Odd Pages" },
                      { id: "even", label: "Even Pages" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setScope(item.id as Scope)}
                        className={`text-xs px-3 py-2.5 sm:py-2 rounded-lg border text-left transition-colors min-h-[44px] flex items-center ${
                          scope === item.id
                            ? "border-accent bg-accent/10 text-accent font-medium"
                            : "border-border-soft hover:bg-surface-hover text-text-secondary"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <ResultPanel
            loading={processing}
            loadingLabel="Cropping PDF Document..."
            error={error}
            onAction={!resultBlob ? crop : undefined}
            actionLabel="Crop PDF"
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Cropped PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Crop Another PDF"
            sourceToolSlug="crop-pdf"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  PDF Cropped Successfully!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Page margins have been trimmed. The output file has been generated locally in your browser.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
