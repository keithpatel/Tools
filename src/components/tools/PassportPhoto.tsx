"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { checkFiles } from "@/lib/fileLimits";
import { Download, Eye, EyeOff, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface SizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  note: string;
}

const PRESETS: SizePreset[] = [
  { id: "usa", label: "USA — 2 × 2 in", width: 600, height: 600, note: "600 × 600 px" },
  {
    id: "eu",
    label: "EU / Schengen — 35 × 45 mm",
    width: 413,
    height: 531,
    note: "413 × 531 px (35 × 45 mm @ 300 DPI)",
  },
  {
    id: "uk",
    label: "UK — 35 × 45 mm",
    width: 413,
    height: 531,
    note: "413 × 531 px (35 × 45 mm @ 300 DPI)",
  },
  {
    id: "india",
    label: "India — 51 × 51 mm",
    width: 600,
    height: 600,
    note: "600 × 600 px (51 × 51 mm @ 300 DPI)",
  },
  {
    id: "canada",
    label: "Canada — 50 × 70 mm",
    width: 591,
    height: 827,
    note: "591 × 827 px (50 × 70 mm @ 300 DPI)",
  },
];

const BACKGROUNDS = [
  { id: "white", label: "White", color: "#ffffff" },
  { id: "offwhite", label: "Off-white", color: "#f5f5f5" },
  { id: "blue", label: "Light blue", color: "#e8f0fe" },
  { id: "gray", label: "Light gray", color: "#eeeeee" },
];

export default function PassportPhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [presetId, setPresetId] = useState("usa");
  const [bgId, setBgId] = useState("white");
  const [guides, setGuides] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Pan/zoom framing in output-pixel space. zoom=1 is cover-fit.
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    active: false,
  });

  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const bg = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0];

  useEffect(() => {
    if (!image || !preset || !bg) return;
    const base = baseCanvasRef.current;
    const overlay = guideCanvasRef.current;
    if (!base) return;
    base.width = preset.width;
    base.height = preset.height;
    const ctx = base.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, base.width, base.height);
    const cover = Math.max(base.width / image.naturalWidth, base.height / image.naturalHeight);
    const scale = cover * zoom;
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    // Clamp so the photo always covers the frame; if zoomed out smaller
    // than the frame, center it so the background fill shows as margin.
    const cx = w < base.width ? (base.width - w) / 2 : Math.min(0, Math.max(base.width - w, (base.width - w) / 2 + offset.x));
    const cy = h < base.height ? (base.height - h) / 2 : Math.min(0, Math.max(base.height - h, (base.height - h) / 2 + offset.y));
    ctx.drawImage(image, cx, cy, w, h);

    if (overlay) {
      overlay.width = preset.width;
      overlay.height = preset.height;
      const g = overlay.getContext("2d");
      if (g) {
        g.clearRect(0, 0, overlay.width, overlay.height);
        if (guides) {
          g.strokeStyle = "rgba(239, 68, 68, 0.9)";
          g.lineWidth = Math.max(2, preset.width / 200);
          g.setLineDash([10, 8]);
          g.beginPath();
          g.moveTo(preset.width / 2, 0);
          g.lineTo(preset.width / 2, preset.height);
          g.moveTo(0, preset.height / 2);
          g.lineTo(preset.width, preset.height / 2);
          g.stroke();
          g.beginPath();
          g.ellipse(
            preset.width / 2,
            preset.height * 0.42,
            preset.width * 0.19,
            preset.height * 0.24,
            0,
            0,
            Math.PI * 2
          );
          g.stroke();
          g.setLineDash([]);
        }
      }
    }
  }, [image, preset, bg, guides, zoom, offset]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    const limitError = checkFiles([f]);
    if (limitError) {
      setError(limitError);
      return;
    }
    setFile(f);
    setError("");
    setLoading(true);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setLoading(false);
    };
    img.onerror = () => {
      setError("Could not read that photo. Please try a different file.");
      setLoading(false);
    };
    img.src = url;
  }, []);

  const resetFraming = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Drag-to-pan on the preview. Converts CSS pixels to canvas pixels.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!image) return;
      const canvas = baseCanvasRef.current;
      if (!canvas) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y, active: true };
    },
    [image, offset]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const canvas = baseCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const kx = canvas.width / rect.width;
    const ky = canvas.height / rect.height;
    setOffset({
      x: d.origX + (e.clientX - d.startX) * kx,
      y: d.origY + (e.clientY - d.startY) * ky,
    });
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const handleDownload = () => {
    const base = baseCanvasRef.current;
    if (!base) return;
    base.toBlob((blob) => {
      if (!blob) {
        setError("Export failed. Please try again.");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `passport-photo-${presetId}.jpg`;
      a.click();
    }, "image/jpeg", 0.92);
  };

  const reset = () => {
    setFile(null);
    setImage(null);
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          label="Drop your photo here or click to browse"
          enableCamera
        />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="size-preset" className="text-sm font-medium">
                Country / size
              </label>
              <select
                id="size-preset"
                value={presetId}
                onChange={(e) => {
                  setPresetId(e.target.value);
                  setOffset({ x: 0, y: 0 });
                }}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bg-fill" className="text-sm font-medium">
                Background fill
              </label>
              <select
                id="bg-fill"
                value={bgId}
                onChange={(e) => setBgId(e.target.value)}
                className="mt-1 w-full min-h-[44px] rounded-xl border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary"
              >
                {BACKGROUNDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} ({b.color})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={guides ? "primary" : "outline"}
              size="sm"
              onClick={() => setGuides((v) => !v)}
              className="min-h-[44px] sm:min-h-0"
            >
              {guides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {guides ? "Hide alignment guides" : "Show alignment guides"}
            </Button>
            <Button variant="outline" size="sm" onClick={resetFraming} className="min-h-[44px] sm:min-h-0">
              <RotateCcw className="w-4 h-4" />
              Reset framing
            </Button>
          </div>

          <div className="rounded-[18px] border border-border-soft bg-surface p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Move className="w-4 h-4 text-accent" aria-hidden="true" />
              Adjust framing
              <span className="ml-auto text-xs font-normal text-text-secondary">{Math.round(zoom * 100)}%</span>
            </div>
            <p className="text-xs text-text-secondary">Drag the photo to move it. Zoom out to fit your whole head inside the oval guide.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
                aria-label="Zoom out"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-border-soft hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={0.3}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
                className="flex-1 accent-accent min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                aria-label="Zoom in"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-border-soft hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              ref={frameRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={endDrag}
              className="relative inline-block rounded-xl overflow-hidden border border-border-soft bg-surface touch-none select-none cursor-move"
            >
              <canvas
                ref={baseCanvasRef}
                className="block w-auto max-w-full max-h-[420px] sm:max-h-[520px]"
              />
              <canvas
                ref={guideCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>
          </div>

          <div className="text-xs sm:text-sm text-text-secondary leading-relaxed space-y-1">
            <p>
              Output: {preset?.note}. Sized for printing at 300 DPI — use glossy photo paper for
              best results.
            </p>
            <p>Guides are alignment helpers only and are never included in the download.</p>
          </div>
        </div>
      )}

      <ResultPanel
        loading={loading}
        loadingLabel="Loading photo…"
        error={error}
        onReset={file && !loading ? reset : undefined}
        resetLabel="Start Over"
      >
        {image && !loading && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              {preset?.label} — {preset?.note}
            </p>
            <div className="sticky bottom-20 md:static">
              <Button onClick={handleDownload} className="w-full sm:w-auto min-h-[44px]">
                <Download className="w-4 h-4" />
                Download JPG
              </Button>
            </div>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
