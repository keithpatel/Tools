"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Wand2, Eraser, RotateCcw } from "lucide-react";

const MAX_DIM = 1200;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Scanline flood fill on ImageData: removes connected pixels similar to the seed color.
function floodFillTransparent(imageData: ImageData, seedX: number, seedY: number, threshold: number): void {
  const { width: w, height: h, data } = imageData;
  if (seedX < 0 || seedY < 0 || seedX >= w || seedY >= h) return;
  const si = (seedY * w + seedX) * 4;
  const sr = data[si];
  const sg = data[si + 1];
  const sb = data[si + 2];
  if (data[si + 3] === 0) return;

  const visited = new Uint8Array(w * h);
  const stack: number[] = [seedY * w + seedX];

  const matches = (idx: number): boolean => {
    const o = idx * 4;
    if (visited[idx] || data[o + 3] === 0) return false;
    return colorDist(sr, sg, sb, data[o], data[o + 1], data[o + 2]) <= threshold;
  };

  while (stack.length) {
    const cur = stack.pop() as number;
    let x = cur % w;
    const y = Math.floor(cur / w);
    // Expand left
    let left = x;
    while (left >= 0 && matches(y * w + left)) left--;
    left++;
    // Expand right
    let right = x;
    while (right < w && matches(y * w + right)) right++;
    right--;
    // Fill the span and push neighbors above/below
    for (let i = left; i <= right; i++) {
      const idx = y * w + i;
      visited[idx] = 1;
      data[idx * 4 + 3] = 0;
      if (y > 0) {
        const up = (y - 1) * w + i;
        if (!visited[up]) {
          const o = up * 4;
          if (data[o + 3] !== 0 && colorDist(sr, sg, sb, data[o], data[o + 1], data[o + 2]) <= threshold) {
            stack.push(up);
          }
        }
      }
      if (y < h - 1) {
        const down = (y + 1) * w + i;
        if (!visited[down]) {
          const o = down * 4;
          if (data[o + 3] !== 0 && colorDist(sr, sg, sb, data[o], data[o + 1], data[o + 2]) <= threshold) {
            stack.push(down);
          }
        }
      }
    }
  }

  // Feather edges by 1px: soften opaque pixels adjacent to removed pixels.
  const alphaCopy = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) alphaCopy[i] = data[i * 4 + 3];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (alphaCopy[idx] === 0) continue;
      let touchesHole = false;
      if (x > 0 && alphaCopy[idx - 1] === 0) touchesHole = true;
      else if (x < w - 1 && alphaCopy[idx + 1] === 0) touchesHole = true;
      else if (y > 0 && alphaCopy[idx - w] === 0) touchesHole = true;
      else if (y < h - 1 && alphaCopy[idx + w] === 0) touchesHole = true;
      if (touchesHole) data[idx * 4 + 3] = Math.round(alphaCopy[idx] * 0.5);
    }
  }
}

// Border via canvas dilation: tint the alpha silhouette, stamp it in 8 offset
// directions behind the subject, then draw the subject on top.
function addBorder(subject: HTMLCanvasElement, borderWidth: number, borderColor: string): HTMLCanvasElement {
  if (borderWidth <= 0) return subject;
  const w = subject.width;
  const h = subject.height;
  const pad = Math.round(borderWidth);

  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext("2d");
  if (!mctx) return subject;
  mctx.drawImage(subject, 0, 0);
  mctx.globalCompositeOperation = "source-in";
  mctx.fillStyle = borderColor;
  mctx.fillRect(0, 0, w, h);

  const out = document.createElement("canvas");
  out.width = w + pad * 2;
  out.height = h + pad * 2;
  const ctx = out.getContext("2d");
  if (!ctx) return subject;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dx = Math.round(Math.cos(angle) * pad);
    const dy = Math.round(Math.sin(angle) * pad);
    ctx.drawImage(mask, pad + dx, pad + dy);
  }
  ctx.drawImage(subject, pad, pad);
  return out;
}

