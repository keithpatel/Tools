"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Pipette } from "lucide-react";

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function toHex(c: number) {
  return c.toString(16).padStart(2, "0");
}

export default function ColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [eyeDropperSupported, setEyeDropperSupported] = useState(
    typeof window !== "undefined" && "EyeDropper" in window
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setColor(null);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d")!;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
  };

  const handleEyeDropper = async () => {
    if (!("EyeDropper" in window)) {
      setEyeDropperSupported(false);
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      const { sRGBHex } = result;
      const r = parseInt(sRGBHex.slice(1, 3), 16);
      const g = parseInt(sRGBHex.slice(3, 5), 16);
      const b = parseInt(sRGBHex.slice(5, 7), 16);
      setColor({ r, g, b });
    } catch {
      // user cancelled
    }
  };

  const c = color;
  const hex = c ? `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}` : "";
  const hsl = c ? rgbToHsl(c.r, c.g, c.b) : null;

  return (
    <ToolLayout
      title="Color Picker"
      description="Pick colors from an image. Click on the image or use the EyeDropper tool."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="max-h-64 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 cursor-crosshair"
              style={{ maxWidth: "100%" }}
            />
            <img
              src={imageUrl}
              alt="Source"
              className="hidden"
              onLoad={(e) => {
                const img = e.currentTarget;
                const canvas = canvasRef.current!;
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.style.maxWidth = "100%";
                canvas.style.height = "auto";
                const ctx = canvas.getContext("2d")!;
                ctx.drawImage(img, 0, 0);
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEyeDropper}
              disabled={!eyeDropperSupported}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              <Pipette className="w-4 h-4" /> EyeDropper
            </button>
            <button
              onClick={() => { setFile(null); setImageUrl(""); setColor(null); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          {!eyeDropperSupported && (
            <p className="text-xs text-amber-500">EyeDropper API not supported in your browser. Click the image to pick colors.</p>
          )}

          {c && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: hex }}
                />
                <div className="text-sm font-mono space-y-0.5">
                  <p>HEX: <span className="font-bold">{hex}</span></p>
                  <p>RGB: rgb({c.r}, {c.g}, {c.b})</p>
                  {hsl && <p>HSL: hsl({hsl.h}°, {hsl.s}%, {hsl.l}%)</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
