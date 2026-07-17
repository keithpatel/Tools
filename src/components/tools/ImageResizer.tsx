"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download, Lock, Unlock } from "lucide-react";

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageNatural, setImageNatural] = useState({ w: 0, h: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [resultUrl, setResultUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setResultUrl("");

    const img = new Image();
    img.onload = () => {
      setImageNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.src = url;
  }, []);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && imageNatural.h && imageNatural.w) {
      setHeight(Math.round(val * (imageNatural.h / imageNatural.w)));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && imageNatural.w && imageNatural.h) {
      setWidth(Math.round(val * (imageNatural.w / imageNatural.h)));
    }
  };

  const handleResize = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) setResultUrl(URL.createObjectURL(blob));
      }, file.type);
    };
    img.src = imageUrl;
  };

  return (
    <ToolLayout
      title="Image Resizer"
      description="Resize images to exact dimensions. Maintains aspect ratio with optional lock."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />

          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs font-medium">Width (px)</label>
              <input
                type="number"
                min={1}
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="w-28 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              onClick={() => setLockAspect(!lockAspect)}
              className="p-2 mb-0.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
            <div>
              <label className="text-xs font-medium">Height (px)</label>
              <input
                type="number"
                min={1}
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                className="w-28 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResize}
              className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all"
            >
              Resize
            </button>
            <button
              onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Result ({width}x{height})</p>
              <img src={resultUrl} alt="Resized" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a
                href={resultUrl}
                download={`resized-${file.name}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
