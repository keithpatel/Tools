"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { ArrowUp, ArrowDown, X, Play, Download, Images } from "lucide-react";

interface FrameItem {
  id: string;
  url: string;
  name: string;
  delay: number;
}

const WIDTH_OPTIONS = [
  { value: "320", label: "320px" },
  { value: "480", label: "480px" },
  { value: "640", label: "640px" },
  { value: "original", label: "Original" },
];

const DEFAULT_DELAY = 500;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load an image."));
    img.src = src;
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageToGIF() {
  const [frames, setFrames] = useState<FrameItem[]>([]);
  const [globalDelay, setGlobalDelay] = useState(DEFAULT_DELAY);
  const [loop, setLoop] = useState(true);
  const [widthCap, setWidthCap] = useState("480");
  const [encoding, setEncoding] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [resultDims, setResultDims] = useState({ w: 0, h: 0 });
  const idRef = useRef(0);

  const handleFiles = useCallback((files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) {
      setError("Please upload image files (PNG, JPG, WebP, ...).");
      return;
    }
    setError("");
    setResultUrl("");
    setFrames((prev) => [
      ...prev,
      ...imgs.map((f) => ({
        id: `frame-${Date.now()}-${idRef.current++}`,
        url: URL.createObjectURL(f),
        name: f.name,
        delay: DEFAULT_DELAY,
      })),
    ]);
  }, []);

  const moveFrame = useCallback((index: number, dir: -1 | 1) => {
    setFrames((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
    setResultUrl("");
  }, []);

  const removeFrame = useCallback((index: number) => {
    setFrames((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
    setResultUrl("");
  }, []);

  const setFrameDelay = useCallback((index: number, delay: number) => {
    const clamped = Math.max(20, Math.min(10000, Math.round(delay) || DEFAULT_DELAY));
    setFrames((prev) => prev.map((f, i) => (i === index ? { ...f, delay: clamped } : f)));
    setResultUrl("");
  }, []);

  const applyToAll = useCallback(() => {
    const clamped = Math.max(20, Math.min(10000, Math.round(globalDelay) || DEFAULT_DELAY));
    setGlobalDelay(clamped);
    setFrames((prev) => prev.map((f) => ({ ...f, delay: clamped })));
    setResultUrl("");
  }, [globalDelay]);

  const handleEncode = useCallback(async () => {
    if (frames.length === 0 || encoding) return;
    setEncoding(true);
    setError("");
    setResultUrl("");
    setProgress({ current: 0, total: frames.length });
    try {
      // @ts-ignore - gifenc ships without TypeScript types
      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
      const loaded = await Promise.all(frames.map((f) => loadImage(f.url)));
      const cap = widthCap === "original" ? Number.POSITIVE_INFINITY : Number(widthCap);
      const scaled = loaded.map((img) => {
        const scale = img.naturalWidth > cap ? cap / img.naturalWidth : 1;
        return {
          img,
          w: Math.max(1, Math.round(img.naturalWidth * scale)),
          h: Math.max(1, Math.round(img.naturalHeight * scale)),
        };
      });
      const W = Math.max(...scaled.map((s) => s.w));
      const H = Math.max(...scaled.map((s) => s.h));
      const gif = GIFEncoder({ auto: false });
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      for (let i = 0; i < scaled.length; i++) {
        const { img, w, h } = scaled[i];
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        const dx = Math.round((W - w) / 2);
        const dy = Math.round((H - h) / 2);
        ctx.drawImage(img, dx, dy, w, h);
        const imageData = ctx.getImageData(0, 0, W, H);
        const rgba = new Uint8ClampedArray(imageData.data);
        const palette = quantize(rgba, 256);
        const index = applyPalette(rgba, palette);
        gif.writeFrame(index, W, H, {
          palette,
          delay: frames[i].delay,
          first: i === 0,
          repeat: i === 0 ? (loop ? 0 : -1) : undefined,
        });
        setProgress({ current: i + 1, total: scaled.length });
        await new Promise((r) => setTimeout(r, 0));
      }
      gif.finish();
      const bytes = gif.bytes() as Uint8Array;
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "image/gif" });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setResultDims({ w: W, h: H });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to encode GIF. Try fewer or smaller images.");
    } finally {
      setEncoding(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, encoding, widthCap, loop]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "animation.gif";
    a.click();
  }, [resultUrl]);

  const reset = useCallback(() => {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFrames([]);
    setResultUrl("");
    setResultSize(0);
    setError("");
    setProgress({ current: 0, total: 0 });
  }, [frames, resultUrl]);

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <ToolLayout title="" description="">
      {frames.length === 0 ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple label="Drop images here or click to browse" enableCamera />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <p className="text-sm font-medium flex items-center gap-2">
            <Images className="w-4 h-4 text-accent" />
            {frames.length} frame{frames.length !== 1 ? "s" : ""}
          </p>

          <ul className="space-y-2">
            {frames.map((f, i) => (
              <li
                key={f.id}
                className="flex items-center gap-2 sm:gap-3 bg-surface rounded-2xl border border-border-soft p-2 sm:p-3"
              >
                <img src={f.url} alt={f.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 bg-surface-hover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{f.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <label className="text-[11px] text-text-secondary shrink-0">Delay</label>
                    <input
                      type="number"
                      min={20}
                      max={10000}
                      step={10}
                      value={f.delay}
                      onChange={(e) => setFrameDelay(i, Number(e.target.value))}
                      className="w-20 px-2 py-1.5 text-xs font-mono rounded-lg border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[36px]"
                    />
                    <span className="text-[11px] text-text-secondary">ms</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveFrame(i, -1)}
                    disabled={i === 0}
                    aria-label="Move frame up"
                    className="p-2 rounded-lg hover:bg-surface-hover disabled:opacity-30 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFrame(i, 1)}
                    disabled={i === frames.length - 1}
                    aria-label="Move frame down"
                    className="p-2 rounded-lg hover:bg-surface-hover disabled:opacity-30 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFrame(i)}
                    aria-label="Remove frame"
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <DropZone onFiles={handleFiles} accept="image/*" multiple label="Drop more images here to append" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Default delay (ms)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={20}
                  max={10000}
                  step={10}
                  value={globalDelay}
                  onChange={(e) => setGlobalDelay(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 sm:py-2 text-sm font-mono rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[44px] sm:min-h-0"
                />
                <Button variant="secondary" onClick={applyToAll}>
                  Apply to all
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Frame width</label>
              <select
                value={widthCap}
                onChange={(e) => setWidthCap(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[44px] sm:min-h-0"
              >
                {WIDTH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Loop animation</p>
              <p className="text-xs text-text-secondary">Repeat forever when played</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={loop}
              onClick={() => {
                setLoop(!loop);
                setResultUrl("");
              }}
              className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${loop ? "bg-accent" : "bg-border"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${loop ? "translate-x-[18px]" : "translate-x-[2px]"}`}
              />
            </button>
          </div>

          {encoding && (
            <div className="bg-surface rounded-2xl border border-border-soft p-4">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                <span>
                  Encoding frame {progress.current} of {progress.total} ({pct}%)
                </span>
                <span className="font-mono">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="w-full bg-border-soft rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-200" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <div className="sticky bottom-20 md:static">
            <Button onClick={handleEncode} disabled={encoding || frames.length === 0} className="w-full sm:w-auto">
              <Play className="w-4 h-4" />
              {encoding ? `Encoding... ${pct}%` : "Encode GIF"}
            </Button>
          </div>
        </div>
      )}

      <ResultPanel
        loading={encoding}
        loadingLabel={`Encoding GIF... ${pct}%`}
        error={error}
        onDownload={resultUrl ? handleDownload : undefined}
        downloadLabel="Download GIF"
        onReset={frames.length > 0 ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="image-to-gif"
        outputType="image"
      >
        {resultUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4 text-accent" />
              animation.gif
              <span className="text-xs font-mono text-text-secondary">
                {resultDims.w}×{resultDims.h}px · {formatSize(resultSize)}
              </span>
            </p>
            <img src={resultUrl} alt="GIF result" className="max-w-full max-h-72 rounded-xl object-contain bg-surface-hover mx-auto sm:mx-0" />
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
