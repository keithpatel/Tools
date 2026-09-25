"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import JSZip from "jszip";
import { Download, X, Archive } from "lucide-react";

const FORMATS = [
  { label: "PNG", mime: "image/png", ext: "png", custom: false },
  { label: "JPG", mime: "image/jpeg", ext: "jpg", custom: false },
  { label: "WebP", mime: "image/webp", ext: "webp", custom: false },
  { label: "AVIF", mime: "image/avif", ext: "avif", custom: false },
  { label: "BMP", mime: "image/bmp", ext: "bmp", custom: true },
  { label: "ICO", mime: "image/x-icon", ext: "ico", custom: true },
];

interface BatchItem {
  id: string;
  file: File;
  url: string;
  resultUrl: string;
  resultExt: string;
  error: string;
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode-failed"));
    img.src = url;
  });
}

async function drawFileToCanvas(file: File, url: string, canvas: HTMLCanvasElement): Promise<void> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      if (typeof bmp.close === "function") bmp.close();
      return;
    } catch {
      // fall through to native Image decode
    }
  }
  const img = await loadImg(url);
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
}

function encodeBMP(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowPadded = Math.floor((width * 3 + 3) / 4) * 4;
  const pixelDataSize = rowPadded * height;
  const fileSize = 14 + 40 + pixelDataSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 14 + 40, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);
  const bytes = new Uint8Array(buffer);
  let offset = 14 + 40;
  for (let y = height - 1; y >= 0; y--) {
    let rowOffset = offset;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      bytes[rowOffset++] = data[i + 2];
      bytes[rowOffset++] = data[i + 1];
      bytes[rowOffset++] = data[i];
    }
    offset += rowPadded;
  }
  return new Blob([bytes], { type: "image/bmp" });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("encode-failed"));
    }, mime);
  });
}

async function encodeICO(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await canvasToBlob(canvas, "image/png");
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new ArrayBuffer(6 + 16);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, canvas.width >= 256 ? 0 : canvas.width);
  view.setUint8(7, canvas.height >= 256 ? 0 : canvas.height);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, 6 + 16, true);
  return new Blob([new Uint8Array(header), pngBytes], { type: "image/x-icon" });
}

