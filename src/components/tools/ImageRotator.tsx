"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";

export default function ImageRotator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const renderCanvas = () => {
    if (!file || !imgRef.current) return;
    const img = imgRef.current;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = w * cos + h * sin;
    canvas.height = w * sin + h * cos;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -w / 2, -h / 2);

    canvas.toBlob((blob) => {
      if (blob) setResultUrl(URL.createObjectURL(blob));
    }, file.type);
  };

  const rotateCW = () => { setRotation((r) => r + 90); setTimeout(renderCanvas, 50); };
  const rotateCCW = () => { setRotation((r) => r - 90); setTimeout(renderCanvas, 50); };
  const toggleFlipH = () => { setFlipH((f) => !f); setTimeout(renderCanvas, 50); };
  const toggleFlipV = () => { setFlipV((f) => !f); setTimeout(renderCanvas, 50); };

  return (
    <ToolLayout
      title="Image Rotator"
      description="Rotate and flip images using canvas transforms."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <img ref={imgRef} src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" crossOrigin="anonymous" />

          <div className="flex flex-wrap gap-2">
            <button onClick={rotateCW} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
              <RotateCw className="w-4 h-4" /> Rotate 90° CW
            </button>
            <button onClick={rotateCCW} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
              <RotateCw className="w-4 h-4 scale-x-[-1]" /> Rotate 90° CCW
            </button>
            <button onClick={toggleFlipH} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              flipH ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}>
              <FlipHorizontal className="w-4 h-4" /> Flip H
            </button>
            <button onClick={toggleFlipV} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              flipV ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}>
              <FlipVertical className="w-4 h-4" /> Flip V
            </button>
          </div>

          <button
            onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
          >
            Reset
          </button>

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Result</p>
              <img src={resultUrl} alt="Result" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a
                href={resultUrl}
                download={`transformed-${file.name}`}
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
