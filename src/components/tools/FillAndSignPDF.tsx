"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import {
  PenTool,
  Type,
  Check,
  X,
  Calendar,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Annotation {
  id: string;
  page: number;
  type: "signature" | "text" | "check" | "cross";
  x: number; // percentage of container width
  y: number; // percentage of container height
  width: number; // percentage of container width
  height: number; // percentage of container height
  content?: string; // text string or data URL for signature
  fontSize?: number;
  color?: string;
}

export default function FillAndSignPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewSrc, setPreviewSrc] = useState("");
  const [pageNaturalWidth, setPageNaturalWidth] = useState(612);
  const [pageNaturalHeight, setPageNaturalHeight] = useState(792);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Signature Modal State
  const [showSigModal, setShowSigModal] = useState(false);
  const [sigMode, setSigMode] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("");
  const [sigColor, setSigColor] = useState("#000000");
  const [rememberSig, setRememberSig] = useState(true);
  const [savedSig, setSavedSig] = useState<string | null>(null);

  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Text Tool State
  const [activeTool, setActiveTool] = useState<"select" | "text" | "check" | "cross">("select");
  const [currentFontSize, setCurrentFontSize] = useState(14);

  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const srcBytesRef = useRef<ArrayBuffer | null>(null);
  const pdfDocJsRef = useRef<any>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const { sendOutput } = useWorkflowStore();

  // Load saved signature on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("saved_pdf_signature");
      if (stored) setSavedSig(stored);
    } catch {
      // localStorage may be disabled
    }
  }, []);

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      setPageNaturalWidth(viewport.width);
      setPageNaturalHeight(viewport.height);

      const displayScale = Math.min(1.4, 600 / viewport.width);
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
    setAnnotations([]);
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

  // Canvas drawing handlers for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const addSignatureToDoc = (dataUrl: string) => {
    if (rememberSig) {
      try {
        localStorage.setItem("saved_pdf_signature", dataUrl);
        setSavedSig(dataUrl);
      } catch {
        // ignore
      }
    }

    const newAnno: Annotation = {
      id: "sig_" + Date.now(),
      page: currentPage,
      type: "signature",
      x: 35,
      y: 40,
      width: 25,
      height: 12,
      content: dataUrl,
    };
    setAnnotations((prev) => [...prev, newAnno]);
    setSelectedAnnotationId(newAnno.id);
    setShowSigModal(false);
  };

  const handleApplySignature = () => {
    if (sigMode === "draw") {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      addSignatureToDoc(dataUrl);
    } else if (sigMode === "type") {
      if (!typedName) return;
      // Generate canvas signature from typed text
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 400;
      tempCanvas.height = 160;
      const ctx = tempCanvas.getContext("2d")!;
      ctx.fillStyle = sigColor;
      ctx.font = "italic 44px 'Brush Script MT', 'Dancing Script', 'Caveat', cursive";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(typedName, 200, 80);
      addSignatureToDoc(tempCanvas.toDataURL("image/png"));
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) addSignatureToDoc(dataUrl);
    };
    reader.readAsDataURL(f);
  };

  const clearSavedSignature = () => {
    try {
      localStorage.removeItem("saved_pdf_signature");
      setSavedSig(null);
    } catch {
      // ignore
    }
  };

  // Add click annotations on page container
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "select") return;
    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeTool === "text") {
      const newAnno: Annotation = {
        id: "text_" + Date.now(),
        page: currentPage,
        type: "text",
        x: xPct,
        y: yPct,
        width: 30,
        height: 6,
        content: "Type text here",
        fontSize: currentFontSize,
        color: "#000000",
      };
      setAnnotations((prev) => [...prev, newAnno]);
      setSelectedAnnotationId(newAnno.id);
      setActiveTool("select");
    } else if (activeTool === "check" || activeTool === "cross") {
      const newAnno: Annotation = {
        id: activeTool + "_" + Date.now(),
        page: currentPage,
        type: activeTool,
        x: xPct,
        y: yPct,
        width: 5,
        height: 5,
        color: activeTool === "check" ? "#16a34a" : "#dc2626",
      };
      setAnnotations((prev) => [...prev, newAnno]);
      setSelectedAnnotationId(newAnno.id);
      setActiveTool("select");
    }
  };

  const updateAnnotationText = (id: string, text: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, content: text } : a))
    );
  };

  const removeAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  const addTodayDate = () => {
    const today = new Date().toISOString().split("T")[0];
    const newAnno: Annotation = {
      id: "text_date_" + Date.now(),
      page: currentPage,
      type: "text",
      x: 35,
      y: 50,
      width: 25,
      height: 6,
      content: today,
      fontSize: 14,
      color: "#000000",
    };
    setAnnotations((prev) => [...prev, newAnno]);
    setSelectedAnnotationId(newAnno.id);
  };

  // Sign and produce PDF document
  const signAndDownload = async () => {
    if (!srcBytesRef.current) return;
    setSigning(true);
    setError("");

    try {
      const pdfDoc = await PDFDocument.load(srcBytesRef.current);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const anno of annotations) {
        const pageIdx = anno.page - 1;
        if (pageIdx < 0 || pageIdx >= pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPage(pageIdx);
        const pWidth = page.getWidth();
        const pHeight = page.getHeight();

        // Convert percentage coordinates to PDF points (Y is flipped in PDF space)
        const pdfX = (anno.x / 100) * pWidth;
        const pdfW = (anno.width / 100) * pWidth;
        const pdfH = (anno.height / 100) * pHeight;
        const pdfY = pHeight - (anno.y / 100) * pHeight - pdfH;

        if (anno.type === "signature" && anno.content) {
          const pngBytes = await fetch(anno.content).then((r) => r.arrayBuffer());
          const embeddedImage = await pdfDoc.embedPng(pngBytes);
          page.drawImage(embeddedImage, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
          });
        } else if (anno.type === "text" && anno.content) {
          const fontSize = anno.fontSize || 12;
          page.drawText(anno.content, {
            x: pdfX,
            y: pdfY + 4,
            size: fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
        } else if (anno.type === "check") {
          page.drawText("✓", {
            x: pdfX,
            y: pdfY,
            size: 16,
            font: helvetica,
            color: rgb(0.1, 0.6, 0.2),
          });
        } else if (anno.type === "cross") {
          page.drawText("✗", {
            x: pdfX,
            y: pdfY,
            size: 16,
            font: helvetica,
            color: rgb(0.8, 0.1, 0.1),
          });
        }
      }

      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const filename = (file?.name || "document").replace(/\.pdf$/i, "") + "_signed.pdf";

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      sendOutput({
        type: "pdf",
        data: blob,
        filename,
        sourceToolSlug: "fill-and-sign-pdf",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to sign PDF document.");
    } finally {
      setSigning(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_signed.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setTotalPages(0);
    setCurrentPage(1);
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  const currentPageAnnotations = annotations.filter((a) => a.page === currentPage);

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your PDF here to sign or fill forms"
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
                  Page {currentPage} of {totalPages} • {(file.size / 1024 / 1024).toFixed(2)} MB
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
            <div className="space-y-4">
              {/* Interactive Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border-soft bg-surface gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Add Signature */}
                  <button
                    onClick={() => setShowSigModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:opacity-90 transition-opacity min-h-[38px] sm:min-h-0"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Add Signature
                  </button>

                  {savedSig && (
                    <button
                      onClick={() => addSignatureToDoc(savedSig)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-lg border border-accent/30 bg-accent/5 text-accent text-xs font-medium hover:bg-accent/10 transition-colors min-h-[38px] sm:min-h-0"
                      title="Quick insert your saved signature"
                    >
                      Insert Saved Signature
                    </button>
                  )}

                  {/* Add Text */}
                  <button
                    onClick={() => setActiveTool(activeTool === "text" ? "select" : "text")}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[38px] sm:min-h-0 ${
                      activeTool === "text"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border-soft hover:bg-surface-hover text-text-secondary"
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    {activeTool === "text" ? "Click to place text" : "Add Text"}
                  </button>

                  {/* Quick Date Stamp */}
                  <button
                    onClick={addTodayDate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary text-xs min-h-[38px] sm:min-h-0"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Today&apos;s Date
                  </button>

                  {/* Checkmark Stamp */}
                  <button
                    onClick={() => setActiveTool(activeTool === "check" ? "select" : "check")}
                    className={`inline-flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[38px] sm:min-h-0 ${
                      activeTool === "check"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                        : "border-border-soft hover:bg-surface-hover text-text-secondary"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Checkmark
                  </button>

                  {/* Cross Stamp */}
                  <button
                    onClick={() => setActiveTool(activeTool === "cross" ? "select" : "cross")}
                    className={`inline-flex items-center gap-1 px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[38px] sm:min-h-0 ${
                      activeTool === "cross"
                        ? "border-red-500 bg-red-500/10 text-red-600"
                        : "border-border-soft hover:bg-surface-hover text-text-secondary"
                    }`}
                  >
                    <X className="w-3.5 h-3.5 text-red-500" />
                    Cross
                  </button>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-soft">
                  <span className="text-xs text-text-secondary font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => changePage(currentPage - 1)}
                      aria-label="Previous page"
                      className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-border-soft hover:bg-surface-hover disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => changePage(currentPage + 1)}
                      aria-label="Next page"
                      className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-border-soft hover:bg-surface-hover disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Page Canvas Container */}
              <div className="flex justify-center p-2 sm:p-6 bg-surface border border-border-soft rounded-2xl overflow-x-auto max-w-full">
                <div
                  ref={pageContainerRef}
                  onClick={handlePageClick}
                  className={`relative shadow-lg border border-border rounded-lg bg-white overflow-hidden select-none ${
                    activeTool !== "select" ? "cursor-crosshair" : "cursor-default"
                  }`}
                  style={{ width: "fit-content" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {previewSrc && (
                    <img
                      src={previewSrc}
                      alt={`Page ${currentPage}`}
                      className="block max-h-[680px] w-auto pointer-events-none"
                    />
                  )}

                  {/* Annotations overlay on current page */}
                  {currentPageAnnotations.map((anno) => {
                    const isSelected = selectedAnnotationId === anno.id;
                    return (
                      <div
                        key={anno.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAnnotationId(anno.id);
                        }}
                        className={`absolute group cursor-move transition-shadow ${
                          isSelected
                            ? "ring-2 ring-accent border border-accent bg-accent/5 rounded"
                            : "hover:ring-1 hover:ring-accent/40"
                        }`}
                        style={{
                          left: `${anno.x}%`,
                          top: `${anno.y}%`,
                          width: `${anno.width}%`,
                          height: `${anno.height}%`,
                        }}
                      >
                        {anno.type === "signature" && anno.content && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={anno.content}
                            alt="Signature"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        )}

                        {anno.type === "text" && (
                          <input
                            type="text"
                            value={anno.content || ""}
                            onChange={(e) => updateAnnotationText(anno.id, e.target.value)}
                            className="w-full h-full bg-transparent text-black text-xs font-sans px-1 outline-none"
                            style={{ fontSize: `${anno.fontSize || 12}px` }}
                          />
                        )}

                        {anno.type === "check" && (
                          <div className="w-full h-full flex items-center justify-center font-bold text-emerald-600">
                            ✓
                          </div>
                        )}

                        {anno.type === "cross" && (
                          <div className="w-full h-full flex items-center justify-center font-bold text-red-600">
                            ✗
                          </div>
                        )}

                        {/* Delete button */}
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAnnotation(anno.id);
                            }}
                            className="absolute -top-3 -right-3 p-1 rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Signature Creation Modal */}
          {showSigModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-soft">
                  <h3 className="text-base font-heading font-semibold">Create Your Signature</h3>
                  <button
                    onClick={() => setShowSigModal(false)}
                    aria-label="Close modal"
                    className="w-10 h-10 -mr-2 flex items-center justify-center text-text-secondary hover:text-text-primary"
                  >
                    <X className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Mode Selector */}
                <div className="flex rounded-lg border border-border-soft p-1 bg-surface-raised">
                  {(["draw", "type", "upload"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSigMode(m)}
                      className={`flex-1 py-2 sm:py-1.5 min-h-[38px] sm:min-h-0 text-xs font-medium rounded-md capitalize transition-colors ${
                        sigMode === m
                          ? "bg-surface text-accent shadow-xs"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Draw Mode */}
                {sigMode === "draw" && (
                  <div className="space-y-3">
                    <div className="relative border border-border rounded-xl bg-white overflow-hidden h-40">
                      <canvas
                        ref={sigCanvasRef}
                        width={460}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-full cursor-crosshair touch-none"
                      />
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-black/70 min-h-[32px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary">Ink:</span>
                        {["#000000", "#1e3a8a"].map((c) => (
                          <button
                            key={c}
                            onClick={() => setSigColor(c)}
                            aria-label={`Select color ${c}`}
                            className={`w-7 h-7 sm:w-5 sm:h-5 rounded-full border-2 ${
                              sigColor === c ? "border-accent scale-110" : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Type Mode */}
                {sigMode === "type" && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Type your full name"
                      className="w-full px-3 py-2 text-base sm:text-sm rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />

                    {typedName && (
                      <div className="h-28 rounded-xl border border-border bg-white flex items-center justify-center overflow-hidden px-2">
                        <span
                          className="text-3xl sm:text-4xl text-black font-cursive italic truncate"
                          style={{
                            fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', cursive",
                            color: sigColor,
                          }}
                        >
                          {typedName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Mode */}
                {sigMode === "upload" && (
                  <div className="p-6 sm:p-8 border-2 border-dashed border-border-soft rounded-xl text-center space-y-2">
                    <Upload className="w-8 h-8 text-accent mx-auto" />
                    <label className="block text-xs font-medium text-accent hover:underline cursor-pointer">
                      Upload an image of your signature (PNG or JPG)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-text-secondary">
                      Best with transparent background or high contrast
                    </p>
                  </div>
                )}

                {/* Save locally option */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer min-h-[32px]">
                    <input
                      type="checkbox"
                      checked={rememberSig}
                      onChange={(e) => setRememberSig(e.target.checked)}
                      className="w-4 h-4 rounded border-border-soft text-accent"
                    />
                    <span>Remember signature on this device</span>
                  </label>

                  {savedSig && (
                    <button
                      onClick={clearSavedSignature}
                      className="text-[11px] text-red-500 hover:underline text-left sm:text-right py-1"
                    >
                      Delete saved signature
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-soft">
                  <button
                    onClick={() => setShowSigModal(false)}
                    className="px-4 py-2.5 sm:py-2 text-sm sm:text-xs rounded-lg border border-border-soft hover:bg-surface-hover text-text-secondary min-h-[44px] sm:min-h-0"
                  >
                    Cancel
                  </button>
                  {sigMode !== "upload" && (
                    <button
                      onClick={handleApplySignature}
                      className="px-5 py-2.5 sm:py-2 text-sm sm:text-xs font-medium rounded-lg bg-accent text-white hover:opacity-90 min-h-[44px] sm:min-h-0"
                    >
                      Apply Signature
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <ResultPanel
            loading={signing}
            loadingLabel="Applying Signatures & Exporting PDF..."
            error={error}
            onAction={!resultBlob && annotations.length > 0 ? signAndDownload : undefined}
            actionLabel="Sign & Download PDF"
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Signed PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Sign Another PDF"
            sourceToolSlug="fill-and-sign-pdf"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  Document Signed Successfully!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Signatures, dates, and form annotations have been merged directly into your PDF document.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
