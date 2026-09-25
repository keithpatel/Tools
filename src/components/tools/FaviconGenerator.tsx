"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Download, Package, Monitor, Smartphone } from "lucide-react";
import JSZip from "jszip";

const SIZES = [16, 32, 48, 64, 128];
const APP_NAME = "My App";
const PACKAGE_PNG_SIZES = [16, 32, 48];
const APPLE_SIZE = 180;
const ANDROID_SIZES = [192, 512];

function renderIconCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - s) / 2;
  const sy = (img.naturalHeight - s) / 2;
  ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Canvas export failed"));
    }, "image/png");
  });
}

// Hand-written ICO encoder: ICONDIR + directory entries referencing PNG payloads.
function buildIcoFile(pngPayloads: { size: number; data: ArrayBuffer }[]): Blob {
  const count = pngPayloads.length;
  const headerSize = 6 + count * 16;
  const totalSize = headerSize + pngPayloads.reduce((s, p) => s + p.data.byteLength, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint16(offset, 0, true); offset += 2; // reserved
  view.setUint16(offset, 1, true); offset += 2; // type = icon
  view.setUint16(offset, count, true); offset += 2; // count

  let imageOffset = headerSize;
  pngPayloads.forEach((p) => {
    const dim = p.size >= 256 ? 0 : p.size;
    view.setUint8(offset++, dim); // width (0 = 256)
    view.setUint8(offset++, dim); // height
    view.setUint8(offset++, 0); // color count
    view.setUint8(offset++, 0); // reserved
    view.setUint16(offset, 1, true); offset += 2; // planes
    view.setUint16(offset, 32, true); offset += 2; // bit count
    view.setUint32(offset, p.data.byteLength, true); offset += 4;
    view.setUint32(offset, imageOffset, true); offset += 4;
    imageOffset += p.data.byteLength;
  });

  let dataOffset = headerSize;
  pngPayloads.forEach((p) => {
    new Uint8Array(buffer, dataOffset, p.data.byteLength).set(new Uint8Array(p.data));
    dataOffset += p.data.byteLength;
  });

  return new Blob([buffer], { type: "image/x-icon" });
}

function buildManifest(): string {
  const manifest = {
    name: APP_NAME,
    short_name: APP_NAME,
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
  return JSON.stringify(manifest, null, 2);
}

export default function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [favicons, setFavicons] = useState<{ size: number; url: string }[]>([]);
  const [packaging, setPackaging] = useState(false);

  const handleFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setFavicons([]);
  }, []);

  const generate = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const allSizes = [...new Set([...SIZES, ...PACKAGE_PNG_SIZES, APPLE_SIZE, ...ANDROID_SIZES])];
      const results: { size: number; url: string }[] = [];
      allSizes.forEach((size) => {
        const canvas = renderIconCanvas(img, size);
        const url = canvas.toDataURL("image/png");
        results.push({ size, url });
      });
      setFavicons(results);
    };
    img.src = imageUrl;
  };

  const downloadAll = () => {
    favicons
      .filter(({ size }) => SIZES.includes(size))
      .forEach(({ size, url }) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = `favicon-${size}x${size}.png`;
        a.click();
      });
  };

  const downloadPackage = async () => {
    if (!file) return;
    setPackaging(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error("Failed to load image"));
        im.src = imageUrl;
      });

      const zip = new JSZip();

      // 16/32/48 PNGs
      const icoPayloads: { size: number; data: ArrayBuffer }[] = [];
      for (const size of PACKAGE_PNG_SIZES) {
        const canvas = renderIconCanvas(img, size);
        const blob = await canvasToBlob(canvas);
        zip.file(`favicon-${size}x${size}.png`, blob);
        icoPayloads.push({ size, data: await blob.arrayBuffer() });
      }

      // apple-touch-icon 180x180
      const appleCanvas = renderIconCanvas(img, APPLE_SIZE);
      const appleBlob = await canvasToBlob(appleCanvas);
      zip.file("apple-touch-icon.png", appleBlob);

      // android-chrome 192 + 512
      for (const size of ANDROID_SIZES) {
        const canvas = renderIconCanvas(img, size);
        const blob = await canvasToBlob(canvas);
        zip.file(`android-chrome-${size}x${size}.png`, blob);
      }

      // favicon.ico from 16/32/48 PNG payloads
      const icoBlob = buildIcoFile(icoPayloads);
      zip.file("favicon.ico", icoBlob);

      // site.webmanifest
      zip.file("site.webmanifest", buildManifest());

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favicon-package.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setPackaging(false);
    }
  };

  const findUrl = (size: number) => favicons.find((f) => f.size === size)?.url ?? "";
  const icon16 = findUrl(16);
  const icon180 = findUrl(APPLE_SIZE);

  return (
    <ToolLayout
      title="Favicon Generator"
      description="Generate favicons in multiple sizes from a single image. Square images work best."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Source" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={generate} className="w-full sm:w-auto min-h-[44px]">
              Generate Favicons
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setFile(null); setImageUrl(""); setFavicons([]); }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Reset
            </Button>
          </div>

          {favicons.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3 mb-3">
                {favicons
                  .filter(({ size }) => SIZES.includes(size))
                  .map(({ size, url }) => (
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
                        className="text-xs text-accent hover:underline mt-0.5 p-1 min-h-[32px] flex items-center"
                      >
                        Download
                      </a>
                    </div>
                  ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={downloadAll} className="w-full sm:w-auto min-h-[44px] bg-green-600 hover:opacity-90">
                  <Download className="w-4 h-4" /> Download All
                </Button>
                <Button onClick={downloadPackage} disabled={packaging} className="w-full sm:w-auto min-h-[44px]">
                  <Package className="w-4 h-4" /> {packaging ? "Packaging..." : "Download full package (ZIP)"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Full package: 16/32/48 PNGs, apple-touch-icon (180), android-chrome 192 + 512,
                favicon.ico, site.webmanifest ({APP_NAME}).
              </p>

              {(icon16 || icon180) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <p className="text-xs font-medium px-3 py-2 bg-gray-100 dark:bg-gray-800 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" /> Browser tab preview
                    </p>
                    <div className="p-3 bg-white dark:bg-gray-900">
                      <div className="flex items-end gap-1">
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-t-lg bg-gray-100 dark:bg-gray-800 border border-b-0 border-gray-300 dark:border-gray-700 max-w-[220px]">
                          {icon16 && (
                            <img src={icon16} alt="16px favicon" width={16} height={16} className="shrink-0" />
                          )}
                          <span className="text-xs truncate">{APP_NAME}</span>
                          <span className="text-gray-400 text-xs ml-1">×</span>
                        </div>
                        <div className="flex items-center px-3 py-2 rounded-t-lg bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-gray-400 text-xs max-w-[160px]">
                          <span className="truncate">New Tab</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-b-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <p className="text-xs font-medium px-3 py-2 bg-gray-100 dark:bg-gray-800 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Phone home-screen preview
                    </p>
                    <div className="p-4 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {icon180 && (
                          <img
                            src={icon180}
                            alt="180px app icon"
                            width={72}
                            height={72}
                            className="rounded-[18px] shadow-md"
                          />
                        )}
                        <span className="text-xs text-gray-700 dark:text-gray-200">{APP_NAME}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