export default function StickerMaker() {
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("sticker.png");
  const [tolerance, setTolerance] = useState(32);
  const [borderWidth, setBorderWidth] = useState(8);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [seed, setSeed] = useState<{ x: number; y: number } | null>(null);
  const [seedPct, setSeedPct] = useState<{ x: number; y: number } | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procSize, setProcSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    setSeed(null);
    setSeedPct(null);
    setError(null);
    setFileName(f.name.replace(/\.[^.]+$/, "") + "-sticker.png");
    setImageUrl(URL.createObjectURL(f));
  }, [imageUrl, resultUrl]);

  const process = useCallback(async () => {
    if (!imageUrl || !seed) return;
    setProcessing(true);
    setError(null);
    try {
      const img = await loadImage(imageUrl);
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      setProcSize({ w, h });

      const work = document.createElement("canvas");
      work.width = w;
      work.height = h;
      const wctx = work.getContext("2d", { willReadFrequently: true });
      if (!wctx) throw new Error("Canvas not supported");
      wctx.drawImage(img, 0, 0, w, h);
      const imageData = wctx.getImageData(0, 0, w, h);
      const threshold = (tolerance / 100) * 160;
      floodFillTransparent(imageData, seed.x, seed.y, threshold);
      wctx.putImageData(imageData, 0, 0);

      const finalCanvas = addBorder(work, borderWidth, borderColor);
      const blob: Blob = await new Promise((resolve, reject) =>
        finalCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Render failed"))), "image/png")
      );
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    }
    setProcessing(false);
  }, [imageUrl, seed, tolerance, borderWidth, borderColor, resultUrl]);

  useEffect(() => {
    if (imageUrl && seed) process();
  }, [imageUrl, seed, tolerance, borderWidth, borderColor, process]);

  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const el = imgRef.current;
    if (!el || !el.naturalWidth) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const scale = Math.min(1, MAX_DIM / Math.max(el.naturalWidth, el.naturalHeight));
    const w = Math.max(1, Math.round(el.naturalWidth * scale));
    const h = Math.max(1, Math.round(el.naturalHeight * scale));
    const nx = Math.min(w - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * w)));
    const ny = Math.min(h - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * h)));
    setSeed({ x: nx, y: ny });
    setSeedPct({ x: px, y: py });
  }, []);

  const reset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setImageUrl("");
    setResultUrl("");
    setSeed(null);
    setSeedPct(null);
    setError(null);
  }, [imageUrl, resultUrl]);

  const download = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = fileName;
    a.click();
  }, [resultUrl, fileName]);

  return (
    <ToolLayout
      title="Sticker Maker"
      description="Remove a solid background with one click and add a sticker border."
    >
      {!imageUrl ? (
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop an image here or click to browse" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium mb-1.5">
                {seed ? "Background seed picked — click another pixel to change it" : "Step 1: click a background pixel on the preview"}
              </p>
              <div className="relative inline-block max-w-full">
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Source preview, click background to remove"
                  onClick={handlePreviewClick}
                  className="max-w-full max-h-64 sm:max-h-80 rounded-xl object-contain bg-surface-hover cursor-crosshair"
                />
                {seedPct && (
                  <span
                    className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white bg-accent pointer-events-none"
                    style={{ left: `${seedPct.x}%`, top: `${seedPct.y}%` }}
                  />
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Tolerance: {tolerance}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full h-7 sm:h-5 mt-1"
                />
                <p className="text-[11px] text-text-secondary">Higher values remove more shades around the clicked color.</p>
              </div>
              <div>
                <label className="text-xs font-medium">Border width: {borderWidth}px</label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  className="w-full h-7 sm:h-5 mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" htmlFor="sticker-border-color">Border color</label>
                <input
                  id="sticker-border-color"
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border-soft cursor-pointer bg-surface"
                />
                <span className="text-xs text-text-secondary font-mono">{borderColor}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="secondary" onClick={() => { setSeed(null); setSeedPct(null); setResultUrl(""); }} className="w-full sm:w-auto">
                  <Eraser className="w-4 h-4" /> Clear seed
                </Button>
                <Button variant="ghost" onClick={reset} className="w-full sm:w-auto">
                  <RotateCcw className="w-4 h-4" /> New image
                </Button>
              </div>
            </div>
          </div>

          <ResultPanel
            loading={processing}
            loadingLabel="Removing background..."
            error={error}
            onDownload={resultUrl ? download : undefined}
            downloadLabel="Download transparent PNG"
            onReset={reset}
            resetLabel="Start Over"
          >
            {resultUrl && !processing ? (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Result {procSize.w > 0 ? `(${procSize.w} x ${procSize.h}px + border)` : ""} — transparent PNG, checkerboard shows transparency
                </p>
                <img
                  src={resultUrl}
                  alt="Sticker result with transparent background"
                  className="max-w-full max-h-64 sm:max-h-80 rounded-xl object-contain mx-auto sm:mx-0"
                  style={{
                    backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                  }}
                />
                <div className="sticky bottom-20 md:static flex flex-col sm:flex-row gap-2">
                  <Button onClick={download} className="w-full sm:w-auto">
                    <Wand2 className="w-4 h-4" /> Download transparent PNG
                  </Button>
                </div>
              </div>
            ) : !seed && !processing ? (
              <p className="text-sm text-text-secondary">Click a background pixel above to remove the background and preview your sticker.</p>
            ) : undefined}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
