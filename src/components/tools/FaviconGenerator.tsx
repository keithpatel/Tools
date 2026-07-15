"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download } from "lucide-react";

const SIZES = [16, 32, 48, 64, 128];

export default function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [favicons, setFavicons] = useState<{ size: number; url: string }[]>([]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setFavicons([]);
  }, []);

  const generate = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const results: { size: number; url: string }[] = [];
      SIZES.forEach((size) => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - s) / 2;
        const sy = (img.naturalHeight - s) / 2;
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        const url = canvas.toDataURL("image/png");
        results.push({ size, url });
      });
      setFavicons(results);
    };
    img.src = imageUrl;
  };

  const downloadAll = () => {
    favicons.forEach(({ size, url }) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `favicon-${size}x${size}.png`;
      a.click();
    });
  };

  return (
    <ToolLayout
      title="Favicon Generator"
      description="Generate favicons in multiple sizes from a single image. Square images work best."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Source" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />

          <div className="flex gap-2">
            <button
              onClick={generate}
              className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all"
            >
              Generate Favicons
            </button>
            <button
              onClick={() => { setFile(null); setImageUrl(""); setFavicons([]); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          {favicons.length > 0 && (
            <div>
              <div className="grid grid-cols-5 gap-3 mb-3">
                {favicons.map(({ size, url }) => (
                  <div key={size} className="flex flex-col items-center">
                    <img
                      src={url}
                      alt={`${size}x${size}`}
                      className="rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                      style={{ width: Math.min(size * 2, 96), height: Math.min(size * 2, 96) }}
                    />
                    <span className="text-xs text-gray-500 mt-1">{size}×{size}</span>
                    <a
                      href={url}
                      download={`favicon-${size}x${size}.png`}
                      className="text-xs text-accent hover:underline mt-0.5"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
              <button
                onClick={downloadAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Download All
              </button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