async function convertCanvas(canvas: HTMLCanvasElement, mime: string): Promise<Blob> {
  if (mime === "image/bmp") {
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return encodeBMP(imageData);
  }
  if (mime === "image/x-icon") {
    return encodeICO(canvas);
  }
  return canvasToBlob(canvas, mime);
}

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [format, setFormat] = useState("image/png");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [resultExt, setResultExt] = useState("png");
  const [avifSupported, setAvifSupported] = useState(true);
  const [error, setError] = useState("");
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [showUnsupportedNote, setShowUnsupportedNote] = useState(true);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
    setError("");
    if (files.length > 1) {
      setBatch(
        files.map((bf, i) => ({
          id: `${Date.now()}-${i}-${bf.name}`,
          file: bf,
          url: URL.createObjectURL(bf),
          resultUrl: "",
          resultExt: "",
          error: "",
        }))
      );
    } else {
      setBatch([]);
    }

    if (!avifSupported) {
      const canvas = document.createElement("canvas");
      setAvifSupported(typeof canvas.toBlob === "function");
    }
  }, [avifSupported]);

  const handleConvert = () => {
    if (!file) return;
    setError("");

    const run = async () => {
      try {
        const canvas = document.createElement("canvas");
        await drawFileToCanvas(file, imageUrl, canvas);
        const fmt = FORMATS.find((f) => f.mime === format) || FORMATS[0];
        const blob = await convertCanvas(canvas, format);
        setResultUrl(URL.createObjectURL(blob));
        setResultExt(fmt.ext);
      } catch {
        if (format === "image/avif") {
          setAvifSupported(false);
          setError("AVIF format is not supported in your browser. Please choose another format.");
        } else {
          setError("Conversion failed. This input may not be decodable in your browser. Try another file or format.");
        }
      }
    };
    run();
  };

  const handleConvertBatch = async () => {
    if (batch.length === 0) return;
    setBatchLoading(true);
    setError("");
    const fmt = FORMATS.find((f) => f.mime === format) || FORMATS[0];
    for (const item of batch) {
      try {
        const canvas = document.createElement("canvas");
        await drawFileToCanvas(item.file, item.url, canvas);
        const blob = await convertCanvas(canvas, format);
        const url = URL.createObjectURL(blob);
        setBatch((prev) => prev.map((b) => (b.id === item.id ? { ...b, resultUrl: url, resultExt: fmt.ext, error: "" } : b)));
      } catch {
        setBatch((prev) =>
          prev.map((b) =>
            b.id === item.id ? { ...b, error: `Could not decode ${item.file.name}; skipped.` } : b
          )
        );
      }
    }
    setBatchLoading(false);
  };

  const downloadAllAsZip = async () => {
    const done = batch.filter((b) => b.resultUrl);
    if (done.length === 0) return;
    setZipLoading(true);
    try {
      const zip = new JSZip();
      for (const item of done) {
        const res = await fetch(item.resultUrl);
        const buf = await res.arrayBuffer();
        zip.file(`converted-${item.file.name.replace(/\.[^.]+$/, "")}.${item.resultExt}`, buf);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "converted-images.zip";
      a.click();
      URL.revokeObjectURL(zipUrl);
    } finally {
      setZipLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageUrl("");
    setResultUrl("");
    setError("");
    setBatch([]);
  };

  const batchDone = batch.filter((b) => b.resultUrl).length;

  return (
    <ToolLayout
      title="Image Converter"
      description="Convert images between PNG, JPG, WebP, and AVIF formats. All processing is local."
    >
      {showUnsupportedNote && (
        <div className="flex items-start gap-2 text-xs sm:text-sm bg-warning-soft border border-warning-border rounded-xl px-3 py-2.5 mb-4">
          <p className="flex-1 text-warning-text">
            Note: TIFF (.tif / .tiff) and HEIC (.heic / .heif) are not supported because browsers provide no native decoder for them.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setShowUnsupportedNote(false)} aria-label="Dismiss note" className="min-h-[44px] sm:min-h-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*,.gif,.bmp,.ico" multiple enableCamera />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Original" className="max-h-48 rounded-lg object-contain bg-surface-hover checkerboard" />

          <div>
            <label className="text-sm font-medium">Target Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-surface text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              {FORMATS.map((f) => (
                <option key={f.mime} value={f.mime} disabled={f.mime === "image/avif" && !avifSupported}>
                  {f.label}{f.mime === "image/avif" && !avifSupported ? " (unsupported)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-secondary mt-1">GIF, BMP, and ICO files are accepted as input and decoded with the browser image loader.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleConvert} variant="primary" size="md" className="sm:w-auto">
              Convert
            </Button>
            <Button onClick={handleReset} variant="secondary" size="md" className="sm:w-auto">
              Reset
            </Button>
          </div>

          {error && <p className="text-sm text-error-text">{error}</p>}

          {resultUrl && (
            <div>
              <p className="text-xs text-text-secondary mb-1">Converted (.{resultExt})</p>
              {resultExt !== "ico" ? (
                <img src={resultUrl} alt="Converted" className="max-h-48 rounded-lg object-contain bg-surface-hover checkerboard mb-2" />
              ) : (
                <p className="text-xs text-text-secondary mb-2">ICO preview is not shown; download to verify the icon.</p>
              )}
              <a
                href={resultUrl}
                download={`converted.${resultExt}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}

          {batch.length > 1 && (
            <div className="space-y-2 border-t border-border-soft pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-sm font-medium">
                  Batch ({batch.length} files{batchDone > 0 ? `, ${batchDone} converted` : ""})
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  <Button variant="secondary" size="sm" onClick={handleConvertBatch} disabled={batchLoading} className="min-h-[44px] sm:min-h-0">
                    {batchLoading ? "Converting..." : "Convert all"}
                  </Button>
                  {batchDone > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadAllAsZip} disabled={zipLoading} className="min-h-[44px] sm:min-h-0">
                      <Archive className="w-4 h-4" /> {zipLoading ? "Zipping..." : "Download all as ZIP"}
                    </Button>
                  )}
                </div>
              </div>
              {batch.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm p-2 rounded-lg bg-surface-hover"
                >
                  <span className="font-medium truncate flex-1">{item.file.name}</span>
                  <span className="text-xs text-text-secondary">
                    {item.resultUrl ? `converted.${item.resultExt}` : item.error ? "" : "pending"}
                  </span>
                  {item.error && <span className="text-xs text-error-text">{item.error}</span>}
                  {item.resultUrl && (
                    <a
                      href={item.resultUrl}
                      download={`converted-${item.file.name.replace(/\.[^.]+$/, "")}.${item.resultExt}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-success-text dark:text-success-text min-h-[44px] sm:min-h-0 items-center"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
