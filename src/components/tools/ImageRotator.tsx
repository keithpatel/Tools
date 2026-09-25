"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Download, RotateCw, FlipHorizontal, FlipVertical, Archive } from "lucide-react";
import JSZip from "jszip";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function transformToBlob(
  img: HTMLImageElement,
  totalDegrees: number,
  flipH: boolean,
  flipV: boolean,
  mimeType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas not supported"));
      return;
    }
    const rad = (totalDegrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = Math.round(w * cos + h * sin);
    canvas.height = Math.round(w * sin + h * cos);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -w / 2, -h / 2);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas empty"));
    }, mimeType || "image/png");
  });
}

type BatchResult = { name: string; url: string; blob: Blob };

export default function ImageRotator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [rotation, setRotation] = useState(0);
  const [fineRotation, setFineRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const totalDegrees = rotation + fineRotation;
  const showStraightenGrid = isAdjusting || fineRotation !== 0;

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
    setRotation(0);
    setFineRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const handleBatchFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    setBatchFiles(images);
    setBatchResults([]);
  }, []);

  const renderCanvas = () => {
    if (!file || !imgRef.current) return;
    const img = imgRef.current;
    if (!img.naturalWidth) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const rad = (totalDegrees * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = w * cos + h * sin;
    canvas.height = w * sin + h * cos;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -w / 2, -h / 2);

    canvas.toBlob((blob) => {
      if (blob) setResultUrl(URL.createObjectURL(blob));
    }, file.type || "image/png");
  };

  const rotateCW = () => { setRotation((r) => r + 90); setTimeout(renderCanvas, 50); };
  const rotateCCW = () => { setRotation((r) => r - 90); setTimeout(renderCanvas, 50); };
  const toggleFlipH = () => { setFlipH((f) => !f); setTimeout(renderCanvas, 50); };
  const toggleFlipV = () => { setFlipV((f) => !f); setTimeout(renderCanvas, 50); };
  const handleFineChange = (v: number) => {
    setFineRotation(v);
    setTimeout(renderCanvas, 50);
  };

  const applyBatch = async () => {
    if (!batchFiles.length) return;
    setBatchProcessing(true);
    try {
      const out: BatchResult[] = [];
      for (const f of batchFiles) {
        const url = URL.createObjectURL(f);
        try {
          const img = await loadImage(url);
          const blob = await transformToBlob(img, totalDegrees, flipH, flipV, f.type || "image/png");
          out.push({ name: `transformed-${f.name}`, url: URL.createObjectURL(blob), blob });
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      setBatchResults(out);
    } catch (err) {
      console.error(err);
    }
    setBatchProcessing(false);
  };

  const downloadZip = async () => {
    if (!batchResults.length) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const r of batchResults) {
        zip.file(r.name, r.blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rotated-images.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error(err);
    }
    setZipping(false);
  };

  const resetAll = () => {
    setFile(null);
    setImageUrl("");
    setResultUrl("");
    setRotation(0);
    setFineRotation(0);
    setBatchFiles([]);
    setBatchResults([]);
  };

  return (
    <ToolLayout
      title="Image Rotator"
      description="Rotate and flip images using canvas transforms."
    >
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={batchMode ? "primary" : "outline"}
          size="sm"
          onClick={() => setBatchMode((b) => !b)}
          className="min-h-[38px] sm:min-h-0"
        >
          {batchMode ? "Batch mode: On" : "Batch mode: Off"}
        </Button>
      </div>

      {!batchMode && !file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : !batchMode && file ? (
        <div className="space-y-4">
          <div className="relative inline-block">
            <img ref={imgRef} src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" crossOrigin="anonymous" />
            {showStraightenGrid && (
              <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden" aria-hidden="true">
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/90" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/90" />
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/50" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/50" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/50" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/50" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={rotateCW} className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
              <RotateCw className="w-4 h-4" /> Rotate 90° CW
            </button>
            <button onClick={rotateCCW} className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
              <RotateCw className="w-4 h-4 scale-x-[-1]" /> Rotate 90° CCW
            </button>
            <button onClick={toggleFlipH} className={`min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              flipH ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}>
              <FlipHorizontal className="w-4 h-4" /> Flip H
            </button>
            <button onClick={toggleFlipV} className={`min-h-[44px] sm:min-h-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              flipV ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}>
              <FlipVertical className="w-4 h-4" /> Flip V
            </button>
          </div>

          <div>
            <label htmlFor="fine-rotation" className="text-xs font-medium">
              Fine rotation (straighten): {fineRotation.toFixed(1)}° — total {totalDegrees.toFixed(1)}°
            </label>
            <input
              id="fine-rotation"
              type="range"
              min={-45}
              max={45}
              step={0.5}
              value={fineRotation}
              onChange={(e) => handleFineChange(Number(e.target.value))}
              onPointerDown={() => setIsAdjusting(true)}
              onPointerUp={() => setIsAdjusting(false)}
              onBlur={() => setIsAdjusting(false)}
              className="w-full h-7 sm:h-5 mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Composes with 90° steps above. A straighten grid overlay appears on the preview while adjusting.</p>
          </div>

          <button
            onClick={resetAll}
            className="min-h-[44px] sm:min-h-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
          >
            Reset
          </button>

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Result</p>
              <img src={resultUrl} alt="Result" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a
                href={resultUrl}
                download={`transformed-${file.name}`}
                className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <DropZone onFiles={handleBatchFiles} accept="image/*" multiple label="Drop multiple images here or click to browse" />
          {batchFiles.length > 0 && (
            <p className="text-xs text-gray-500">{batchFiles.length} file(s) selected.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={rotateCW} className="min-h-[38px] sm:min-h-0">
              <RotateCw className="w-4 h-4" /> +90°
            </Button>
            <Button variant="secondary" size="sm" onClick={rotateCCW} className="min-h-[38px] sm:min-h-0">
              <RotateCw className="w-4 h-4 scale-x-[-1]" /> -90°
            </Button>
            <Button variant={flipH ? "primary" : "outline"} size="sm" onClick={() => setFlipH((f) => !f)} className="min-h-[38px] sm:min-h-0">
              <FlipHorizontal className="w-4 h-4" /> Flip H
            </Button>
            <Button variant={flipV ? "primary" : "outline"} size="sm" onClick={() => setFlipV((f) => !f)} className="min-h-[38px] sm:min-h-0">
              <FlipVertical className="w-4 h-4" /> Flip V
            </Button>
          </div>

          <div>
            <label htmlFor="batch-fine-rotation" className="text-xs font-medium">
              Fine rotation: {fineRotation.toFixed(1)}° — total {totalDegrees.toFixed(1)}°
            </label>
            <input
              id="batch-fine-rotation"
              type="range"
              min={-45}
              max={45}
              step={0.5}
              value={fineRotation}
              onChange={(e) => setFineRotation(Number(e.target.value))}
              className="w-full h-7 sm:h-5 mt-1"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={applyBatch}
              disabled={batchProcessing || batchFiles.length === 0}
              className="w-full sm:w-auto"
            >
              {batchProcessing ? "Processing..." : `Apply to ${batchFiles.length} file(s)`}
            </Button>
            {batchResults.length > 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={downloadZip}
                disabled={zipping}
                className="w-full sm:w-auto"
              >
                <Archive className="w-4 h-4" /> {zipping ? "Zipping..." : "Download all as ZIP"}
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={resetAll} className="w-full sm:w-auto">
              Reset
            </Button>
          </div>

          {batchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Results ({batchResults.length})</p>
              {batchResults.map((r) => (
                <div key={r.name} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  <img src={r.url} alt={r.name} className="w-20 h-20 rounded object-cover bg-gray-100 dark:bg-gray-800" />
                  <span className="text-xs truncate flex-1">{r.name}</span>
                  <a
                    href={r.url}
                    download={r.name}
                    className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
