"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download } from "lucide-react";

const FORMATS = [
  { label: "PNG", mime: "image/png", ext: "png" },
  { label: "JPG", mime: "image/jpeg", ext: "jpg" },
  { label: "WebP", mime: "image/webp", ext: "webp" },
  { label: "AVIF", mime: "image/avif", ext: "avif" },
];

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [format, setFormat] = useState("image/png");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [resultExt, setResultExt] = useState("png");
  const [avifSupported, setAvifSupported] = useState(true);
  const [error, setError] = useState("");

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
    setError("");

    if (!avifSupported) {
      const canvas = document.createElement("canvas");
      setAvifSupported(typeof canvas.toBlob === "function");
    }
  }, [avifSupported]);

  const handleConvert = () => {
    if (!file) return;
    setError("");

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const fmt = FORMATS.find((f) => f.mime === format) || FORMATS[0];

      try {
        canvas.toBlob((blob) => {
          if (blob) {
            setResultUrl(URL.createObjectURL(blob));
            setResultExt(fmt.ext);
          }
        }, format);
      } catch {
        if (format === "image/avif") {
          setAvifSupported(false);
          setError("AVIF format is not supported in your browser. Please choose another format.");
        } else {
          setError("Conversion failed. Please try another format.");
        }
      }
    };
    img.src = imageUrl;
  };

  return (
    <ToolLayout
      title="Image Converter"
      description="Convert images between PNG, JPG, WebP, and AVIF formats. All processing is local."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />

          <div>
            <label className="text-sm font-medium">Target Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {FORMATS.map((f) => (
                <option key={f.mime} value={f.mime} disabled={f.mime === "image/avif" && !avifSupported}>
                  {f.label}{f.mime === "image/avif" && !avifSupported ? " (unsupported)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConvert}
              className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all"
            >
              Convert
            </button>
            <button
              onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); setError(""); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Converted (.{resultExt})</p>
              <img src={resultUrl} alt="Converted" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a
                href={resultUrl}
                download={`converted.${resultExt}`}
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
