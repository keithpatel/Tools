"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download, Type, Image as ImageIcon } from "lucide-react";

const POSITIONS = ["top-left", "top-right", "center", "bottom-left", "bottom-right"];

export default function WatermarkAdder() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [text, setText] = useState("© Watermark");
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState("bottom-right");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const logoImgRef = useRef<HTMLImageElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
  }, []);

  const handleLogoFiles = useCallback((files: File[]) => {
    const f = files[0];
    setLogoFile(f);
    setLogoUrl(URL.createObjectURL(f));
  }, []);

  const getPositionCoords = (w: number, h: number, objW: number, objH: number, pad: number) => {
    switch (position) {
      case "top-left": return { x: pad, y: pad };
      case "top-right": return { x: w - objW - pad, y: pad };
      case "center": return { x: (w - objW) / 2, y: (h - objH) / 2 };
      case "bottom-left": return { x: pad, y: h - objH - pad };
      case "bottom-right": return { x: w - objW - pad, y: h - objH - pad };
      default: return { x: w - objW - pad, y: h - objH - pad };
    }
  };

  const applyWatermark = () => {
    if (!file) return;
    const img = new Image(100, 100);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      ctx.globalAlpha = opacity;

      if (mode === "text" && text) {
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = color;
        const metrics = ctx.measureText(text);
        const tw = metrics.width;
        const th = fontSize;
        const pad = 20;
        const { x, y } = getPositionCoords(canvas.width, canvas.height, tw, th, pad);
        ctx.fillText(text, x, y + th);
      } else if (mode === "image" && logoUrl) {
        const logo = new Image(100, 100);
        logo.onload = () => {
          const logoMax = Math.min(canvas.width, canvas.height) * 0.2;
          const ratio = Math.min(logoMax / logo.width, logoMax / logo.height);
          const lw = logo.width * ratio;
          const lh = logo.height * ratio;
          const pad = 20;
          const { x, y } = getPositionCoords(canvas.width, canvas.height, lw, lh, pad);
          ctx.drawImage(logo, x, y, lw, lh);
          canvas.toBlob((b) => { if (b) setResultUrl(URL.createObjectURL(b)); }, file.type);
        };
        logo.src = logoUrl;
        return;
      }

      canvas.toBlob((b) => { if (b) setResultUrl(URL.createObjectURL(b)); }, file.type);
    };
    img.src = imageUrl;
  };

  return (
    <ToolLayout
      title="Watermark Adder"
      description="Add text or image watermarks to your images."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <img ref={imgRef} src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />

          <div className="flex gap-2">
            <button
              onClick={() => setMode("text")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "text" ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <Type className="w-4 h-4" /> Text
            </button>
            <button
              onClick={() => setMode("image")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "image" ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <ImageIcon className="w-4 h-4" /> Image
            </button>
          </div>

          {mode === "text" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Text</label>
                <input value={text} onChange={(e) => setText(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-medium">Font Size</label>
                <input type="number" min={8} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="text-xs font-medium">Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-9 p-0.5 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer" />
              </div>
              <div>
                <label className="text-xs font-medium">Opacity: {Math.round(opacity * 100)}%</label>
                <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full mt-1" />
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
                  <span className="text-sm text-gray-500">{logoFile.name}</span>
                  <button onClick={() => { setLogoFile(null); setLogoUrl(""); }} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-medium">Position</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPosition(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${position === p ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={applyWatermark} className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all">
              Apply Watermark
            </button>
            <button onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors">
              Reset
            </button>
          </div>

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Result</p>
              <img src={resultUrl} alt="Watermarked" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a href={resultUrl} download={`watermarked-${file.name}`} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
