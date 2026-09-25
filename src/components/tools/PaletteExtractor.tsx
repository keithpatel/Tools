"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Palette, Copy, Check, FileText, RotateCcw } from "lucide-react";

interface Swatch {
  hex: string;
  r: number;
  g: number;
  b: number;
  count: number;
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

// Coarse-grid sampling + bucket quantization in RGB (16 bins per channel).
async function extractPalette(src: string, maxColors: number): Promise<Swatch[]> {
  const img = await loadImage(src);
  const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  const STEP = 4;
  for (let y = 0; y < h; y += STEP) {
    for (let x = 0; x < w; x += STEP) {
      const o = (y * w + x) * 4;
      const a = data[o + 3];
      if (a < 128) continue;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const hit = buckets.get(key);
      if (hit) {
        hit.count++;
        hit.r += r;
        hit.g += g;
        hit.b += b;
      } else {
        buckets.set(key, { count: 1, r, g, b });
      }
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, maxColors))
    .map((b) => {
      const r = b.r / b.count;
      const g = b.g / b.count;
      const bl = b.b / b.count;
      return { hex: toHex(r, g, bl), r: Math.round(r), g: Math.round(g), b: Math.round(bl), count: b.count };
    });
}

// Hand-written Adobe ASE writer: ASEF header, version 1.0, COLOR entries with
// RGB float32 BE + UTF-16BE null-terminated names.
function buildAse(swatches: Swatch[]): Blob {
  const names = swatches.map((_, i) => `Color ${i + 1}`);
  const encoderSizes = names.map((n) => 2 + (n.length + 1) * 2 + 4 + 12 + 2);
  let total = 12;
  for (const s of encoderSizes) total += 12 + s;

  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  let o = 0;
  const writeAscii = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o++, s.charCodeAt(i));
  };
  writeAscii("ASEF");
  view.setUint16(o, 1, false); o += 2;
  view.setUint16(o, 0, false); o += 2;
  view.setUint32(o, swatches.length, false); o += 4;

  swatches.forEach((s, i) => {
    const name = names[i];
    const blockLen = encoderSizes[i];
    view.setUint16(o, 0x0001, false); o += 2; // COLOR entry
    view.setUint32(o, blockLen, false); o += 4;
    view.setUint16(o, name.length + 1, false); o += 2; // UTF-16 length incl. null
    for (let c = 0; c < name.length; c++) {
      view.setUint16(o, name.charCodeAt(c), false); o += 2;
    }
    view.setUint16(o, 0, false); o += 2; // null terminator
    writeAscii("RGB ");
    view.setFloat32(o, s.r / 255, false); o += 4;
    view.setFloat32(o, s.g / 255, false); o += 4;
    view.setFloat32(o, s.b / 255, false); o += 4;
    view.setUint16(o, 2, false); o += 2; // Normal color type
  });

  return new Blob([buf], { type: "application/octet-stream" });
}

export default function PaletteExtractor() {
  const [imageUrl, setImageUrl] = useState("");
  const [count, setCount] = useState(6);
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedKind, setCopiedKind] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setSwatches([]);
    setError(null);
    setImageUrl(URL.createObjectURL(f));
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    extractPalette(imageUrl, count)
      .then((s) => {
        if (!cancelled) setSwatches(s);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Extraction failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, count]);

  const copyText = useCallback(async (text: string, kind: string, idx: number | null = null) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      setCopiedIdx(idx);
      setTimeout(() => {
        setCopiedKind(null);
        setCopiedIdx(null);
      }, 2000);
    } catch {
      setError("Copy failed — select the text manually");
    }
  }, []);

  const cssVars = swatches.map((s, i) => `  --color-${i + 1}: ${s.hex};`).join("\n");
  const cssSnippet = `:root {\n${cssVars}\n}`;
  const tailwindSnippet = `// Tailwind: extend your theme with these colors\ncolors: {\n${swatches.map((s, i) => `  'palette-${i + 1}': '${s.hex}',`).join("\n")}\n}`;

  const downloadTxt = useCallback(() => {
    const lines = swatches.map((s, i) => `Color ${i + 1}: ${s.hex}  rgb(${s.r}, ${s.g}, ${s.b})`).join("\n");
    const blob = new Blob([lines + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [swatches]);

  const downloadAse = useCallback(() => {
    if (swatches.length === 0) return;
    const blob = buildAse(swatches);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.ase";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [swatches]);

  const reset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setSwatches([]);
    setError(null);
    setCount(6);
  }, [imageUrl]);

  return (
    <ToolLayout
      title="Palette Extractor"
      description="Sample any photo and pull its dominant colors into swatches and exports."
    >
      {!imageUrl ? (
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop an image here or click to browse" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            <img src={imageUrl} alt="Source for palette extraction" className="w-full sm:w-48 max-h-48 object-cover rounded-xl bg-surface-hover" />
            <div className="flex-1">
              <label className="text-xs font-medium">Colors: {count} (3-10)</label>
              <input
                type="range"
                min={3}
                max={10}
                step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-7 sm:h-5 mt-1"
              />
              <p className="text-[11px] text-text-secondary mt-1">Buckets are re-ranked automatically when the slider changes.</p>
            </div>
          </div>

          <ResultPanel
            loading={loading}
            loadingLabel="Extracting palette..."
            error={error}
            onDownload={swatches.length > 0 ? downloadAse : undefined}
            downloadLabel="Download .ase"
            onReset={reset}
            resetLabel="Start Over"
          >
            {swatches.length > 0 && !loading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {swatches.map((s, i) => (
                    <button
                      key={s.hex + i}
                      onClick={() => copyText(s.hex, "swatch", i)}
                      className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-hover p-2.5 text-left hover:opacity-90 transition-opacity min-h-[56px]"
                      title="Click to copy HEX"
                    >
                      <span className="w-10 h-10 rounded-lg shrink-0 border border-black/10" style={{ backgroundColor: s.hex }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-mono font-semibold">{s.hex}</span>
                        <span className="block text-[11px] text-text-secondary font-mono">rgb({s.r}, {s.g}, {s.b})</span>
                      </span>
                      {copiedKind === "swatch" && copiedIdx === i ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-secondary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="sticky bottom-20 md:static flex flex-col sm:flex-row flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => copyText(cssSnippet, "css")} className="w-full sm:w-auto">
                    {copiedKind === "css" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedKind === "css" ? "Copied" : "Copy CSS variables"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => copyText(tailwindSnippet, "tw")} className="w-full sm:w-auto">
                    {copiedKind === "tw" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copiedKind === "tw" ? "Copied" : "Copy Tailwind snippet"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={downloadTxt} className="w-full sm:w-auto">
                    <FileText className="w-4 h-4" /> Download .txt
                  </Button>
                  <Button size="sm" onClick={downloadAse} className="w-full sm:w-auto">
                    <Palette className="w-4 h-4" /> Download .ase
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset} className="w-full sm:w-auto">
                    <RotateCcw className="w-4 h-4" /> New image
                  </Button>
                </div>
              </div>
            ) : undefined}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
