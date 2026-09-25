"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Download, RotateCcw, Frame } from "lucide-react";

type FrameStyle = "solid" | "gradient" | "polaroid" | "rounded";

const STYLE_OPTIONS: { value: FrameStyle; label: string }[] = [
  { value: "solid", label: "Solid color" },
  { value: "gradient", label: "Gradient" },
  { value: "polaroid", label: "Polaroid" },
  { value: "rounded", label: "Rounded corners" },
];

interface FrameOpts {
  style: FrameStyle;
  border: number;
  solidColor: string;
  gradA: string;
  gradB: string;
  angle: number;
  caption: string;
  radius: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

function drawFramed(img: HTMLImageElement, opts: FrameOpts): HTMLCanvasElement {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  if (opts.style === "rounded") {
    canvas.width = iw;
    canvas.height = ih;
    const r = Math.max(0, Math.min(opts.radius, Math.min(iw, ih) / 2));
    ctx.clearRect(0, 0, iw, ih);
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, iw, ih, r);
    } else {
      ctx.moveTo(r, 0);
      ctx.arcTo(iw, 0, iw, ih, r);
      ctx.arcTo(iw, ih, 0, ih, r);
      ctx.arcTo(0, ih, 0, 0, r);
      ctx.arcTo(0, 0, iw, 0, r);
      ctx.closePath();
    }
    ctx.clip();
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    return canvas;
  }

  if (opts.style === "polaroid") {
    const side = Math.max(0, opts.border);
    const top = Math.max(0, opts.border);
    const bottom = Math.max(64, Math.round(opts.border * 3.2));
    canvas.width = iw + side * 2;
    canvas.height = ih + top + bottom;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, side, top, iw, ih);
    if (opts.caption.trim()) {
      const fontSize = Math.max(14, Math.min(42, Math.floor(bottom * 0.32)));
      ctx.fillStyle = "#333333";
      ctx.font = `500 ${fontSize}px Georgia, 'Times New Roman', serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const maxWidth = canvas.width - side * 2 - 16;
      let text = opts.caption.trim();
      while (ctx.measureText(text).width > maxWidth && text.length > 4) {
        text = text.slice(0, -2);
      }
      if (ctx.measureText(opts.caption.trim()).width > maxWidth) text += "...";
      ctx.fillText(text, canvas.width / 2, top + ih + bottom / 2);
    }
    return canvas;
  }

  const b = Math.max(0, opts.border);
  canvas.width = iw + b * 2;
  canvas.height = ih + b * 2;
  if (opts.style === "gradient") {
    const rad = ((opts.angle - 90) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const half = Math.abs(cx * dx) + Math.abs(cy * dy);
    const grad = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
    grad.addColorStop(0, opts.gradA);
    grad.addColorStop(1, opts.gradB);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = opts.solidColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, b, b, iw, ih);
  return canvas;
}

export default function BorderFrame() {
  const [imgUrl, setImgUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [style, setStyle] = useState<FrameStyle>("solid");
  const [border, setBorder] = useState(32);
  const [solidColor, setSolidColor] = useState("#6366f1");
  const [gradA, setGradA] = useState("#6366f1");
  const [gradB, setGradB] = useState("#ec4899");
  const [angle, setAngle] = useState(135);
  const [caption, setCaption] = useState("");
  const [radius, setRadius] = useState(48);
  const [previewUrl, setPreviewUrl] = useState("");
  const [outSize, setOutSize] = useState({ w: 0, h: 0 });
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = useCallback((files: File[]) => {
    const f = files.find((x) => x.type.startsWith("image/")) || files[0];
    if (!f) return;
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImgUrl(URL.createObjectURL(f));
    setFileName(f.name.replace(/\.[^.]+$/, "") || "image");
    setPreviewUrl("");
    setError("");
  }, [imgUrl, previewUrl]);

  useEffect(() => {
    if (!imgUrl) return;
    let cancelled = false;
    setRendering(true);
    setError("");
    const opts: FrameOpts = { style, border, solidColor, gradA, gradB, angle, caption, radius };
    loadImage(imgUrl)
      .then((img) => {
        if (cancelled) return;
        const canvas = drawFramed(img, opts);
        canvas.toBlob((blob) => {
          if (cancelled) return;
          if (!blob) {
            setError("Failed to render frame. Try a different image.");
            setRendering(false);
            return;
          }
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          setOutSize({ w: canvas.width, h: canvas.height });
          setRendering(false);
        }, "image/png");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load image. Try a different file.");
          setRendering(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgUrl, style, border, solidColor, gradA, gradB, angle, caption, radius]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${fileName || "framed"}-${style}.png`;
    a.click();
  }, [previewUrl, fileName, style]);

  const reset = useCallback(() => {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImgUrl("");
    setPreviewUrl("");
    setFileName("");
    setCaption("");
    setError("");
  }, [imgUrl, previewUrl]);

  return (
    <ToolLayout title="" description="">
      {!imgUrl ? (
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop an image here or click to browse" enableCamera />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5">Frame style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setStyle(o.value)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 border ${
                    style === o.value
                      ? "bg-accent text-white border-accent"
                      : "bg-surface-hover border-border-soft hover:bg-border"
                  }`}
                >
                  <Frame className="w-3.5 h-3.5" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {(style === "solid" || style === "gradient" || style === "polaroid") && (
            <div>
              <label className="text-sm font-medium block mb-1">
                Border width: <span className="font-mono">{border}px</span>
              </label>
              <input
                type="range"
                min={0}
                max={120}
                value={border}
                onChange={(e) => setBorder(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          )}

          {style === "solid" && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Border color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  className="w-12 h-10 rounded-lg border border-border-soft cursor-pointer bg-surface"
                />
                <span className="text-sm font-mono text-text-secondary">{solidColor}</span>
              </div>
            </div>
          )}

          {style === "gradient" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Start color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={gradA}
                    onChange={(e) => setGradA(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-border-soft cursor-pointer bg-surface"
                  />
                  <span className="text-sm font-mono text-text-secondary">{gradA}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">End color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={gradB}
                    onChange={(e) => setGradB(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-border-soft cursor-pointer bg-surface"
                  />
                  <span className="text-sm font-mono text-text-secondary">{gradB}</span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium block mb-1">
                  Angle: <span className="font-mono">{angle}°</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          )}

          {style === "polaroid" && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                maxLength={80}
                className="w-full px-3 py-2.5 sm:py-2 text-sm rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 min-h-[44px] sm:min-h-0"
              />
            </div>
          )}

          {style === "rounded" && (
            <div>
              <label className="text-sm font-medium block mb-1">
                Corner radius: <span className="font-mono">{radius}px</span>
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <p className="text-xs text-text-secondary mt-1">Corners stay transparent outside the rounded shape.</p>
            </div>
          )}

          <div className="sticky bottom-20 md:static">
            <Button onClick={handleDownload} disabled={!previewUrl || rendering} className="w-full sm:w-auto">
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          </div>
        </div>
      )}

      <ResultPanel
        loading={rendering}
        loadingLabel="Rendering frame..."
        error={error}
        onDownload={previewUrl ? handleDownload : undefined}
        downloadLabel="Download PNG"
        onReset={imgUrl ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="border-frame"
        outputType="image"
      >
        {previewUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Frame className="w-4 h-4 text-accent" />
              Framed preview
              {outSize.w > 0 && (
                <span className="text-xs font-mono text-text-secondary">
                  {outSize.w}×{outSize.h}px
                </span>
              )}
            </div>
            <img
              src={previewUrl}
              alt="Framed preview"
              className="max-w-full max-h-72 rounded-xl object-contain bg-surface-hover mx-auto sm:mx-0"
            />
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Choose a different image
            </button>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
