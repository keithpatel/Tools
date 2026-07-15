"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download, LayoutGrid } from "lucide-react";

interface LayoutDef {
  label: string;
  cols: number;
  rows: number;
}

const LAYOUTS: LayoutDef[] = [
  { label: "2×2", cols: 2, rows: 2 },
  { label: "1×2", cols: 1, rows: 2 },
  { label: "2×1", cols: 2, rows: 1 },
  { label: "3×1", cols: 3, rows: 1 },
];

export default function CollageMaker() {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [layout, setLayout] = useState<LayoutDef>(LAYOUTS[0]);
  const [gap, setGap] = useState(4);
  const [resultUrl, setResultUrl] = useState("");
  const [rendering, setRendering] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const handleFiles = useCallback((fs: File[]) => {
    setFiles(fs);
    setUrls(fs.map((f) => URL.createObjectURL(f)));
    setResultUrl("");
  }, []);

  const renderCollage = () => {
    if (files.length === 0) return;
    setRendering(true);

    const imgs = imagesRef.current;
    let loaded = 0;
    imgs.forEach((img) => {
      if (img.complete) loaded++;
    });

    const draw = () => {
      const cellW = 400;
      const cellH = 300;
      const gapPx = gap;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = layout.cols * cellW + (layout.cols - 1) * gapPx;
      canvas.height = layout.rows * cellH + (layout.rows - 1) * gapPx;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < layout.cols * layout.rows; i++) {
        const img = imgs[i];
        if (!img) break;
        const col = i % layout.cols;
        const row = Math.floor(i / layout.cols);
        const x = col * (cellW + gapPx);
        const y = row * (cellH + gapPx);

        const sx = img.naturalWidth > img.naturalHeight
          ? (img.naturalWidth - img.naturalHeight) / 2 : 0;
        const sy = img.naturalHeight > img.naturalWidth
          ? (img.naturalHeight - img.naturalWidth) / 2 : 0;
        const size = Math.min(img.naturalWidth, img.naturalHeight);

        ctx.drawImage(img, sx, sy, size, size, x, y, cellW, cellH);
      }

      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
        setRendering(false);
      }, "image/png");
    };

    if (loaded === files.length) draw();
    else setTimeout(draw, 100);
  };

  return (
    <ToolLayout
      title="Collage Maker"
      description="Create simple image collages from multiple photos."
    >
      {files.length === 0 ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {urls.map((url, i) => (
              <img
                key={i}
                ref={(el) => { if (el) imagesRef.current[i] = el; }}
                src={url}
                alt={`Image ${i + 1}`}
                className="w-20 h-20 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium self-center mr-1">Layout:</span>
            {LAYOUTS.map((l) => (
              <button
                key={l.label}
                onClick={() => setLayout(l)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  layout.label === l.label
                    ? "bg-accent text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <LayoutGrid className="w-3 h-3" /> {l.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium">Gap: {gap}px</label>
            <input type="range" min={0} max={20} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full mt-1" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={renderCollage}
              disabled={rendering}
              className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-all"
            >
              {rendering ? "Generating..." : "Generate Collage"}
            </button>
            <button
              onClick={() => { setFiles([]); setUrls([]); setResultUrl(""); imagesRef.current = []; }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Collage ({layout.label})</p>
              <img src={resultUrl} alt="Collage" className="max-h-64 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a
                href={resultUrl}
                download="collage.png"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
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
