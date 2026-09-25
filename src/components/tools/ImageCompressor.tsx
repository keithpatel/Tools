"use client";

import { useState, useCallback, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { Image as ImageIcon, Download, Archive } from "lucide-react";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { useChainInput } from "@/components/ToolPageLayout";

type CompressMode = "quality" | "target";
type OutputFormat = "keep" | "image/jpeg" | "image/png" | "image/webp";

const OUTPUT_FORMATS: { label: string; value: OutputFormat }[] = [
  { label: "Keep original", value: "keep" },
  { label: "JPG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WebP", value: "image/webp" },
];

interface BatchItem {
  id: string;
  file: File;
  url: string;
  compressed: Blob | null;
  compressedUrl: string;
  error: string;
}

export default function ImageCompressor() {
  const [original, setOriginal] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [compressed, setCompressed] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [quality, setQuality] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<CompressMode>("quality");
  const [targetKB, setTargetKB] = useState(200);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("keep");
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const { sendOutput } = useWorkflowStore();
  const chainInput = useChainInput();

  // Auto-load file from workflow chain input on mount
  useEffect(() => {
    if (!chainInput) return;
    if ("items" in chainInput) {
      const first = chainInput.items[0];
      if (first) {
        const file = first.data instanceof File ? first.data : new File([first.data], first.filename);
        handleFiles([file]);
      }
    } else if (chainInput.type === "image" && chainInput.data) {
      const file = chainInput.data instanceof File ? chainInput.data : new File([chainInput.data], chainInput.filename);
      handleFiles([file]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const picked = images.length > 0 ? images : files;
    const file = picked[0];
    if (!file) return;
    setOriginal(file);
    setOriginalUrl(URL.createObjectURL(file));
    setCompressed(null);
    setCompressedUrl("");
    setError("");
    if (picked.length > 1) {
      setBatch(
        picked.map((f, i) => ({
          id: `${Date.now()}-${i}-${f.name}`,
          file: f,
          url: URL.createObjectURL(f),
          compressed: null,
          compressedUrl: "",
          error: "",
        }))
      );
    } else {
      setBatch([]);
    }
  }, []);

  const compressOnce = async (file: File, quality01: number, fileType?: string) => {
    return imageCompression(file, {
      maxSizeMB: 10,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: quality01,
      ...(fileType ? { fileType } : {}),
    });
  };

  const compressToTarget = async (file: File, targetBytes: number, fileType?: string) => {
    let lo = 0.05;
    let hi = 0.95;
    let best: Blob | null = null;
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      const result = await compressOnce(file, mid, fileType);
      if (result.size <= targetBytes) {
        best = result;
        lo = mid;
        if (hi - lo < 0.01) break;
      } else {
        hi = mid;
      }
    }
    if (best) return best;
    return compressOnce(file, lo, fileType);
  };

  const resolveFileType = () => (outputFormat === "keep" ? undefined : outputFormat);

  const outputName = (name: string) => {
    if (outputFormat === "keep") return `compressed-${name}`;
    const ext = outputFormat === "image/jpeg" ? "jpg" : outputFormat === "image/png" ? "png" : "webp";
    return `compressed-${name.replace(/\.[^.]+$/, "")}.${ext}`;
  };

  const handleCompress = async () => {
    if (!original) return;
    setLoading(true);
    setError("");
    try {
      const fileType = resolveFileType();
      const result =
        mode === "quality"
          ? await compressOnce(original, quality / 100, fileType)
          : await compressToTarget(original, Math.max(1, targetKB) * 1024, fileType);
      setCompressed(result);
      setCompressedUrl(URL.createObjectURL(result));
      sendOutput({ type: "image", data: result, filename: outputName(original.name), sourceToolSlug: "image-compressor", createdAt: Date.now() });
    } catch {
      setError("Failed to compress image. Try a different quality setting.");
    }
    setLoading(false);
  };

  const handleCompressBatch = async () => {
    if (batch.length === 0) return;
    setBatchLoading(true);
    setError("");
    const fileType = resolveFileType();
    const targetBytes = Math.max(1, targetKB) * 1024;
    for (const item of batch) {
      try {
        const result =
          mode === "quality"
            ? await compressOnce(item.file, quality / 100, fileType)
            : await compressToTarget(item.file, targetBytes, fileType);
        const url = URL.createObjectURL(result);
        setBatch((prev) => prev.map((b) => (b.id === item.id ? { ...b, compressed: result, compressedUrl: url, error: "" } : b)));
      } catch {
        setBatch((prev) => prev.map((b) => (b.id === item.id ? { ...b, error: "Failed to compress this file." } : b)));
      }
    }
    setBatchLoading(false);
  };

  const downloadBatchItem = (item: BatchItem) => {
    if (!item.compressedUrl) return;
    const a = document.createElement("a");
    a.href = item.compressedUrl;
    a.download = outputName(item.file.name);
    a.click();
  };

  const downloadAllAsZip = async () => {
    const done = batch.filter((b) => b.compressed);
    if (done.length === 0) return;
    setZipLoading(true);
    try {
      const zip = new JSZip();
      for (const item of done) {
        const buf = await item.compressed!.arrayBuffer();
        zip.file(outputName(item.file.name), buf);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = "compressed-images.zip";
      a.click();
      URL.revokeObjectURL(zipUrl);
    } finally {
      setZipLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const reset = () => {
    setOriginal(null);
    setOriginalUrl("");
    setCompressed(null);
    setCompressedUrl("");
    setError("");
    setBatch([]);
    setBatchLoading(false);
  };

  const batchDone = batch.filter((b) => b.compressed).length;

  return (
    <ToolLayout title="" description="">
      {!original ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple label="Drop image(s) here or click to browse" enableCamera />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">Original ({formatSize(original.size)})</p>
              <img src={originalUrl} alt="Original" className="rounded-lg max-h-48 object-contain bg-surface-hover checkerboard" />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">
                {compressed ? `Compressed (${formatSize(compressed.size)})` : "Compressed"}
              </p>
              {compressed ? (
                <img src={compressedUrl} alt="Compressed" className="rounded-lg max-h-48 object-contain bg-surface-hover checkerboard" />
              ) : (
                <div className="h-full flex items-center justify-center text-text-secondary/70 text-sm border-2 border-dashed border-border rounded-lg">
                  <ImageIcon className="w-6 h-6 mr-2" /> Preview
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={mode === "quality" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("quality")}
              className="min-h-[44px] sm:min-h-0"
            >
              Quality
            </Button>
            <Button
              variant={mode === "target" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("target")}
              className="min-h-[44px] sm:min-h-0"
            >
              Target size
            </Button>
          </div>

          {mode === "quality" ? (
            <div>
              <label className="text-sm font-medium">Quality: {quality}%</label>
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full mt-1 accent-accent"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Target size (KB)</label>
              <input
                type="number"
                min={1}
                value={targetKB}
                onChange={(e) => setTargetKB(Number(e.target.value))}
                className="w-full sm:w-40 p-2 border border-border rounded-lg bg-surface text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
              />
              <p className="text-xs text-text-secondary mt-1">Quality is auto-tuned to land at or under this size.</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Output format</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="w-full p-2 border border-border rounded-lg bg-surface text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              {OUTPUT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {batch.length > 1 && (
            <div className="space-y-2 border-t border-border-soft pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-sm font-medium">
                  Batch ({batch.length} files{batchDone > 0 ? `, ${batchDone} compressed` : ""})
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                  <Button variant="secondary" size="sm" onClick={handleCompressBatch} disabled={batchLoading} className="min-h-[44px] sm:min-h-0">
                    {batchLoading ? "Compressing..." : "Compress all"}
                  </Button>
                  {batchDone > 0 && (
                    <Button variant="outline" size="sm" onClick={downloadAllAsZip} disabled={zipLoading} className="min-h-[44px] sm:min-h-0">
                      <Archive className="w-4 h-4" /> {zipLoading ? "Zipping..." : "Download all as ZIP"}
                    </Button>
                  )}
                </div>
              </div>
              {batch.map((item) => {
                const saved = item.compressed ? ((1 - item.compressed.size / item.file.size) * 100).toFixed(1) : null;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm p-2 rounded-lg bg-surface-hover"
                  >
                    <span className="font-medium truncate flex-1">{item.file.name}</span>
                    <span className="text-xs text-text-secondary">
                      {formatSize(item.file.size)}
                      {item.compressed ? ` -> ${formatSize(item.compressed.size)} (${saved}% saved)` : ""}
                    </span>
                    {item.error && <span className="text-xs text-error-text">{item.error}</span>}
                    {item.compressedUrl && (
                      <Button variant="ghost" size="sm" onClick={() => downloadBatchItem(item)} className="min-h-[44px] sm:min-h-0">
                        <Download className="w-4 h-4" /> Download
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!compressed && !loading && original && (
        <div className="mt-4">
          <ResultPanel
            loading={loading || batchLoading}
            loadingLabel="Compressing image..."
            error={error}
            onAction={original ? handleCompress : undefined}
            actionLabel="Compress Image"
          />
        </div>
      )}

      <ResultPanel
        loading={loading}
        loadingLabel="Compressing image..."
        error={error}
        onDownload={compressed && compressedUrl ? () => {
          const a = document.createElement("a");
          a.href = compressedUrl;
          a.download = outputName(original?.name || "image");
          a.click();
        } : undefined}
        downloadLabel="Download Compressed"
        onReset={compressed ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="image-compressor"
        outputType="image"
      >
        {compressed && (
          <div className="text-sm text-text-secondary dark:text-text-secondary/70 space-y-1">
            <p className="font-medium text-text-primary">Compression complete</p>
            <p>Original: {original && formatSize(original.size)} &rarr; Compressed: {formatSize(compressed.size)}</p>
            <p className="text-success">{original && ((1 - compressed.size / original.size) * 100).toFixed(1)}% reduction</p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
