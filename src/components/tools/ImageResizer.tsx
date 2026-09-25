"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import JSZip from "jszip";
import { Download, Lock, Unlock, Archive } from "lucide-react";

type SizeMode = "pixels" | "percent";

interface SocialPreset {
  label: string;
  w: number;
  h: number;
}

const SOCIAL_PRESETS: SocialPreset[] = [
  { label: "Instagram Post (1080x1080)", w: 1080, h: 1080 },
  { label: "Instagram Story (1080x1920)", w: 1080, h: 1920 },
  { label: "Facebook Cover (820x312)", w: 820, h: 312 },
  { label: "YouTube Thumbnail (1280x720)", w: 1280, h: 720 },
  { label: "LinkedIn Banner (1584x396)", w: 1584, h: 396 },
  { label: "X Post (1200x675)", w: 1200, h: 675 },
];

interface BatchItem {
  id: string;
  file: File;
  url: string;
  resultUrl: string;
  resultW: number;
  resultH: number;
  error: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageNatural, setImageNatural] = useState({ w: 0, h: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [sizeMode, setSizeMode] = useState<SizeMode>("pixels");
  const [percent, setPercent] = useState(100);
  const [preset, setPreset] = useState("");
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const picked = images.length > 0 ? images : files;
    const f = picked[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setResultUrl("");

    const img = new Image();
    img.onload = () => {
      setImageNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.src = url;

    if (picked.length > 1) {
      setBatch(
        picked.map((bf, i) => ({
          id: `${Date.now()}-${i}-${bf.name}`,
          file: bf,
          url: URL.createObjectURL(bf),
          resultUrl: "",
          resultW: 0,
          resultH: 0,
          error: "",
        }))
      );
    } else {
      setBatch([]);
    }
  }, []);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && imageNatural.h && imageNatural.w) {
      setHeight(Math.round(val * (imageNatural.h / imageNatural.w)));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && imageNatural.w && imageNatural.h) {
      setWidth(Math.round(val * (imageNatural.w / imageNatural.h)));
    }
  };

  const handlePresetChange = (label: string) => {
    setPreset(label);
    const found = SOCIAL_PRESETS.find((p) => p.label === label);
    if (found) {
      setWidth(found.w);
      setHeight(found.h);
    }
  };

  const targetDimsFor = (nw: number, nh: number) => {
    if (sizeMode === "percent") {
      return { w: Math.max(1, Math.round((nw * percent) / 100)), h: Math.max(1, Math.round((nh * percent) / 100)) };
    }
    return { w: Math.max(1, width || nw), h: Math.max(1, height || nh) };
  };

  const resizeToBlob = (img: HTMLImageElement, w: number, h: number, mime: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Resize failed"));
      }, mime);
    });
  };

  const handleResize = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const dims = targetDimsFor(img.naturalWidth, img.naturalHeight);
      const canvas = canvasRef.current!;
      canvas.width = dims.w;
      canvas.height = dims.h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, dims.w, dims.h);
      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
      }, file.type);
    };
    img.src = imageUrl;
  };

  const handleResizeBatch = async () => {
    if (batch.length === 0) return;
    setBatchLoading(true);
    for (const item of batch) {
      try {
        const img = await loadImage(item.url);
        const dims = targetDimsFor(img.naturalWidth, img.naturalHeight);
        const blob = await resizeToBlob(img, dims.w, dims.h, item.file.type);
        const url = URL.createObjectURL(blob);
        setBatch((prev) => prev.map((b) => (b.id === item.id ? { ...b, resultUrl: url, resultW: dims.w, resultH: dims.h, error: "" } : b)));
      } catch {
        setBatch((prev) => prev.map((b) => (b.id === item.id ? { ...b, error: "Failed to resize this file." } : b)));
      }
    }
    setBatchLoading(false);
  };

  const downloadAllAsZip = async () => {
    const done = batch.filter((b) => b.resultUrl);
    if (done.length === 0) return;
    setZipLoading(true);
    try {
      const zip = new JSZip();
      for (const item of done) {
        const res = await fetch(item.resultUrl);
        const buf = await res.arrayBuffer();
        const ext = (item.file.name.split(".").pop() || "png").toLowerCase();
        zip.file(`resized-${item.resultW}x${item.resultH}-${item.file.name.replace(/\.[^.]+$/, "")}.${ext}`, buf);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "resized-images.zip";
      a.click();
      URL.revokeObjectURL(zipUrl);
    } finally {
      setZipLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageUrl("");
    setResultUrl("");
    setBatch([]);
    setPreset("");
  };

  const singleDims = targetDimsFor(imageNatural.w || width, imageNatural.h || height);
  const batchDone = batch.filter((b) => b.resultUrl).length;

  return (
    <ToolLayout
      title="Image Resizer"
      description="Resize images to exact dimensions. Maintains aspect ratio with optional lock."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple enableCamera />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-surface-hover checkerboard" />
          <img ref={imgRef} src={imageUrl} alt="" className="hidden" aria-hidden />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={sizeMode === "pixels" ? "primary" : "outline"}
              size="sm"
              onClick={() => setSizeMode("pixels")}
              className="min-h-[44px] sm:min-h-0"
            >
              Pixels
            </Button>
            <Button
              variant={sizeMode === "percent" ? "primary" : "outline"}
              size="sm"
              onClick={() => setSizeMode("percent")}
              className="min-h-[44px] sm:min-h-0"
            >
              Percent
            </Button>
          </div>

          {sizeMode === "percent" ? (
            <div>
              <label className="text-sm font-medium">Scale: {percent}%</label>
              <input
                type="range"
                min={1}
                max={200}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full mt-1 accent-accent"
              />
              <p className="text-xs text-text-secondary mt-1">
                Output: {singleDims.w}x{singleDims.h}px
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium">Social preset</label>
                <select
                  value={preset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full p-2 border border-border rounded-lg bg-surface text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                >
                  <option value="">Custom size...</option>
                  {SOCIAL_PRESETS.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3">
                <div>
                  <label className="text-xs font-medium">Width (px)</label>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-28 p-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
                <button
                  onClick={() => setLockAspect(!lockAspect)}
                  className="p-2 mb-0.5 rounded-lg hover:bg-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <div>
                  <label className="text-xs font-medium">Height (px)</label>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-28 p-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleResize} variant="primary" size="md" className="sm:w-auto">
              Resize
            </Button>
            <Button onClick={handleReset} variant="secondary" size="md" className="sm:w-auto">
              Reset
            </Button>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {resultUrl && (
            <div>
              <p className="text-xs text-text-secondary mb-1">Result ({singleDims.w}x{singleDims.h})</p>
              <img src={resultUrl} alt="Resized" className="max-h-48 rounded-lg object-contain bg-surface-hover checkerboard mb-2" />
              <a
                href={resultUrl}
                download={`resized-${file.name}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}

          {batch.length > 1 && (
            <div className="space-y-2 border-t border-border-soft pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-sm font-medium">
                  Batch ({batch.length} files{batchDone > 0 ? `, ${batchDone} resized` : ""})
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  <Button variant="secondary" size="sm" onClick={handleResizeBatch} disabled={batchLoading} className="min-h-[44px] sm:min-h-0">
                    {batchLoading ? "Resizing..." : "Resize all"}
                  </Button>
                  {batchDone > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadAllAsZip} disabled={zipLoading} className="min-h-[44px] sm:min-h-0">
                      <Archive className="w-4 h-4" /> {zipLoading ? "Zipping..." : "Download all as ZIP"}
                    </Button>
                  )}
                </div>
              </div>
              {batch.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm p-2 rounded-lg bg-surface-hover"
                >
                  <span className="font-medium truncate flex-1">{item.file.name}</span>
                  <span className="text-xs text-text-secondary">
                    {item.resultUrl ? `${item.resultW}x${item.resultH}px` : "pending"}
                  </span>
                  {item.error && <span className="text-xs text-error-text">{item.error}</span>}
                  {item.resultUrl && (
                    <a
                      href={item.resultUrl}
                      download={`resized-${item.file.name}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-success-text dark:text-success-text min-h-[44px] sm:min-h-0 items-center"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
