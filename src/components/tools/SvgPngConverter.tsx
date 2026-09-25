"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Download, ArrowLeftRight, Image as ImageIcon, Shapes, FileCode } from "lucide-react";

type Mode = "svg2png" | "png2svg";
type Preset = "poster" | "detailed" | "grayscale";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "poster", label: "Poster (8 colors)" },
  { value: "detailed", label: "Detailed (32 colors)" },
  { value: "grayscale", label: "Grayscale (8 shades)" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image."));
    img.src = src;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(file);
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function SvgPngConverter() {
  const [mode, setMode] = useState<Mode>("svg2png");

  // SVG -> PNG state
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgFileUrl, setSvgFileUrl] = useState("");
  const [pngWidth, setPngWidth] = useState(1024);
  const [pngUrl, setPngUrl] = useState("");
  const [pngDims, setPngDims] = useState({ w: 0, h: 0 });
  const [rasterizing, setRasterizing] = useState(false);
  const [rasterError, setRasterError] = useState("");

  // PNG/JPG -> SVG state
  const [rasterFile, setRasterFile] = useState<File | null>(null);
  const [rasterUrl, setRasterUrl] = useState("");
  const [preset, setPreset] = useState<Preset>("poster");
  const [tracing, setTracing] = useState(false);
  const [traceError, setTraceError] = useState("");
  const [svgString, setSvgString] = useState("");
  const [svgUrl, setSvgUrl] = useState("");
  const [traceFailed, setTraceFailed] = useState(false);

  const handleSvgFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (svgFileUrl) URL.revokeObjectURL(svgFileUrl);
    if (pngUrl) URL.revokeObjectURL(pngUrl);
    setSvgFile(f);
    setSvgFileUrl(URL.createObjectURL(f));
    setPngUrl("");
    setRasterError("");
  }, [svgFileUrl, pngUrl]);

  const handleRasterize = useCallback(async () => {
    if (!svgFile || rasterizing) return;
    setRasterizing(true);
    setRasterError("");
    try {
      const width = Math.max(16, Math.min(8192, Math.round(pngWidth) || 1024));
      const text = await svgFile.text();
      const blob = new Blob([text], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      try {
        const img = await loadImage(url);
        const natW = img.naturalWidth || width;
        const natH = img.naturalHeight || width;
        const h = Math.max(1, Math.round((natH * width) / natW));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is not supported in this browser.");
        ctx.clearRect(0, 0, width, h);
        ctx.drawImage(img, 0, 0, width, h);
        const out: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!out) throw new Error("Failed to rasterize SVG.");
        if (pngUrl) URL.revokeObjectURL(pngUrl);
        setPngUrl(URL.createObjectURL(out));
        setPngDims({ w: width, h });
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setRasterError(e instanceof Error ? e.message : "Failed to convert SVG to PNG.");
    } finally {
      setRasterizing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgFile, rasterizing, pngWidth]);

  const downloadPng = useCallback(() => {
    if (!pngUrl) return;
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${svgFile?.name.replace(/\.svg$/i, "") || "converted"}.png`;
    a.click();
  }, [pngUrl, svgFile]);

  const handleRasterFiles = useCallback((files: File[]) => {
    const f = files.find((x) => x.type.startsWith("image/")) || files[0];
    if (!f) return;
    if (rasterUrl) URL.revokeObjectURL(rasterUrl);
    if (svgUrl) URL.revokeObjectURL(svgUrl);
    setRasterFile(f);
    setRasterUrl(URL.createObjectURL(f));
    setSvgString("");
    setSvgUrl("");
    setTraceError("");
    setTraceFailed(false);
  }, [rasterUrl, svgUrl]);

  const handleTrace = useCallback(async () => {
    if (!rasterFile || tracing) return;
    setTracing(true);
    setTraceError("");
    setTraceFailed(false);
    try {
      const objUrl = URL.createObjectURL(rasterFile);
      try {
        const img = await loadImage(objUrl);
        const maxDim = 768;
        const scale = Math.max(img.naturalWidth, img.naturalHeight) > maxDim
          ? maxDim / Math.max(img.naturalWidth, img.naturalHeight)
          : 1;
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is not supported in this browser.");
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        if (preset === "grayscale") {
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
            d[i] = g;
            d[i + 1] = g;
            d[i + 2] = g;
          }
        }
        const options =
          preset === "detailed"
            ? { numberofcolors: 32, colorquantcycles: 3, pathomit: 0 }
            : preset === "grayscale"
              ? { numberofcolors: 8, colorquantcycles: 2 }
              : { numberofcolors: 8, colorquantcycles: 3 };
        // @ts-ignore - imagetracerjs ships without TypeScript types
        const mod = await import("imagetracerjs");
        const tracer = mod.default ?? mod;
        if (!tracer || typeof tracer.imagedataToSVG !== "function") {
          throw new Error("Vectorizer library failed to load.");
        }
        const svg = tracer.imagedataToSVG(imageData, options) as string;
        if (typeof svg !== "string" || !svg.includes("<svg")) {
          throw new Error("Vectorizer returned an invalid result.");
        }
        const blob = new Blob([svg], { type: "image/svg+xml" });
        if (svgUrl) URL.revokeObjectURL(svgUrl);
        setSvgString(svg);
        setSvgUrl(URL.createObjectURL(blob));
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    } catch (e) {
      setTraceFailed(true);
      setTraceError(
        e instanceof Error
          ? `${e.message} You can still use "Embed as SVG" below, which always works.`
          : "Vectorizing failed. You can still use \"Embed as SVG\" below, which always works."
      );
    } finally {
      setTracing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rasterFile, tracing, preset]);

  const downloadSvg = useCallback(() => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rasterFile?.name.replace(/\.[^.]+$/, "") || "vector"}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [svgString, rasterFile]);

  const downloadEmbeddedSvg = useCallback(async () => {
    if (!rasterFile) return;
    setTraceError("");
    try {
      const dataUrl = await readAsDataUrl(rasterFile);
      const img = await loadImage(dataUrl);
      const w = img.naturalWidth || 300;
      const h = img.naturalHeight || 150;
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
        `<image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}" /></svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rasterFile.name.replace(/\.[^.]+$/, "") || "image"}-embedded.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setTraceError("Embedded SVG export failed. Try a different image.");
    }
  }, [rasterFile]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
  }, []);

  return (
    <ToolLayout title="" description="">
      <div className="grid grid-cols-2 gap-2 mb-4 sm:mb-5">
        <button
          type="button"
          onClick={() => switchMode("svg2png")}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 border ${
            mode === "svg2png" ? "bg-accent text-white border-accent" : "bg-surface-hover border-border-soft hover:bg-border"
          }`}
        >
          <ImageIcon className="w-4 h-4" /> SVG to PNG
        </button>
        <button
          type="button"
          onClick={() => switchMode("png2svg")}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 border ${
            mode === "png2svg" ? "bg-accent text-white border-accent" : "bg-surface-hover border-border-soft hover:bg-border"
          }`}
        >
          <Shapes className="w-4 h-4" /> PNG to SVG
        </button>
      </div>

      {mode === "svg2png" ? (
        <div className="space-y-4">
          {!svgFile ? (
            <DropZone onFiles={handleSvgFiles} accept=".svg,image/svg+xml" label="Drop an .svg file here or click to browse" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-surface rounded-2xl border border-border-soft p-3">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <FileCode className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{svgFile.name}</p>
                  <p className="text-xs text-text-secondary">Vector source loaded</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (svgFileUrl) URL.revokeObjectURL(svgFileUrl);
                    if (pngUrl) URL.revokeObjectURL(pngUrl);
                    setSvgFile(null);
                    setSvgFileUrl("");
                    setPngUrl("");
                    setRasterError("");
                  }}
                >
                  Change
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Output width (px)</label>
                <input
                  type="number"
                  min={16}
                  max={8192}
                  value={pngWidth}
                  onChange={(e) => setPngWidth(Number(e.target.value))}
                  className="w-full sm:max-w-[240px] px-3 py-2.5 sm:py-2 text-sm font-mono rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[44px] sm:min-h-0"
                />
                <p className="text-xs text-text-secondary mt-1">Height scales automatically to keep proportions.</p>
              </div>
              <div className="sticky bottom-20 md:static">
                <Button onClick={handleRasterize} disabled={rasterizing} className="w-full sm:w-auto">
                  <ArrowLeftRight className="w-4 h-4" />
                  {rasterizing ? "Converting..." : "Convert to PNG"}
                </Button>
              </div>
            </div>
          )}
          <ResultPanel
            loading={rasterizing}
            loadingLabel="Converting SVG to PNG..."
            error={rasterError}
            onDownload={pngUrl ? downloadPng : undefined}
            downloadLabel="Download PNG"
            onReset={
              svgFile
                ? () => {
                    if (svgFileUrl) URL.revokeObjectURL(svgFileUrl);
                    if (pngUrl) URL.revokeObjectURL(pngUrl);
                    setSvgFile(null);
                    setSvgFileUrl("");
                    setPngUrl("");
                    setRasterError("");
                  }
                : undefined
            }
            resetLabel="Start Over"
            sourceToolSlug="svg-png-converter"
            outputType="image"
          >
            {pngUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  PNG ready{" "}
                  <span className="text-xs font-mono text-text-secondary">
                    {pngDims.w}×{pngDims.h}px
                  </span>
                </p>
                <img src={pngUrl} alt="PNG result" className="max-w-full max-h-72 rounded-xl object-contain bg-surface-hover mx-auto sm:mx-0" />
              </div>
            )}
          </ResultPanel>
        </div>
      ) : (
        <div className="space-y-4">
          {!rasterFile ? (
            <DropZone onFiles={handleRasterFiles} accept="image/png,image/jpeg" label="Drop a PNG or JPG here or click to browse" enableCamera />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-surface rounded-2xl border border-border-soft p-3">
                <img src={rasterUrl} alt="Source" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-surface-hover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rasterFile.name}</p>
                  <p className="text-xs text-text-secondary">Raster source loaded</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (rasterUrl) URL.revokeObjectURL(rasterUrl);
                    if (svgUrl) URL.revokeObjectURL(svgUrl);
                    setRasterFile(null);
                    setRasterUrl("");
                    setSvgString("");
                    setSvgUrl("");
                    setTraceError("");
                    setTraceFailed(false);
                  }}
                >
                  Change
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Detail preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as Preset)}
                  className="w-full sm:max-w-[280px] px-3 py-2.5 sm:py-2 text-sm rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[44px] sm:min-h-0"
                >
                  {PRESETS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sticky bottom-20 md:static flex flex-col sm:flex-row gap-2">
                <Button onClick={handleTrace} disabled={tracing} className="w-full sm:w-auto">
                  <Shapes className="w-4 h-4" />
                  {tracing ? "Vectorizing..." : "Vectorize to SVG"}
                </Button>
                <Button variant="secondary" onClick={downloadEmbeddedSvg} className="w-full sm:w-auto">
                  <Download className="w-4 h-4" />
                  Embed as SVG
                </Button>
              </div>
            </div>
          )}
          <ResultPanel
            loading={tracing}
            loadingLabel="Vectorizing image..."
            error={traceError}
            onDownload={svgUrl ? downloadSvg : undefined}
            downloadLabel="Download SVG"
            onReset={
              rasterFile
                ? () => {
                    if (rasterUrl) URL.revokeObjectURL(rasterUrl);
                    if (svgUrl) URL.revokeObjectURL(svgUrl);
                    setRasterFile(null);
                    setRasterUrl("");
                    setSvgString("");
                    setSvgUrl("");
                    setTraceError("");
                    setTraceFailed(false);
                  }
                : undefined
            }
            resetLabel="Start Over"
            sourceToolSlug="svg-png-converter"
            outputType="image"
          >
            {svgUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  SVG ready{" "}
                  <span className="text-xs font-mono text-text-secondary">{formatSize(new Blob([svgString]).size)}</span>
                </p>
                <img src={svgUrl} alt="SVG preview" className="max-w-full max-h-72 rounded-xl object-contain bg-surface-hover mx-auto sm:mx-0" />
              </div>
            )}
            {traceFailed && rasterFile && !svgUrl && (
              <div className="space-y-2">
                <p className="text-sm">Tracing is unavailable, but you can still get an SVG:</p>
                <Button variant="secondary" onClick={downloadEmbeddedSvg}>
                  <Download className="w-4 h-4" />
                  Download embedded SVG
                </Button>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
