"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Download, LayoutGrid } from "lucide-react";

interface LayoutDef {
  label: string;
  cols: number;
  rows: number;
  kind: "grid" | "one-plus-two";
}

const LAYOUTS: LayoutDef[] = [
  { label: "2×2", cols: 2, rows: 2, kind: "grid" },
  { label: "1×2", cols: 1, rows: 2, kind: "grid" },
  { label: "2×1", cols: 2, rows: 1, kind: "grid" },
  { label: "3×1", cols: 3, rows: 1, kind: "grid" },
  { label: "1+2", cols: 2, rows: 2, kind: "one-plus-two" },
];

export default function CollageMaker() {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutDef>(LAYOUTS[0]);
  const [spacing, setSpacing] = useState(4);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [scale, setScale] = useState<1 | 2 | 3>(1);
  const [resultUrl, setResultUrl] = useState("");
  const [rendering, setRendering] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const handleFiles = useCallback((fs: File[]) => {
    setFiles(fs);
    setUrls(fs.map((f) => URL.createObjectURL(f)));
    setResultUrl("");
  }, []);

  const drawCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const sx = img.naturalWidth > img.naturalHeight
      ? (img.naturalWidth - img.naturalHeight) / 2 : 0;
    const sy = img.naturalHeight > img.naturalWidth
      ? (img.naturalHeight - img.naturalWidth) / 2 : 0;
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, sx, sy, size, size, x, y, w, h);
  };

  const renderCollage = () => {
    if (files.length === 0) return;
    setRendering(true);

    const imgs = imagesRef.current;

    const draw = () => {
      const cellW = 400 * scale;
      const cellH = 300 * scale;
      const gapPx = spacing * scale;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      if (layout.kind === "one-plus-two") {
        // One large left, two stacked right
        canvas.width = cellW * 2 + gapPx;
        canvas.height = cellH * 2 + gapPx;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const leftW = cellW;
        const leftH = canvas.height;
        const rightW = cellW;
        const rightH = (canvas.height - gapPx) / 2;
        const rightX = cellW + gapPx;

        if (imgs[0]) drawCover(ctx, imgs[0], 0, 0, leftW, leftH);
        if (imgs[1]) drawCover(ctx, imgs[1], rightX, 0, rightW, rightH);
        if (imgs[2]) drawCover(ctx, imgs[2], rightX, rightH + gapPx, rightW, rightH);
      } else {
        canvas.width = layout.cols * cellW + (layout.cols - 1) * gapPx;
        canvas.height = layout.rows * cellH + (layout.rows - 1) * gapPx;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < layout.cols * layout.rows; i++) {
          const img = imgs[i];
          if (!img) break;
          const col = i % layout.cols;
          const row = Math.floor(i / layout.cols);
          const x = col * (cellW + gapPx);
          const y = row * (cellH + gapPx);
          drawCover(ctx, img, x, y, cellW, cellH);
        }
      }

      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
        setRendering(false);
      }, "image/png");
    };

    const allLoaded = imgs.slice(0, files.length).every((img) => img && img.complete);
    if (allLoaded) draw();
    else setTimeout(draw, 150);
  };

  return (
    <ToolLayout
      title="Collage Maker"
      description="Create simple image collages from multiple photos."
    >
      {files.length === 0 ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple enableCamera cameraLabel="Take photos instead" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {urls.map((url, i) => (
              <img
                key={i}
                ref={(el) => { if (el) imagesRef.current[i] = el; }}
                src={url}
                alt={`Image ${i + 1}`}
                className="w-20 h-20 rounded-lg object-cover bg-surface-hover checkerboard"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium self-center mr-1 w-full sm:w-auto">Layout:</span>
            {LAYOUTS.map((l) => (
              <button
                key={l.label}
                onClick={() => setLayout(l)}
                title={
                  l.label === "1+2"
                    ? "One large left, two stacked right"
                    : l.label === "2×2"
                      ? "2x2 grid"
                      : l.label === "1×2"
                        ? "1x2 vertical"
                        : l.label === "2×1"
                          ? "2x1 horizontal"
                          : "3x1 strip"
                }
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[38px] sm:min-h-0 ${
                  layout.label === l.label
                    ? "bg-accent text-white"
                    : "bg-surface-hover hover:bg-border"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> {l.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium">Spacing: {spacing}px (0-40)</label>
              <input type="range" min={0} max={40} value={spacing} onChange={(e) => setSpacing(Number(e.target.value))} className="w-full h-7 sm:h-5 mt-1" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-medium">Background / border color</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-11 sm:h-9 p-0.5 border border-border rounded-lg cursor-pointer mt-1" />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-medium">Export scale</label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full p-2.5 sm:p-2 border border-border rounded-lg bg-surface text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent mt-1 min-h-[44px] sm:min-h-0"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={renderCollage}
              disabled={rendering}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {rendering ? "Generating..." : "Generate Collage"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setFiles([]); setUrls([]); setResultUrl(""); imagesRef.current = []; }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Reset
            </Button>
          </div>

          {resultUrl && (
            <div>
              <p className="text-xs text-text-secondary mb-1">Collage ({layout.label}, {scale}x)</p>
              <img src={resultUrl} alt="Collage" className="max-w-full max-h-64 rounded-lg object-contain bg-surface-hover checkerboard mb-3 mx-auto sm:mx-0" />
              <a
                href={resultUrl}
                download="collage.png"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-base sm:text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download Collage
              </a>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
