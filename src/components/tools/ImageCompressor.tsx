"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import imageCompression from "browser-image-compression";
import { Image as ImageIcon } from "lucide-react";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

export default function ImageCompressor() {
  const [original, setOriginal] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [compressed, setCompressed] = useState<Blob | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [quality, setQuality] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { sendOutput } = useWorkflowStore();

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0];
    setOriginal(file);
    setOriginalUrl(URL.createObjectURL(file));
    setCompressed(null);
    setCompressedUrl("");
    setError("");
  }, []);

  const handleCompress = async () => {
    if (!original) return;
    setLoading(true);
    setError("");
    try {
      const result = await imageCompression(original, {
        maxSizeMB: 10,
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        initialQuality: quality / 100,
      });
      setCompressed(result);
      setCompressedUrl(URL.createObjectURL(result));
      sendOutput({ type: "image", data: result, filename: `compressed-${original.name}`, sourceToolSlug: "image-compressor", createdAt: Date.now() });
    } catch {
      setError("Failed to compress image. Try a different quality setting.");
    }
    setLoading(false);
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
  };

  return (
    <ToolLayout title="" description="">
      {!original ? (
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop an image here or click to browse" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Original ({formatSize(original.size)})</p>
              <img src={originalUrl} alt="Original" className="rounded-lg max-h-48 object-contain bg-gray-100 dark:bg-gray-800" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {compressed ? `Compressed (${formatSize(compressed.size)})` : "Compressed"}
              </p>
              {compressed ? (
                <img src={compressedUrl} alt="Compressed" className="rounded-lg max-h-48 object-contain bg-gray-100 dark:bg-gray-800" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <ImageIcon className="w-6 h-6 mr-2" /> Preview
                </div>
              )}
            </div>
          </div>

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
        </div>
      )}

      {!compressed && !loading && original && (
        <div className="mt-4">
          <ResultPanel
            loading={loading}
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
          a.download = `compressed-${original?.name}`;
          a.click();
        } : undefined}
        downloadLabel="Download Compressed"
        onReset={compressed ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="image-compressor"
        outputType="image"
      >
        {compressed && (
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-medium text-gray-700 dark:text-gray-300">Compression complete</p>
            <p>Original: {original && formatSize(original.size)} &rarr; Compressed: {formatSize(compressed.size)}</p>
            <p className="text-green-600">{original && ((1 - compressed.size / original.size) * 100).toFixed(1)}% reduction</p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
