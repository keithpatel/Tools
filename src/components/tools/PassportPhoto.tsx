"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Download, Eye, EyeOff } from "lucide-react";

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
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);

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
    const scale = Math.max(base.width / image.naturalWidth, base.height / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    ctx.drawImage(image, (base.width - w) / 2, (base.height - h) / 2, w, h);

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
  }, [image, preset, bg, guides]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError("");
    setLoading(true);
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
                onChange={(e) => setPresetId(e.target.value)}
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

          <div>
            <Button
              variant={guides ? "primary" : "outline"}
              size="sm"
              onClick={() => setGuides((v) => !v)}
              className="min-h-[44px] sm:min-h-0"
            >
              {guides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {guides ? "Hide alignment guides" : "Show alignment guides"}
            </Button>
          </div>

          <div className="flex justify-center">
            <div className="relative inline-block rounded-xl overflow-hidden border border-border-soft bg-surface">
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
