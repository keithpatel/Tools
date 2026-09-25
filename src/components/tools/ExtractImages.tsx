"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { Download, Image as ImageIcon, Filter, FileText, CheckCircle2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface ExtractedImage {
  id: string;
  src: string;
  width: number;
  height: number;
  page: number;
  blob: Blob;
  sizeBytes: number;
}

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [filterMinSize, setFilterMinSize] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [error, setError] = useState("");
  const { sendOutput } = useWorkflowStore();

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    setError("");
    setImages([]);

    try {
      const bytes = await f.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const found: ExtractedImage[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const ops = await page.getOperatorList();

        for (let i = 0; i < ops.fnArray.length; i++) {
          const fn = ops.fnArray[i];
          const args = ops.argsArray[i];

          // Check for paintImageXObject or paintInlineImageXObject
          if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
            const objId = args[0];
            try {
              // Retrieve image data from page resources
              page.objs.get(objId, (imgObj: any) => {
                if (!imgObj) return;

                let canvas: HTMLCanvasElement | null = null;
                if (imgObj.bitmap) {
                  canvas = document.createElement("canvas");
                  canvas.width = imgObj.bitmap.width;
                  canvas.height = imgObj.bitmap.height;
                  const ctx = canvas.getContext("2d");
                  ctx?.drawImage(imgObj.bitmap, 0, 0);
                } else if (imgObj.data) {
                  canvas = document.createElement("canvas");
                  canvas.width = imgObj.width;
                  canvas.height = imgObj.height;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    const imgData = ctx.createImageData(imgObj.width, imgObj.height);
                    if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
                      imgData.data.set(imgObj.data);
                    } else if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
                      // RGB to RGBA
                      let srcIdx = 0;
                      let dstIdx = 0;
                      for (let p = 0; p < imgObj.width * imgObj.height; p++) {
                        imgData.data[dstIdx++] = imgObj.data[srcIdx++];
                        imgData.data[dstIdx++] = imgObj.data[srcIdx++];
                        imgData.data[dstIdx++] = imgObj.data[srcIdx++];
                        imgData.data[dstIdx++] = 255;
                      }
                    } else if (imgObj.data.length === imgObj.width * imgObj.height) {
                      // Grayscale to RGBA
                      let dstIdx = 0;
                      for (let p = 0; p < imgObj.data.length; p++) {
                        const val = imgObj.data[p];
                        imgData.data[dstIdx++] = val;
                        imgData.data[dstIdx++] = val;
                        imgData.data[dstIdx++] = val;
                        imgData.data[dstIdx++] = 255;
                      }
                    }
                    ctx.putImageData(imgData, 0, 0);
                  }
                }

                if (canvas && canvas.width > 20 && canvas.height > 20) {
                  canvas.toBlob((blob) => {
                    if (blob) {
                      found.push({
                        id: `${pageNum}_${objId}_${found.length}`,
                        src: URL.createObjectURL(blob),
                        width: canvas!.width,
                        height: canvas!.height,
                        page: pageNum,
                        blob,
                        sizeBytes: blob.size,
                      });
                      setImages([...found]);
                    }
                  }, "image/png");
                }
              });
            } catch {
              // Ignore single image read error and continue
            }
          }
        }
      }

      // If no internal XObjects were found, offer high-quality page frame export
      if (found.length === 0) {
        for (let i = 1; i <= Math.min(totalPages, 15); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
          if (blob) {
            found.push({
              id: `page_${i}`,
              src: canvas.toDataURL(),
              width: canvas.width,
              height: canvas.height,
              page: i,
              blob,
              sizeBytes: blob.size,
            });
          }
        }
        setImages([...found]);
      }
    } catch {
      setError("Failed to extract images from PDF. The file may be password protected or corrupted.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredImages = images.filter(
    (img) => Math.max(img.width, img.height) >= filterMinSize
  );

  const downloadSingle = (img: ExtractedImage) => {
    const a = document.createElement("a");
    a.href = img.src;
    a.download = `extracted_p${img.page}_${img.width}x${img.height}.png`;
    a.click();
  };

  const downloadAllZip = async () => {
    if (filteredImages.length === 0) return;
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < filteredImages.length; i++) {
        const img = filteredImages[i];
        zip.file(`image_p${img.page}_${i + 1}_${img.width}x${img.height}.png`, img.blob);
      }
      const zipContent = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipContent);
      a.download = (file?.name || "extracted_images").replace(/\.pdf$/i, "") + "_images.zip";
      a.click();

      sendOutput({
        type: "image",
        data: filteredImages[0].blob,
        filename: "extracted_image_1.png",
        sourceToolSlug: "extract-images",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to create ZIP package.");
    } finally {
      setDownloadingZip(false);
    }
  };

  const reset = () => {
    setFile(null);
    setImages([]);
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your PDF here to extract all embedded images"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-soft bg-surface">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-text-secondary">
                  {images.length} images extracted • {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-text-secondary hover:text-error transition-colors px-2 py-1"
            >
              Change file
            </button>
          </div>

          {loading && (
            <div className="text-center py-12 text-sm text-text-secondary">
              Scanning document and extracting high-resolution images...
            </div>
          )}

          {!loading && images.length > 0 && (
            <div className="p-5 rounded-2xl border border-border-soft bg-surface space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-heading font-semibold">
                    Extracted Images ({filteredImages.length})
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {/* Size Filter */}
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Filter className="w-3.5 h-3.5" />
                    <select
                      value={filterMinSize}
                      onChange={(e) => setFilterMinSize(parseInt(e.target.value, 10))}
                      className="px-2 py-1 rounded-lg border border-border-soft bg-surface-raised text-text-primary text-xs"
                    >
                      <option value={0}>All sizes</option>
                      <option value={150}>Larger than 150px</option>
                      <option value={300}>Photos only (&gt; 300px)</option>
                    </select>
                  </div>

                  <button
                    onClick={downloadAllZip}
                    disabled={downloadingZip || filteredImages.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingZip ? "Creating ZIP..." : "Download All (ZIP)"}
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[520px] overflow-y-auto p-1">
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl border border-border-soft bg-surface-raised p-2 overflow-hidden hover:border-accent/40 transition-all flex flex-col"
                  >
                    <div className="relative aspect-video sm:aspect-square bg-checkerboard rounded-lg overflow-hidden flex items-center justify-center bg-black/5 dark:bg-surface/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={`Extracted from page ${img.page}`}
                        className="max-h-full max-w-full object-contain"
                      />
                      {/* Download hover button */}
                      <button
                        onClick={() => downloadSingle(img)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        title="Download image"
                      >
                        <div className="p-2 rounded-full bg-accent text-white shadow-lg">
                          <Download className="w-4 h-4" />
                        </div>
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-text-secondary">
                      <span>Page {img.page}</span>
                      <span className="font-mono">{img.width}×{img.height}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && images.length === 0 && !error && (
            <div className="text-center py-12 text-sm text-text-secondary">
              No embedded images found in this document.
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-error-soft border border-error-border text-error-text text-xs">
              {error}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
