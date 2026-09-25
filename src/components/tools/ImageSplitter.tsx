"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Scissors, LayoutGrid, Archive, RotateCcw } from "lucide-react";
import JSZip from "jszip";

interface Tile {
  url: string;
  blob: Blob;
  row: number;
  col: number;
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

export default function ImageSplitter() {
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("image.png");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const tilesRef = useRef<Tile[]>([]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    tilesRef.current.forEach((t) => URL.revokeObjectURL(t.url));
    tilesRef.current = [];
    setTiles([]);
    setError(null);
    setFileName(f.name.replace(/\.[^.]+$/, "") || "image");
    setImageUrl(URL.createObjectURL(f));
  }, []);

  const split = useCallback(async (src: string, r: number, c: number) => {
    setSplitting(true);
    setError(null);
    try {
      const img = await loadImage(src);
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setImgSize({ w: nw, h: nh });

      // Gapless exact division: base size floored, remainder goes to last row/col.
      const baseW = Math.max(1, Math.floor(nw / c));
      const baseH = Math.max(1, Math.floor(nh / r));
      const widths: number[] = [];
      const heights: number[] = [];
      for (let i = 0; i < c; i++) widths.push(i < c - 1 ? baseW : nw - baseW * (c - 1));
      for (let i = 0; i < r; i++) heights.push(i < r - 1 ? baseH : nh - baseH * (r - 1));

      const next: Tile[] = [];
      let y = 0;
      for (let ri = 0; ri < r; ri++) {
        let x = 0;
        for (let ci = 0; ci < c; ci++) {
          const w = widths[ci];
          const h = heights[ri];
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          const blob: Blob = await new Promise((resolve, reject) =>
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Tile render failed"))), "image/png")
          );
          next.push({ url: URL.createObjectURL(blob), blob, row: ri + 1, col: ci + 1 });
          x += w;
        }
        y += heights[ri];
      }
      tilesRef.current.forEach((t) => URL.revokeObjectURL(t.url));
      tilesRef.current = next;
      setTiles(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Splitting failed");
    }
    setSplitting(false);
  }, []);

  useEffect(() => {
    if (imageUrl) split(imageUrl, rows, cols);
  }, [imageUrl, rows, cols, split]);

  const downloadZip = useCallback(async () => {
    if (tilesRef.current.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const t of tilesRef.current) {
        zip.file(`tile-r${t.row}-c${t.col}.png`, t.blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}-tiles.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setError("ZIP export failed");
    }
    setZipping(false);
  }, [fileName]);

  const reset = useCallback(() => {
    tilesRef.current.forEach((t) => URL.revokeObjectURL(t.url));
    tilesRef.current = [];
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setTiles([]);
    setError(null);
    setRows(3);
    setCols(3);
  }, [imageUrl]);

  const nums = [1, 2, 3, 4, 5];

  return (
    <ToolLayout
      title="Image Splitter"
      description="Split one image into a gapless grid of PNG tiles with numbered preview."
    >
      {!imageUrl ? (
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop an image here or click to browse" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div>
              <p className="text-xs font-medium mb-1.5">Rows: {rows}</p>
              <div className="flex gap-1.5">
                {nums.map((n) => (
                  <Button
                    key={`r${n}`}
                    variant={rows === n ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setRows(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Columns: {cols}</p>
              <div className="flex gap-1.5">
                {nums.map((n) => (
                  <Button
                    key={`c${n}`}
                    variant={cols === n ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setCols(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
              <Button variant="secondary" size="sm" onClick={() => { setRows(3); setCols(1); }}>
                <LayoutGrid className="w-3.5 h-3.5" /> Instagram 3x1
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setRows(3); setCols(3); }}>
                <LayoutGrid className="w-3.5 h-3.5" /> 3x3 grid
              </Button>
            </div>
          </div>

          {imgSize.w > 0 && (
            <p className="text-xs text-text-secondary">
              Source: {imgSize.w} x {imgSize.h}px &mdash; {rows * cols} tiles ({rows} rows x {cols} cols)
            </p>
          )}

          <ResultPanel
            loading={splitting}
            loadingLabel="Splitting image..."
            error={error}
            onDownload={tiles.length > 0 ? downloadZip : undefined}
            downloadLabel={zipping ? "Zipping..." : "Download all as ZIP"}
            onReset={reset}
            resetLabel="Start Over"
          >
            {tiles.length > 0 && !splitting ? (
              <div className="space-y-4">
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {tiles.map((t) => (
                    <div key={`r${t.row}c${t.col}`} className="relative group">
                      <img
                        src={t.url}
                        alt={`Tile row ${t.row} col ${t.col}`}
                        className="w-full h-auto block bg-surface-hover"
                      />
                      <span className="absolute top-1 left-1 text-[11px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">
                        {t.row}x{t.col}
                      </span>
                      <a
                        href={t.url}
                        download={`tile-r${t.row}-c${t.col}.png`}
                        className="absolute bottom-1 right-1 text-[11px] font-medium bg-black/60 text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        PNG
                      </a>
                    </div>
                  ))}
                </div>
                <div className="sticky bottom-20 md:static flex flex-col sm:flex-row gap-2">
                  <Button onClick={downloadZip} disabled={zipping} className="w-full sm:w-auto">
                    <Archive className="w-4 h-4" /> {zipping ? "Zipping..." : "Download all as ZIP"}
                  </Button>
                  <Button variant="secondary" onClick={reset} className="w-full sm:w-auto">
                    <RotateCcw className="w-4 h-4" /> New image
                  </Button>
                </div>
              </div>
            ) : undefined}
          </ResultPanel>

          {!tiles.length && !splitting && (
            <Button variant="ghost" onClick={reset}>
              <Scissors className="w-4 h-4" /> Cancel
            </Button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
