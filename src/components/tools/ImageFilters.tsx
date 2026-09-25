"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { SlidersHorizontal, Download, RotateCcw } from "lucide-react";

interface FilterValues {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  blur: number;
}

const DEFAULTS: FilterValues = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
};

const PRESETS: { name: string; values: FilterValues; duotone: boolean }[] = [
  { name: "None", values: DEFAULTS, duotone: false },
  {
    name: "Vintage",
    values: { ...DEFAULTS, sepia: 60, contrast: 110, brightness: 95 },
    duotone: false,
  },
  { name: "Duotone", values: { ...DEFAULTS, grayscale: 100 }, duotone: true },
  {
    name: "B&W",
    values: { ...DEFAULTS, grayscale: 100, contrast: 120 },
    duotone: false,
  },
  {
    name: "Warm",
    values: { ...DEFAULTS, saturate: 130, sepia: 25 },
    duotone: false,
  },
];

const SLIDERS: { key: keyof FilterValues; label: string; min: number; max: number; unit: string }[] = [
  { key: "brightness", label: "Brightness", min: 0, max: 200, unit: "%" },
  { key: "contrast", label: "Contrast", min: 0, max: 200, unit: "%" },
  { key: "saturate", label: "Saturation", min: 0, max: 200, unit: "%" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, unit: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, unit: "%" },
  { key: "blur", label: "Blur", min: 0, max: 10, unit: "px" },
];

const MAX_DIM = 1600;

function filterString(f: FilterValues): string {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) grayscale(${f.grayscale}%) sepia(${f.sepia}%) blur(${f.blur}px)`;
}

export default function ImageFilters() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [filters, setFilters] = useState<FilterValues>(DEFAULTS);
  const [preset, setPreset] = useState("None");
  const [duotone, setDuotone] = useState(false);
  const [compare, setCompare] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const origCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawFiltered = useCallback((img: HTMLImageElement, f: FilterValues, duo: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = filterString(f);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    if (duo) {
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }
  }, []);

  const drawOriginal = useCallback((img: HTMLImageElement) => {
    const canvas = origCanvasRef.current;
    if (!canvas) return;
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (image) drawOriginal(image);
  }, [image, drawOriginal]);

  useEffect(() => {
    if (image) drawFiltered(image, filters, duotone);
  }, [image, filters, duotone, drawFiltered]);

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
      setFilters(DEFAULTS);
      setPreset("None");
      setDuotone(false);
      setCompare(50);
      setLoading(false);
    };
    img.onerror = () => {
      setError("Could not read that image. Please try a different file.");
      setLoading(false);
    };
    img.src = url;
  }, []);

  const applyPreset = (name: string) => {
    const p = PRESETS.find((item) => item.name === name);
    if (!p) return;
    setFilters({ ...p.values });
    setDuotone(p.duotone);
    setPreset(p.name);
  };

  const updateSlider = (key: keyof FilterValues, value: number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPreset("Custom");
  };

  const resetFilters = () => {
    setFilters(DEFAULTS);
    setDuotone(false);
    setPreset("None");
  };

  const handleDownload = (format: "png" | "jpeg") => {
    const src = canvasRef.current;
    if (!src) return;
    const save = (blob: Blob | null) => {
      if (!blob) {
        setError("Export failed. Please try again.");
        return;
      }
      const base = file?.name.replace(/\.[^/.]+$/, "") || "image";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `filtered-${base}.${format === "png" ? "png" : "jpg"}`;
      a.click();
    };
    if (format === "png") {
      src.toBlob(save, "image/png");
    } else {
      const flat = document.createElement("canvas");
      flat.width = src.width;
      flat.height = src.height;
      const ctx = flat.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, flat.width, flat.height);
      ctx.drawImage(src, 0, 0);
      flat.toBlob(save, "image/jpeg", 0.92);
    }
  };

  const reset = () => {
    setFile(null);
    setImage(null);
    setFilters(DEFAULTS);
    setPreset("None");
    setDuotone(false);
    setCompare(50);
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          label="Drop an image here or click to browse"
          enableCamera
        />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="relative overflow-hidden rounded-xl border border-border-soft">
            <canvas ref={canvasRef} className="block w-full h-auto" />
            <canvas
              ref={origCanvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ clipPath: `inset(0 ${100 - compare}% 0 0)` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
              style={{ left: `${compare}%` }}
            />
            <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-1 rounded-md bg-black/60 text-white pointer-events-none">
              Before
            </span>
            <span className="absolute top-2 right-2 text-[11px] font-medium px-2 py-1 rounded-md bg-black/60 text-white pointer-events-none">
              After
            </span>
          </div>

          <div>
            <label htmlFor="compare-slider" className="text-sm font-medium">
              Before / after comparison
            </label>
            <input
              id="compare-slider"
              type="range"
              min={0}
              max={100}
              value={compare}
              onChange={(e) => setCompare(Number(e.target.value))}
              className="w-full mt-1 accent-accent"
            />
          </div>

          <div>
            <p className="flex items-center gap-2 text-sm font-medium mb-2">
              <SlidersHorizontal className="w-4 h-4" />
              Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.name}
                  variant={preset === p.name ? "primary" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(p.name)}
                  className="min-h-[44px] sm:min-h-0"
                >
                  {p.name}
                </Button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={resetFilters}
                className="min-h-[44px] sm:min-h-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {SLIDERS.map((s) => (
              <div key={s.key}>
                <label htmlFor={`slider-${s.key}`} className="text-sm font-medium">
                  {s.label}: {filters[s.key]}
                  {s.unit}
                </label>
                <input
                  id={`slider-${s.key}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  value={filters[s.key]}
                  onChange={(e) => updateSlider(s.key, Number(e.target.value))}
                  className="w-full mt-1 accent-accent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <ResultPanel
        loading={loading}
        loadingLabel="Loading image…"
        error={error}
        onReset={file && !loading ? reset : undefined}
        resetLabel="Start Over"
      >
        {image && !loading && (
          <div className="sticky bottom-20 md:static flex flex-col sm:flex-row gap-2">
            <Button onClick={() => handleDownload("png")} className="w-full sm:w-auto min-h-[44px]">
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleDownload("jpeg")}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              Download JPG
            </Button>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
