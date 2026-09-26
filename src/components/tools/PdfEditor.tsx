"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import {
  Type, PenTool, Highlighter, Eraser, ImagePlus, Trash2,
  ChevronLeft, ChevronRight, RotateCw, FileText,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = "select" | "text" | "draw" | "highlight" | "whiteout" | "image";
interface Anno {
  id: string; page: number; kind: "text" | "drawing" | "highlight" | "whiteout" | "image";
  x: number; y: number; w: number; h: number;
  content?: string; size?: number; color?: string; width?: number;
}

interface PageState { orig: number; rotation: number; deleted: boolean; thumb: string }

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [current, setCurrent] = useState(1);
  const [preview, setPreview] = useState("");
  const [annos, setAnnos] = useState<Anno[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(14);
  const [penWidth, setPenWidth] = useState(3);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const srcRef = useRef<ArrayBuffer | null>(null);
  const pdfRef = useRef<{ numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvas: HTMLCanvasElement; viewport: unknown }) => { promise: Promise<void> } }> } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const { sendOutput } = useWorkflowStore();

  const renderPage = useCallback(async (pdf: NonNullable<typeof pdfRef.current>, n: number) => {
    const page = await pdf.getPage(n);
    const vp = page.getViewport({ scale: 1.0 });
    const scale = Math.min(1.5, 640 / vp.width);
    const svp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = svp.width; canvas.height = svp.height;
    await page.render({ canvas, viewport: svp }).promise;
    setPreview(canvas.toDataURL());
  }, []);

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f); setLoading(true); setError(null);
    setAnnos([]); setResultUrl(null); setCurrent(1);
    try {
      const bytes = await f.arrayBuffer();
      srcRef.current = bytes;
      const task = (pdfjsLib as unknown as { getDocument: (o: unknown) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<{ getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvas: HTMLCanvasElement; viewport: unknown }) => { promise: Promise<void> } }> }> } }).getDocument({ data: new Uint8Array(bytes.slice(0)) });
      const pdf = await task.promise;
      pdfRef.current = pdf as unknown as NonNullable<typeof pdfRef.current>;
      const thumbs: PageState[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i);
        const pg = p as unknown as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: { canvas: HTMLCanvasElement; viewport: unknown }) => { promise: Promise<void> } };
        const vp = pg.getViewport({ scale: 0.25 });
        const c = document.createElement("canvas");
        c.width = vp.width; c.height = vp.height;
        await pg.render({ canvas: c, viewport: vp }).promise;
        thumbs.push({ orig: i, rotation: 0, deleted: false, thumb: c.toDataURL() });
      }
      setPages(thumbs);
      await renderPage(pdfRef.current!, 1);
    } catch {
      setError("Could not open this PDF. It may be encrypted or corrupted.");
    } finally { setLoading(false); }
  }, [renderPage]);

  const go = async (n: number) => {
    if (!pdfRef.current || n < 1 || n > pages.length) return;
    setCurrent(n); setSelected(null); setTool("select");
    await renderPage(pdfRef.current, pages[n - 1].orig);
  };

  const rotate = (n: number) => {
    setPages((p) => p.map((pg, i) => (i === n - 1 ? { ...pg, rotation: (pg.rotation + 90) % 360 } : pg)));
  };
  const toggleDelete = (n: number) => {
    setPages((p) => p.map((pg, i) => (i === n - 1 ? { ...pg, deleted: !pg.deleted } : pg)));
  };

  // Click-to-place for text/highlight/whiteout
  const onBoxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "select" || tool === "draw" || tool === "image") return;
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const x = Math.min(85, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(90, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    const id = `${tool}_${Date.now()}`;
    if (tool === "text") {
      setAnnos((a) => [...a, { id, page: current, kind: "text", x, y, w: 32, h: 6, content: "Type here", size, color }]);
    } else if (tool === "highlight") {
      setAnnos((a) => [...a, { id, page: current, kind: "highlight", x, y, w: 30, h: 4, color: "#facc15" }]);
    } else if (tool === "whiteout") {
      setAnnos((a) => [...a, { id, page: current, kind: "whiteout", x, y, w: 30, h: 5 }]);
    }
    setSelected(id);
    setTool("select");
  };

  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const url = rd.result as string;
      const id = `image_${Date.now()}`;
      setAnnos((a) => [...a, { id, page: current, kind: "image", x: 30, y: 35, w: 30, h: 20, content: url }]);
      setSelected(id); setTool("select");
    };
    rd.readAsDataURL(f);
    e.target.value = "";
  };

  // Drag to move annotations
  const onAnnoDown = (e: React.MouseEvent, id: string) => {
    if (tool !== "select") return;
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const a = annos.find((x) => x.id === id);
    if (!a) return;
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    dragRef.current = { id, dx: px - a.x, dy: py - a.y };
    setSelected(id);
    e.stopPropagation();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragRef.current || !boxRef.current) return;
      const r = boxRef.current.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 100;
      const py = ((e.clientY - r.top) / r.height) * 100;
      const { id, dx, dy } = dragRef.current;
      setAnnos((prev) => prev.map((a) => (a.id === id ? { ...a, x: Math.min(95, Math.max(0, px - dx)), y: Math.min(95, Math.max(0, py - dy)) } : a)));
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  // Freehand drawing overlay
  const drawPos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = drawRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: ((cx - r.left) / r.width) * c.width, y: ((cy - r.top) / r.height) * c.height };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool !== "draw") return;
    drawing.current = true;
    const c = drawRef.current, ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { x, y } = drawPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = color; ctx.lineWidth = penWidth * 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
    e.preventDefault();
  };
  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || tool !== "draw") return;
    const ctx = drawRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = drawPos(e);
    ctx.lineTo(x, y); ctx.stroke();
    e.preventDefault();
  };
  const endDraw = () => { drawing.current = false; };
  const placeDrawing = () => {
    const c = drawRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    // blank canvas check
    const blank = document.createElement("canvas");
    blank.width = c.width; blank.height = c.height;
    if (url === blank.toDataURL()) return;
    const id = `drawing_${Date.now()}`;
    setAnnos((a) => [...a, { id, page: current, kind: "drawing", x: 0, y: 0, w: 100, h: 100, content: url, width: penWidth }]);
    const ctx = c.getContext("2d");
    ctx?.clearRect(0, 0, c.width, c.height);
    setSelected(id); setTool("select");
  };
  const clearDraw = () => {
    const c = drawRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  const removeSel = () => {
    if (!selected) return;
    setAnnos((a) => a.filter((x) => x.id !== selected));
    setSelected(null);
  };

  const exportPdf = async () => {
    if (!srcRef.current || !file) return;
    setExporting(true); setError(null);
    try {
      const src = await PDFDocument.load(srcRef.current);
      const out = await PDFDocument.create();
      const font = await out.embedFont(StandardFonts.Helvetica);
      const kept = pages.map((p, i) => ({ ...p, idx: i })).filter((p) => !p.deleted);
      if (!kept.length) throw new Error("All pages deleted — restore at least one page.");
      const copied = await out.copyPages(src, kept.map((k) => pages[k.idx].orig - 1));
      copied.forEach((pg, i) => {
        const rot = kept[i].rotation;
        if (rot) pg.setRotation(degrees(rot));
        out.addPage(pg);
      });
      // Annotations: map original page num -> new index
      const pageMap = new Map<number, number>();
      kept.forEach((k, i) => pageMap.set(pages[k.idx].orig, i));
      for (const a of annos) {
        const ni = pageMap.get(a.page);
        if (ni === undefined) continue;
        const pg = out.getPage(ni);
        const W = pg.getWidth(), H = pg.getHeight();
        const px = (a.x / 100) * W, pw = (a.w / 100) * W, ph = (a.h / 100) * H;
        const py = H - (a.y / 100) * H - ph;
        if (a.kind === "text" && a.content) {
          const c = hexToRgb(a.color || "#111111");
          pg.drawText(a.content, { x: px, y: py + 2, size: a.size || 14, font, color: rgb(c.r, c.g, c.b) });
        } else if (a.kind === "highlight") {
          pg.drawRectangle({ x: px, y: py, width: pw, height: ph, color: rgb(0.98, 0.8, 0.08), opacity: 0.45 });
        } else if (a.kind === "whiteout") {
          pg.drawRectangle({ x: px, y: py, width: pw, height: ph, color: rgb(1, 1, 1), opacity: 1 });
        } else if ((a.kind === "image" || a.kind === "drawing") && a.content) {
          const bytes = await fetch(a.content).then((r) => r.arrayBuffer());
          let img;
          try { img = await out.embedPng(bytes); }
          catch { img = await out.embedJpg(bytes); }
          pg.drawImage(img, { x: px, y: py, width: pw, height: ph });
        }
      }
      const bytes = await out.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      sendOutput({ type: "pdf", data: blob, filename: file.name.replace(/\.pdf$/i, "") + "-edited.pdf", sourceToolSlug: "pdf-editor", createdAt: Date.now() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally { setExporting(false); }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "-edited.pdf";
    a.click();
  };

  const cur = annos.filter((a) => a.page === current);
  const tools: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: "select", label: "Select", icon: null },
    { id: "text", label: "Text", icon: <Type className="w-3.5 h-3.5" /> },
    { id: "draw", label: "Draw", icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: "highlight", label: "Highlight", icon: <Highlighter className="w-3.5 h-3.5" /> },
    { id: "whiteout", label: "Whiteout", icon: <Eraser className="w-3.5 h-3.5" /> },
    { id: "image", label: "Image", icon: <ImagePlus className="w-3.5 h-3.5" /> },
  ];

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone onFiles={onFiles} accept="application/pdf,.pdf" label="Drop a PDF here to start editing" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border-soft bg-surface">
            <FileText className="w-5 h-5 text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-text-secondary">{pages.filter((p) => !p.deleted).length}/{pages.length} pages · {annos.length} edits</p>
            </div>
            <button onClick={() => { setFile(null); setPages([]); setAnnos([]); setResultUrl(null); }} className="text-xs text-text-secondary hover:text-error">Change file</button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-border-soft bg-surface">
            {tools.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border min-h-[38px] ${tool === t.id ? "border-accent bg-accent/10 text-accent" : "border-transparent text-text-secondary hover:bg-surface-hover"}`}>
                {t.icon}{t.label}
              </button>
            ))}
            <span className="w-px h-6 bg-border-soft mx-1" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" title="Color" />
            <label className="text-xs text-text-secondary flex items-center gap-1">Text
              <input type="number" min={8} max={72} value={size} onChange={(e) => setSize(Number(e.target.value) || 14)} className="w-14 px-1.5 py-1 border border-border rounded bg-surface text-xs" />
            </label>
            <label className="text-xs text-text-secondary flex items-center gap-1">Pen
              <input type="number" min={1} max={20} value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value) || 3)} className="w-14 px-1.5 py-1 border border-border rounded bg-surface text-xs" />
            </label>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-hover cursor-pointer border border-transparent min-h-[38px]">
              <ImagePlus className="w-3.5 h-3.5" /> Upload img
              <input type="file" accept="image/*" onChange={onImageFile} className="hidden" />
            </label>
            {selected && (
              <button onClick={removeSel} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-error-text hover:bg-error-soft min-h-[38px]">
                <Trash2 className="w-3.5 h-3.5" /> Delete selected
              </button>
            )}
          </div>
          {tool === "draw" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={placeDrawing}>Place drawing on page</Button>
              <Button size="sm" variant="secondary" onClick={clearDraw}>Clear strokes</Button>
            </div>
          )}
          {tool !== "select" && tool !== "draw" && (
            <p className="text-xs text-accent font-medium">Click on the page to place {tool}. Drag items to move, click to select.</p>
          )}

          <div className="grid md:grid-cols-[120px_1fr] gap-3">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[640px] order-2 md:order-1">
              {pages.map((p, i) => (
                <div key={i} className={`relative shrink-0 rounded-lg border overflow-hidden ${i + 1 === current ? "border-accent ring-1 ring-accent" : "border-border-soft"} ${p.deleted ? "opacity-40 grayscale" : ""}`}>
                  <button onClick={() => go(i + 1)} className="block">
                    <img src={p.thumb} alt={`Page ${p.orig}`} className="w-24 md:w-full h-auto" style={{ transform: `rotate(${p.rotation}deg)` }} />
                  </button>
                  <div className="flex items-center justify-between px-1 py-0.5 bg-surface text-[10px]">
                    <span>{p.deleted ? "deleted" : `p${p.orig}`}</span>
                    <span className="flex gap-0.5">
                      <button onClick={() => rotate(i + 1)} title="Rotate" className="p-1 hover:text-accent"><RotateCw className="w-3 h-3" /></button>
                      <button onClick={() => toggleDelete(i + 1)} title="Delete/restore" className="p-1 hover:text-error"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div className="order-1 md:order-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <button disabled={current <= 1} onClick={() => go(current - 1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-soft disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-xs font-medium px-2">Page {current} / {pages.length}{pages[current - 1]?.deleted ? " (deleted)" : ""}</span>
                  <button disabled={current >= pages.length} onClick={() => go(current + 1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-soft disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" onClick={() => rotate(current)}>Rotate</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleDelete(current)}>{pages[current - 1]?.deleted ? "Restore" : "Delete"}</Button>
                </div>
              </div>
              <div className="flex justify-center p-2 sm:p-4 bg-surface border border-border-soft rounded-2xl overflow-x-auto">
                <div ref={boxRef} onClick={onBoxClick}
                  className={`relative shadow-lg border border-border rounded-lg bg-white overflow-hidden select-none ${tool === "text" || tool === "highlight" || tool === "whiteout" ? "cursor-crosshair" : ""}`}
                  style={{ width: "fit-content", maxWidth: "100%" }}>
                  {preview && <img src={preview} alt={`Page ${current}`} className="block max-h-[640px] w-auto pointer-events-none" draggable={false} />}
                  {tool === "draw" && (
                    <canvas ref={drawRef} width={800} height={1000}
                      onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                      onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none" />
                  )}
                  {cur.map((a) => (
                    <div key={a.id} onMouseDown={(e) => onAnnoDown(e, a.id)} onClick={(e) => { e.stopPropagation(); setSelected(a.id); }}
                      className={`absolute ${tool === "select" ? "cursor-move" : "pointer-events-none"} ${selected === a.id ? "ring-2 ring-accent rounded" : ""}`}
                      style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, background: a.kind === "highlight" ? "rgba(250,204,21,0.5)" : a.kind === "whiteout" ? "#ffffff" : undefined, border: a.kind === "whiteout" ? "1px dashed #ccc" : undefined }}>
                      {a.kind === "text" && (
                        <input value={a.content || ""} onChange={(e) => setAnnos((p) => p.map((x) => (x.id === a.id ? { ...x, content: e.target.value } : x)))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full h-full bg-transparent outline-none px-1" style={{ fontSize: `${a.size || 14}px`, color: a.color || "#111" }} />
                      )}
                      {(a.kind === "image" || a.kind === "drawing") && a.content && <img src={a.content} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />}
                      {selected === a.id && (
                        <button onClick={(e) => { e.stopPropagation(); setAnnos((p) => p.filter((x) => x.id !== a.id)); setSelected(null); }}
                          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ResultPanel loading={exporting || loading} loadingLabel={loading ? "Opening PDF..." : "Exporting PDF..."} error={error}
            onAction={!resultUrl ? exportPdf : undefined} actionLabel={`Save & download (${pages.filter((p) => !p.deleted).length} pages)`}
            onDownload={resultUrl ? download : undefined} downloadLabel="Download edited PDF"
            onReset={resultUrl ? () => setResultUrl(null) : undefined}
            sourceToolSlug="pdf-editor" outputType="pdf">
            {resultUrl && <p className="text-sm font-semibold text-success">Edited PDF ready — annotations burned in, rotations and deletions applied.</p>}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
