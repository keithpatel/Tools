"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Pipette, Copy, Download, Palette, Check } from "lucide-react";

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

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface PaletteColor {
  r: number;
  g: number;
  b: number;
  hex: string;
  count: number;
}

type ExportTab = "css" | "tailwind" | "scss" | "ase";

function buildCssSnippet(colors: PaletteColor[]): string {
  const lines = colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

function buildScssSnippet(colors: PaletteColor[]): string {
  return colors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join("\n");
}

function buildTailwindSnippet(colors: PaletteColor[]): string {
  const entries = colors
    .map((c) => `        "color-${colors.indexOf(c) + 1}": "${c.hex}",`)
    .join("\n");
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      },\n    },\n  },\n};`;
}

// Adobe Swatch Exchange writer: signature ASEF, version 1.0, COLOR blocks
// with RGB float values + null-terminated UTF-16BE names.
function buildAseFile(colors: PaletteColor[]): Blob {
  const names = colors.map((_, i) => `Color ${i + 1}`);
  const blocks: { nameLen: number; blockLength: number }[] = names.map((name) => {
    const nameLen = name.length + 1; // include null terminator
    const blockLength = 2 + nameLen * 2 + 4 + 12 + 2;
    return { nameLen, blockLength };
  });
  const totalSize = 12 + blocks.reduce((sum, b) => sum + 2 + 4 + b.blockLength, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // Header: "ASEF"
  view.setUint8(offset++, 0x41);
  view.setUint8(offset++, 0x53);
  view.setUint8(offset++, 0x45);
  view.setUint8(offset++, 0x46);
  view.setUint16(offset, 1, false); offset += 2; // major
  view.setUint16(offset, 0, false); offset += 2; // minor
  view.setUint32(offset, colors.length, false); offset += 4; // num blocks

  colors.forEach((c, i) => {
    const name = names[i];
    const { nameLen, blockLength } = blocks[i];
    view.setUint16(offset, 0x0001, false); offset += 2; // COLOR block
    view.setUint32(offset, blockLength, false); offset += 4;
    view.setUint16(offset, nameLen, false); offset += 2;
    for (let k = 0; k < name.length; k++) {
      view.setUint16(offset, name.charCodeAt(k), false); offset += 2;
    }
    view.setUint16(offset, 0, false); offset += 2; // null terminator
    // color model "RGB "
    view.setUint8(offset++, 0x52);
    view.setUint8(offset++, 0x47);
    view.setUint8(offset++, 0x42);
    view.setUint8(offset++, 0x20);
    view.setFloat32(offset, c.r / 255, false); offset += 4;
    view.setFloat32(offset, c.g / 255, false); offset += 4;
    view.setFloat32(offset, c.b / 255, false); offset += 4;
    view.setUint16(offset, 2, false); offset += 2; // Normal color type
  });

  return new Blob([buffer], { type: "application/octet-stream" });
}

export default function ColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [eyeDropperSupported, setEyeDropperSupported] = useState(
    typeof window !== "undefined" && "EyeDropper" in window
  );
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExportTab>("css");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setColor(null);
    setPalette([]);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext("2d")!;
    const pixel = ctx.getImageData(
      Math.min(Math.max(x, 0), canvas.width - 1),
      Math.min(Math.max(y, 0), canvas.height - 1),
      1,
      1
    ).data;
    setColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
  };

  const handleEyeDropper = async () => {
    if (!("EyeDropper" in window)) {
      setEyeDropperSupported(false);
      return;
    }
    try {
      const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
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

  const generatePalette = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    // Coarse grid: sample at most ~80x80 points
    const stepX = Math.max(1, Math.floor(w / 80));
    const stepY = Math.max(1, Math.floor(h / 80));
    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
    for (let y = 0; y < h; y += stepY) {
      for (let x = 0; x < w; x += stepX) {
        const d = ctx.getImageData(x, y, 1, 1).data;
        const r = d[0];
        const g = d[1];
        const b = d[2];
        // Bucket-quantize: 4 bits per channel (12-bit key)
        const key = `${r >> 4},${g >> 4},${b >> 4}`;
        const existing = buckets.get(key);
        if (existing) {
          existing.r += r;
          existing.g += g;
          existing.b += b;
          existing.count += 1;
        } else {
          buckets.set(key, { r, g, b, count: 1 });
        }
      }
    }
    const sorted = [...buckets.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const result: PaletteColor[] = sorted.map((b) => {
      const r = Math.round(b.r / b.count);
      const g = Math.round(b.g / b.count);
      const bl = Math.round(b.b / b.count);
      return { r, g, b: bl, hex: rgbToHex(r, g, bl), count: b.count };
    });
    setPalette(result);
  };

  const copyText = async (textToCopy: string, key: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const downloadTextFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const downloadAse = () => {
    if (palette.length === 0) return;
    const blob = buildAseFile(palette);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.ase";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const c = color;
  const hex = c ? rgbToHex(c.r, c.g, c.b) : "";
  const hsl = c ? rgbToHsl(c.r, c.g, c.b) : null;

  const exportContent =
    palette.length === 0
      ? ""
      : activeTab === "css"
        ? buildCssSnippet(palette)
        : activeTab === "scss"
          ? buildScssSnippet(palette)
          : activeTab === "tailwind"
            ? buildTailwindSnippet(palette)
            : "Adobe ASE binary (download only — see palette.ase)";

  const exportFilename =
    activeTab === "css" ? "palette.css" : activeTab === "scss" ? "palette.scss" : "tailwind-colors.txt";

  const tabs: { id: ExportTab; label: string }[] = [
    { id: "css", label: "CSS variables" },
    { id: "tailwind", label: "Tailwind config" },
    { id: "scss", label: "SCSS variables" },
    { id: "ase", label: "Adobe .ase" },
  ];

  return (
    <ToolLayout
      title="Color Picker"
      description="Pick colors from an image. Click on the image or use the EyeDropper tool."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="max-h-64 rounded-lg object-contain bg-surface-hover checkerboard cursor-crosshair"
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

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              onClick={handleEyeDropper}
              disabled={!eyeDropperSupported}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Pipette className="w-4 h-4" /> EyeDropper
            </Button>
            <Button onClick={generatePalette} className="w-full sm:w-auto min-h-[44px]">
              <Palette className="w-4 h-4" /> Auto palette
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setFile(null); setImageUrl(""); setColor(null); setPalette([]); }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Reset
            </Button>
          </div>

          {!eyeDropperSupported && (
            <p className="text-xs text-warning">EyeDropper API not supported in your browser. Click the image to pick colors.</p>
          )}

          {c && (
            <div className="p-4 bg-surface-hover checkerboard rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border border-border-soft dark:border-border"
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

          {palette.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Auto palette (6 dominant colors)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {palette.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => copyText(p.hex, `swatch-${i}`)}
                    title="Click to copy HEX"
                    className="flex items-center gap-2 p-2 rounded-lg bg-surface-hover checkerboard hover:bg-border transition-colors min-h-[44px] text-left"
                  >
                    <span
                      className="w-10 h-10 rounded-md border border-border-soft dark:border-border shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="text-xs font-mono leading-tight">
                      <span className="block font-bold">{p.hex}</span>
                      <span className="block text-text-secondary">rgb({p.r}, {p.g}, {p.b})</span>
                      <span className="inline-flex items-center gap-1 text-text-secondary/70">
                        {copiedKey === `swatch-${i}` ? (
                          <><Check className="w-3 h-3 text-success" /> copied</>
                        ) : (
                          "click to copy"
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex flex-wrap gap-1.5 p-2 bg-surface-hover checkerboard">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[38px] sm:min-h-0 ${activeTab === t.id ? "bg-accent text-white" : "bg-surface-hover hover:bg-border"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="p-3 space-y-3">
                  {activeTab === "ase" ? (
                    <p className="text-xs text-text-secondary">
                      Adobe Swatch Exchange binary with {palette.length} RGB colors. Use download
                      below to get palette.ase (ASEF v1.0, COLOR blocks).
                    </p>
                  ) : (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-surface-hover p-3 rounded-lg max-h-56 overflow-auto">
                      {exportContent}
                    </pre>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {activeTab === "ase" ? (
                      <Button onClick={downloadAse} className="w-full sm:w-auto min-h-[44px]">
                        <Download className="w-4 h-4" /> Download palette.ase
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => copyText(exportContent, `export-${activeTab}`)}
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          {copiedKey === `export-${activeTab}` ? (
                            <><Check className="w-4 h-4 text-success" /> Copied</>
                          ) : (
                            <><Copy className="w-4 h-4" /> Copy snippet</>
                          )}
                        </Button>
                        <Button
                          onClick={() => downloadTextFile(exportContent, exportFilename, "text/plain")}
                          className="w-full sm:w-auto min-h-[44px]"
                        >
                          <Download className="w-4 h-4" /> Download file
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
