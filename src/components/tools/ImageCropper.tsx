"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Download, Circle, Grid } from "lucide-react";

let Cropper: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Cropper = require("react-easy-crop").default;
} catch {
  // react-easy-crop not available
}

const ASPECTS = [
  { label: "Free", value: NaN },
  { label: "1:1", value: 1 / 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "Passport 2x2in", value: 1 / 1 },
  { label: "ID 35x45mm", value: 35 / 45 },
];

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getCroppedImg(
  imageSrc: string,
  crop: { x: number; y: number },
  zoom: number,
  aspect: number,
  croppedAreaPixels: { x: number; y: number; width: number; height: number } | null,
  circular: boolean
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await createImage(imageSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const outputWidth = 600;
      const outputHeight = circular ? 600 : Math.round(outputWidth / aspect);

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      if (croppedAreaPixels) {
        // Accurate path: use pixel crop rect reported by react-easy-crop
        const { x, y, width, height } = croppedAreaPixels;
        if (circular) {
          const size = Math.min(width, height);
          const sx = x + (width - size) / 2;
          const sy = y + (height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, outputWidth, outputHeight);
        } else {
          ctx.drawImage(img, x, y, width, height, 0, 0, outputWidth, outputHeight);
        }
      } else {
        // Fallback: legacy zoom-based estimate (preserves old behavior)
        const cropWidth = img.naturalWidth / zoom;
        const cropHeight = cropWidth / aspect;
        const cropX = (crop.x / 100) * img.naturalWidth + (img.naturalWidth - cropWidth) / 2;
        const cropY = (crop.y / 100) * img.naturalHeight + (img.naturalHeight - cropHeight) / 2;
        if (circular) {
          const size = Math.min(cropWidth, cropHeight);
          ctx.drawImage(img, cropX, cropY, size, size, 0, 0, outputWidth, outputHeight);
        } else {
          ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        }
      }

      if (circular) {
        // Circular mask: keep circle, transparent outside, export PNG
        ctx.globalCompositeOperation = "destination-in";
        ctx.beginPath();
        ctx.arc(outputWidth / 2, outputHeight / 2, outputWidth / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas empty"))), "image/png");
    } catch (err) {
      reject(err);
    }
  });
}

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(NaN);
  const [aspectLabel, setAspectLabel] = useState("Free");
  const [resultUrl, setResultUrl] = useState("");
  const [cropping, setCropping] = useState(false);
  const [circular, setCircular] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const croppedPixelsRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    croppedPixelsRef.current = null;
  }, []);

  const handleCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    croppedPixelsRef.current = croppedAreaPixels ?? null;
  }, []);

  const handlePresetSelect = (label: string) => {
    const found = ASPECTS.find((a) => a.label === label);
    if (!found) return;
    setAspect(found.value);
    setAspectLabel(found.label);
  };

  const handleCropImage = async () => {
    if (!file) return;
    setCropping(true);
    try {
      const a = isNaN(aspect) ? 1 : aspect;
      const blob = await getCroppedImg(imageUrl, crop, zoom, a, croppedPixelsRef.current, circular);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    }
    setCropping(false);
  };

  const currentAspect = isNaN(aspect) ? undefined : aspect;

  return (
    <ToolLayout
      title="Image Cropper"
      description="Crop images to your desired aspect ratio. Supports freeform, square, and standard ratios."
      faq={[
        { q: "Is react-easy-crop available?", a: Cropper ? "Yes, it is installed and loaded." : "No, the library could not be loaded. A fallback is used." },
      ]}
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-64 sm:h-80 bg-surface-hover checkerboard rounded-lg overflow-hidden touch-none">
            {Cropper ? (
              <>
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={circular ? 1 : currentAspect}
                  cropShape={circular ? "round" : "rect"}
                  showGrid={showGrid}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute inset-y-0 left-1/3 w-px bg-surface/80" />
                    <div className="absolute inset-y-0 left-2/3 w-px bg-surface/80" />
                    <div className="absolute inset-x-0 top-1/3 h-px bg-surface/80" />
                    <div className="absolute inset-x-0 top-2/3 h-px bg-surface/80" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-text-secondary">
                react-easy-crop not available. Using simplified view.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="aspect-preset" className="text-xs font-medium whitespace-nowrap">
              Aspect preset:
            </label>
            <select
              id="aspect-preset"
              value={aspectLabel}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium bg-surface-hover min-h-[38px] sm:min-h-0 focus:outline-none"
            >
              {ASPECTS.map((a) => (
                <option key={a.label} value={a.label}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium self-center mr-1 w-full sm:w-auto">Aspect:</span>
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                onClick={() => { setAspect(a.value); setAspectLabel(a.label); }}
                className={`px-3 py-2 sm:py-1 rounded-lg text-xs font-medium transition-colors min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                  aspectLabel === a.label
                    ? "bg-accent text-white"
                    : "bg-surface-hover hover:bg-border"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={circular ? "primary" : "outline"}
              size="sm"
              onClick={() => setCircular((c) => !c)}
              className="min-h-[38px] sm:min-h-0"
            >
              <Circle className="w-4 h-4" /> {circular ? "Circular: On" : "Circular: Off"}
            </Button>
            <Button
              variant={showGrid ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowGrid((g) => !g)}
              className="min-h-[38px] sm:min-h-0"
            >
              <Grid className="w-4 h-4" /> {showGrid ? "Grid: On" : "Grid: Off"}
            </Button>
          </div>

          <div>
            <label className="text-xs font-medium">Zoom: {zoom.toFixed(1)}x</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-7 sm:h-5 mt-1"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleCropImage}
              disabled={cropping}
              className="w-full sm:w-auto"
            >
              {cropping ? "Cropping..." : "Crop"}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); }}
              className="w-full sm:w-auto"
            >
              Reset
            </Button>
          </div>

          {resultUrl && (
            <div>
              <p className="text-xs text-text-secondary mb-1">Cropped Result</p>
              <img
                src={resultUrl}
                alt="Cropped"
                className={`max-w-full max-h-56 sm:max-h-48 object-contain bg-surface-hover checkerboard mb-3 mx-auto sm:mx-0 ${circular ? "rounded-full aspect-square" : "rounded-lg"}`}
              />
              <a
                href={resultUrl}
                download={`cropped-${file.name}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-base sm:text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}

          {/* Mobile sticky action bar */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border-t border-border-soft dark:border-border-soft z-50 flex gap-2"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            {resultUrl ? (
              <a
                href={resultUrl}
                download={`cropped-${file.name}`}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl font-medium text-base active:bg-brand-700 transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" /> Download
              </a>
            ) : (
              <button
                onClick={handleCropImage}
                disabled={cropping}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-accent text-white rounded-xl font-medium text-base active:opacity-90 disabled:opacity-50 transition-colors shadow-lg"
              >
                {cropping ? "Cropping..." : "Crop Image"}
              </button>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
