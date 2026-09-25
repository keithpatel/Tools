"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Download, Type, Image as ImageIcon, Save, FolderOpen, Layers, Archive } from "lucide-react";
import JSZip from "jszip";

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const PRESET_KEY = "watermark-preset";

interface WatermarkPreset {
  mode: "text" | "image";
  text: string;
  fontSize: number;
  color: string;
  position: string;
  opacity: number;
  rotation: number;
  tile: boolean;
}

interface BatchResult {
  name: string;
  url: string;
  blob: Blob;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas export failed"));
    }, type || "image/png");
  });
}

export default function WatermarkAdder() {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("© Watermark");
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [tile, setTile] = useState(false);
  const [position, setPosition] = useState("bottom-right");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [results, setResults] = useState<BatchResult[]>([]);
  const [processing, setProcessing] = useState(false);

  const file = files[0] ?? null;
  const imageUrl = urls[0] ?? "";
  const resultUrl = results[0]?.url ?? "";

  const handleFiles = useCallback((incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    const list = images.length > 0 ? images : incoming;
    setFiles(list);
    setUrls(list.map((f) => URL.createObjectURL(f)));
    setResults([]);
  }, []);

  const handleLogoFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setLogoFile(f);
    setLogoUrl(URL.createObjectURL(f));
  }, []);

  const getPositionCoords = (w: number, h: number, objW: number, objH: number, pad: number) => {
    const cx = (w - objW) / 2;
    const cy = (h - objH) / 2;
    switch (position) {
      case "top-left":
        return { x: pad, y: pad };
      case "top-center":
        return { x: cx, y: pad };
      case "top-right":
        return { x: w - objW - pad, y: pad };
      case "middle-left":
        return { x: pad, y: cy };
      case "center":
        return { x: cx, y: cy };
      case "middle-right":
        return { x: w - objW - pad, y: cy };
      case "bottom-left":
        return { x: pad, y: h - objH - pad };
      case "bottom-center":
        return { x: cx, y: h - objH - pad };
      case "bottom-right":
        return { x: w - objW - pad, y: h - objH - pad };
      default:
        return { x: w - objW - pad, y: h - objH - pad };
    }
  };

  const drawTextWatermark = (
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = fontSize * 1.2;
    const pad = 20;

    const drawRotatedText = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x + tw / 2, y + th / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(text, -tw / 2, -th / 2);
      ctx.restore();
    };

    if (tile) {
      const stepX = tw + 60;
      const stepY = th + 60;
      for (let y = pad; y < canvasH; y += stepY) {
        for (let x = pad; x < canvasW; x += stepX) {
          drawRotatedText(x, y);
        }
      }
    } else {
      const { x, y } = getPositionCoords(canvasW, canvasH, tw, th, pad);
      drawRotatedText(x, y);
    }
    ctx.restore();
  };

  const drawLogoWatermark = (
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    logo: HTMLImageElement
  ) => {
    ctx.save();
    ctx.globalAlpha = opacity;
    const logoMax = Math.min(canvasW, canvasH) * 0.2;
    const ratio = Math.min(logoMax / logo.width, logoMax / logo.height) || 1;
    const lw = logo.width * ratio;
    const lh = logo.height * ratio;
    const pad = 20;

    const drawRotatedLogo = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x + lw / 2, y + lh / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(logo, -lw / 2, -lh / 2, lw, lh);
      ctx.restore();
    };

    if (tile) {
      const stepX = lw + 60;
      const stepY = lh + 60;
      for (let y = pad; y < canvasH; y += stepY) {
        for (let x = pad; x < canvasW; x += stepX) {
          drawRotatedLogo(x, y);
        }
      }
    } else {
      const { x, y } = getPositionCoords(canvasW, canvasH, lw, lh, pad);
      drawRotatedLogo(x, y);
    }
    ctx.restore();
  };

  const renderOne = useCallback(
    async (srcFile: File, srcUrl: string): Promise<BatchResult> => {
      const img = await loadImage(srcUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      if (mode === "text" && text) {
        drawTextWatermark(ctx, canvas.width, canvas.height);
      } else if (mode === "image" && logoUrl) {
        const logo = await loadImage(logoUrl);
        drawLogoWatermark(ctx, canvas.width, canvas.height, logo);
      }

      const blob = await canvasToBlob(canvas, srcFile.type || "image/png");
      return {
        name: `watermarked-${srcFile.name.replace(/\.[^.]+$/, "")}.png`,
        url: URL.createObjectURL(blob),
        blob,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, text, fontSize, color, opacity, rotation, tile, position, logoUrl]
  );

  const applyWatermark = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const out: BatchResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const r = await renderOne(files[i], urls[i]);
        out.push(r);
      }
      setResults(out);
    } finally {
      setProcessing(false);
    }
  };

  const downloadZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(r.name, r.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "watermarked-batch.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const savePreset = () => {
    const preset: WatermarkPreset = {
      mode,
      text,
      fontSize,
      color,
      position,
      opacity,
      rotation,
      tile,
    };
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(preset));
    } catch {
      // storage unavailable
    }
  };

  const loadPreset = () => {
    try {
      const raw = localStorage.getItem(PRESET_KEY);
      if (!raw) return;
      const preset = JSON.parse(raw) as WatermarkPreset;
      if (preset.mode === "text" || preset.mode === "image") setMode(preset.mode);
      if (typeof preset.text === "string") setText(preset.text);
      if (typeof preset.fontSize === "number") setFontSize(preset.fontSize);
      if (typeof preset.color === "string") setColor(preset.color);
      if (typeof preset.position === "string") setPosition(preset.position);
      if (typeof preset.opacity === "number") setOpacity(preset.opacity);
      if (typeof preset.rotation === "number") setRotation(preset.rotation);
      if (typeof preset.tile === "boolean") setTile(preset.tile);
    } catch {
      // invalid preset
    }
  };

  const resetAll = () => {
    setFiles([]);
    setUrls([]);
    setResults([]);
  };

  return (
    <ToolLayout
      title="Watermark Adder"
      description="Add text or image watermarks to your images. Batch mode watermarks multiple images with the same settings."
    >
      {files.length === 0 ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple enableCamera />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {urls.map((u, i) => (
              <img
                key={i}
                src={u}
                alt={`Original ${i + 1}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {files.length} image{files.length === 1 ? "" : "s"} loaded. Same watermark settings apply to all.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("text")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${mode === "text" ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <Type className="w-4 h-4" /> Text
            </button>
            <button
              onClick={() => setMode("image")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${mode === "image" ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <ImageIcon className="w-4 h-4" /> Image
            </button>
          </div>

          {mode === "text" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Text</label>
                <input value={text} onChange={(e) => setText(e.target.value)} className="w-full p-2.5 sm:p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-medium">Font Size</label>
                <input type="number" min={8} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full p-2.5 sm:p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-medium">Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-11 sm:h-9 p-0.5 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="text-xs font-medium">Opacity: {Math.round(opacity * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-7 sm:h-5 mt-1" />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium mb-1">Logo Image</p>
              {!logoFile ? (
                <DropZone onFiles={handleLogoFiles} accept="image/png,image/jpeg,image/webp" label="Drop logo image here" />
              ) : (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />
                  <span className="text-sm text-gray-500 truncate flex-1">{logoFile.name}</span>
                  <button onClick={() => { setLogoFile(null); setLogoUrl(""); }} className="text-xs text-red-500 hover:underline p-2 min-h-[44px] flex items-center">Remove</button>
                </div>
              )}
              <div className="mt-3">
                <label className="text-xs font-medium">Logo opacity: {Math.round(opacity * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full h-7 sm:h-5 mt-1" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium">Rotation: {rotation}°</label>
            <input type="range" min={-180} max={180} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full h-7 sm:h-5 mt-1" />
          </div>

          <div>
            <label className="text-xs font-medium">Position (9-point grid)</label>
            <div className="grid grid-cols-3 gap-1.5 mt-2 w-44 sm:w-48">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  title={p}
                  onClick={() => setPosition(p)}
                  className={`px-2 py-2 sm:py-1.5 rounded-lg text-[11px] font-medium transition-colors min-h-[38px] sm:min-h-0 flex items-center justify-center ${position === p ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTile(!tile)}
              aria-pressed={tile}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 ${tile ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <Layers className="w-4 h-4" /> Tile mode: {tile ? "On" : "Off"}
            </button>
            <span className="text-xs text-gray-500">Repeat watermark across the whole image.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={applyWatermark} disabled={processing} className="w-full sm:w-auto min-h-[44px]">
              {processing ? "Applying..." : `Apply Watermark${files.length > 1 ? ` to ${files.length} images` : ""}`}
            </Button>
            <Button variant="secondary" onClick={resetAll} className="w-full sm:w-auto min-h-[44px]">
              Reset
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={savePreset} className="w-full sm:w-auto min-h-[44px]">
              <Save className="w-4 h-4" /> Save preset
            </Button>
            <Button variant="secondary" onClick={loadPreset} className="w-full sm:w-auto min-h-[44px]">
              <FolderOpen className="w-4 h-4" /> Load preset
            </Button>
          </div>

          {results.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Result{results.length > 1 ? "s" : ""}</p>
              <img src={resultUrl} alt="Watermarked" className="max-w-full max-h-56 sm:max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-3 mx-auto sm:mx-0" />
              <div className="flex flex-col sm:flex-row gap-2">
                <a href={resultUrl} download={`watermarked-${file?.name ?? "image.png"}`} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base sm:text-sm font-medium transition-colors min-h-[44px]">
                  <Download className="w-4 h-4" /> Download{results.length > 1 ? " first" : ""}
                </a>
                {results.length > 1 && (
                  <Button onClick={downloadZip} className="w-full sm:w-auto min-h-[44px] bg-green-600 hover:opacity-90">
                    <Archive className="w-4 h-4" /> Download all as ZIP
                  </Button>
                )}
              </div>
              {results.length > 1 && (
                <ul className="mt-3 space-y-1.5">
                  {results.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="truncate flex-1 text-gray-600 dark:text-gray-300">{r.name}</span>
                      <a href={r.url} download={r.name} className="text-xs text-accent hover:underline p-2 min-h-[36px] flex items-center">
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
