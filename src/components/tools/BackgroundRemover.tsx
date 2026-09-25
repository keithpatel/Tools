"use client";

import { useState, useCallback, type CSSProperties } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Eraser, Download, ShieldCheck } from "lucide-react";

const checkerboard: CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(45deg, #d4d4d4 25%, transparent 25%), linear-gradient(-45deg, #d4d4d4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d4d4 75%), linear-gradient(-45deg, transparent 75%, #d4d4d4 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
};

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl("");
    setError("");
  }, []);

  const handleRemove = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setResultUrl("");
    try {
      setProgress("Downloading AI model on first run…");
      const { removeBackground } = await import("@imgly/background-removal");
      setProgress("Removing background…");
      const blob = await removeBackground(file);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Could not remove the background. Try a photo with a clear, well-lit subject.");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const base = file?.name.replace(/\.[^/.]+$/, "") || "image";
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `bg-removed-${base}.png`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl("");
    setResultUrl("");
    setError("");
    setProgress("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          label="Drop a photo here or click to browse"
          enableCamera
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">Original</p>
              <img
                src={previewUrl}
                alt="Original photo"
                className="rounded-xl w-full max-h-64 sm:max-h-80 object-contain bg-surface border border-border-soft"
              />
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Background removed</p>
              {resultUrl ? (
                <div
                  style={checkerboard}
                  className="rounded-xl border border-border-soft overflow-hidden"
                >
                  <img
                    src={resultUrl}
                    alt="Photo with background removed"
                    className="w-full max-h-64 sm:max-h-80 object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border-soft min-h-[160px] flex items-center justify-center text-sm text-text-secondary px-4 text-center">
                  {loading ? progress || "Processing…" : "Result will appear here"}
                </div>
              )}
            </div>
          </div>

          {!resultUrl && !loading && !error && (
            <div>
              <Button onClick={handleRemove} className="w-full sm:w-auto min-h-[44px]">
                <Eraser className="w-4 h-4" />
                Remove Background
              </Button>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleRemove} className="w-full sm:w-auto min-h-[44px]">
                <Eraser className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={reset}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Choose Different Photo
              </Button>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            AI model downloads once (~40MB) and is cached; your photo never leaves this device.
          </p>
        </div>
      )}

      <ResultPanel
        loading={loading}
        loadingLabel={progress || "Processing…"}
        error={error}
        onReset={file && !loading ? reset : undefined}
        resetLabel="Start Over"
      >
        {resultUrl && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Background removed. The checkerboard shows transparency in the PNG.
            </p>
            <div className="sticky bottom-20 md:static">
              <Button onClick={handleDownload} className="w-full sm:w-auto min-h-[44px]">
                <Download className="w-4 h-4" />
                Download PNG
              </Button>
            </div>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
