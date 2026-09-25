"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Columns2, Code, Copy, Check, RotateCcw } from "lucide-react";

const EXPORT_WIDTHS = [800, 1200, 1600];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number): void {
  const scale = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function buildEmbedHtml(slider: number): string {
  return `<!-- Before/after comparison. Replace BEFORE_SRC and AFTER_SRC with your image URLs. -->
<div class="cmp" style="position:relative;max-width:800px;overflow:hidden;border-radius:12px">
<img src="AFTER_SRC" alt="After" style="display:block;width:100%;height:auto" />
<img src="BEFORE_SRC" alt="Before" class="cmp-before" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;clip-path:inset(0 ${100 - slider}% 0 0)" />
<div class="cmp-line" style="position:absolute;top:0;bottom:0;left:${slider}%;width:3px;background:#fff;box-shadow:0 0 8px rgba(0,0,0,.4)"></div>
<input type="range" min="0" max="100" value="${slider}" aria-label="Comparison slider" style="position:absolute;left:0;right:0;bottom:8px;width:100%" oninput="this.parentElement.querySelector('.cmp-before').style.clipPath='inset(0 '+(100-this.value)+'% 0 0)';this.parentElement.querySelector('.cmp-line').style.left=this.value+'%'" />
</div>`;
}

export default function CompareSlider() {
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [slider, setSlider] = useState(50);
  const [exportWidth, setExportWidth] = useState(1200);
  const [mode, setMode] = useState<"snapshot" | "sidebyside">("snapshot");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [embed, setEmbed] = useState(() => buildEmbedHtml(50));
  const previewRef = useRef<HTMLDivElement>(null);

  const handleBefore = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    setBeforeUrl(URL.createObjectURL(f));
    setError(null);
  }, [beforeUrl]);

  const handleAfter = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    setAfterUrl(URL.createObjectURL(f));
    setError(null);
  }, [afterUrl]);

  const handleSlider = useCallback((v: number) => {
    setSlider(v);
    setEmbed(buildEmbedHtml(v));
  }, []);

  const setPointer = useCallback((clientX: number) => {
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    handleSlider(Math.round(pct));
  }, [handleSlider]);

  const exportPng = useCallback(async () => {
    if (!beforeUrl || !afterUrl) return;
    setExporting(true);
    setError(null);
    try {
      const [before, after] = await Promise.all([loadImage(beforeUrl), loadImage(afterUrl)]);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      if (mode === "sidebyside") {
        const cellW = Math.round(exportWidth / 2);
        const cellH = Math.round(cellW * ((before.naturalHeight / before.naturalWidth + after.naturalHeight / after.naturalWidth) / 2));
        canvas.width = exportWidth;
        canvas.height = cellH;
        drawCover(ctx, before, 0, 0, cellW, cellH);
        drawCover(ctx, after, cellW, 0, exportWidth - cellW, cellH);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cellW - 1, 0, 2, cellH);
      } else {
        const outH = Math.round(exportWidth * (before.naturalHeight / before.naturalWidth));
        canvas.width = exportWidth;
        canvas.height = outH;
        drawCover(ctx, after, 0, 0, exportWidth, outH);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, Math.round((exportWidth * slider) / 100), outH);
        ctx.clip();
        drawCover(ctx, before, 0, 0, exportWidth, outH);
        ctx.restore();
        const lx = Math.round((exportWidth * slider) / 100);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.max(0, lx - 2), 0, 4, outH);
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillText("Before", 16, 32);
        ctx.fillText("After", exportWidth - 80, 32);
      }

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png")
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comparison-${exportWidth}px.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
    setExporting(false);
  }, [beforeUrl, afterUrl, exportWidth, mode, slider]);

  const copyEmbed = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — select the snippet manually");
    }
  }, [embed]);

  const reset = useCallback(() => {
    if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    setBeforeUrl("");
    setAfterUrl("");
    setSlider(50);
    setEmbed(buildEmbedHtml(50));
    setError(null);
  }, [beforeUrl, afterUrl]);

  const ready = beforeUrl !== "" && afterUrl !== "";

  return (
    <ToolLayout
      title="Compare Slider"
      description="Stack before and after photos with a draggable divider and export the result."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium mb-1.5">Before image</p>
          {beforeUrl ? (
            <div className="space-y-2">
              <img src={beforeUrl} alt="Before" className="w-full max-h-40 object-cover rounded-xl bg-surface-hover" />
              <DropZone onFiles={handleBefore} accept="image/*" label="Replace before image" />
            </div>
          ) : (
            <DropZone onFiles={handleBefore} accept="image/*" label="Drop before image or click to browse" />
          )}
        </div>
        <div>
          <p className="text-xs font-medium mb-1.5">After image</p>
          {afterUrl ? (
            <div className="space-y-2">
              <img src={afterUrl} alt="After" className="w-full max-h-40 object-cover rounded-xl bg-surface-hover" />
              <DropZone onFiles={handleAfter} accept="image/*" label="Replace after image" />
            </div>
          ) : (
            <DropZone onFiles={handleAfter} accept="image/*" label="Drop after image or click to browse" />
          )}
        </div>
      </div>

      {ready && (
        <div className="space-y-4 mt-4">
          <div
            ref={previewRef}
            className="relative w-full h-64 sm:h-96 overflow-hidden rounded-2xl select-none cursor-ew-resize bg-surface-hover"
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setPointer(e.clientX); }}
            onPointerMove={(e) => { if (e.buttons === 1) setPointer(e.clientX); }}
          >
            <img src={afterUrl} alt="After full" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
            <img
              src={beforeUrl}
              alt="Before clipped"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
              draggable={false}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ left: `${slider}%` }}>
              <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                <Columns2 className="w-5 h-5 text-gray-700" />
              </span>
            </div>
            <span className="absolute top-2 left-2 text-[11px] font-semibold bg-black/60 text-white rounded px-2 py-1">Before</span>
            <span className="absolute top-2 right-2 text-[11px] font-semibold bg-black/60 text-white rounded px-2 py-1">After</span>
          </div>

          <div>
            <label className="text-xs font-medium">Divider: {slider}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => handleSlider(Number(e.target.value))}
              className="w-full h-7 sm:h-5 mt-1"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div>
              <p className="text-xs font-medium mb-1.5">Export mode</p>
              <div className="flex gap-1.5">
                <Button variant={mode === "snapshot" ? "primary" : "secondary"} size="sm" onClick={() => setMode("snapshot")}>
                  Slider snapshot
                </Button>
                <Button variant={mode === "sidebyside" ? "primary" : "secondary"} size="sm" onClick={() => setMode("sidebyside")}>
                  Side by side
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Export width</p>
              <div className="flex gap-1.5">
                {EXPORT_WIDTHS.map((w) => (
                  <Button key={w} variant={exportWidth === w ? "primary" : "secondary"} size="sm" onClick={() => setExportWidth(w)}>
                    {w}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <ResultPanel
            loading={exporting}
            loadingLabel="Exporting comparison..."
            error={error}
            onDownload={exportPng}
            downloadLabel={`Export comparison PNG (${exportWidth}px)`}
            onReset={reset}
            resetLabel="Start Over"
          >
            <div className="space-y-3">
              <div className="sticky bottom-20 md:static flex flex-col sm:flex-row gap-2">
                <Button onClick={exportPng} disabled={exporting} className="w-full sm:w-auto">
                  <Columns2 className="w-4 h-4" /> {exporting ? "Exporting..." : `Export comparison PNG (${exportWidth}px)`}
                </Button>
                <Button variant="secondary" onClick={reset} className="w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" /> Embed HTML (replace BEFORE_SRC / AFTER_SRC)
                </p>
                <textarea
                  value={embed}
                  onChange={(e) => setEmbed(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  className="w-full font-mono text-xs rounded-xl border border-border-soft bg-surface-hover p-3 text-text-primary"
                />
                <Button variant="secondary" size="sm" onClick={copyEmbed} className="mt-2">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy embed HTML"}
                </Button>
              </div>
            </div>
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
