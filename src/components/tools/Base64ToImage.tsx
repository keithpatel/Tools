"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";
import { Download, Copy, Check, AlertTriangle, Clipboard } from "lucide-react";

const SIZE_WARNING_THRESHOLD = 1_000_000;

export default function Base64ToImage() {
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [mimeType, setMimeType] = useState("image/png");
  const [copyMsg, setCopyMsg] = useState("");
  const [copying, setCopying] = useState(false);

  const validateAndRender = () => {
    setError("");
    setImageUrl("");
    setCopyMsg("");

    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please paste a Base64 data URI.");
      return;
    }

    const match = trimmed.match(/^data:(image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml));base64,(.+)$/i);
    if (!match) {
      setError("Invalid data URI. Expected format: data:image/{format};base64,...");
      return;
    }

    try {
      atob(match[3]);
    } catch {
      setError("Invalid Base64 encoding.");
      return;
    }

    setMimeType(match[1]);
    setImageUrl(trimmed);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const ext = mimeType.split("/")[1]?.replace("+xml", "") || "png";
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `decoded.${ext}`;
    a.click();
  };

  const dataUrlToPngBlob = (dataUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 1;
          canvas.height = img.naturalHeight || 1;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Could not encode PNG"));
          }, "image/png");
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = dataUrl;
    });
  };

  const handleCopyImage = async () => {
    if (!imageUrl) return;
    setCopying(true);
    setCopyMsg("");
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        setCopyMsg("Image copying is not supported in this browser. Use Download instead.");
        return;
      }
      const pngBlob = await dataUrlToPngBlob(imageUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      setCopyMsg("Image copied to clipboard.");
    } catch {
      setCopyMsg("Could not copy the image here. Your browser may block clipboard writes — use Download instead.");
    } finally {
      setCopying(false);
    }
  };

  const showSizeWarning = input.length > SIZE_WARNING_THRESHOLD;

  return (
    <ToolLayout
      title="Base64 to Image"
      description="Decode a Base64 data URI back into an image."
    >
      <div className="space-y-4">
        <textarea
          placeholder="Paste your data:image/...;base64,... string here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {showSizeWarning && (
          <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              This input exceeds ~1MB ({input.length.toLocaleString()} chars). Very large data URIs
              may be slow to render — pasting such a large string into pages is not recommended.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="primary" size="md" onClick={validateAndRender} className="w-full sm:w-auto">
            Render
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => { setInput(""); setImageUrl(""); setError(""); setCopyMsg(""); }}
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {imageUrl && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Decoded Image ({mimeType})</p>
            <img src={imageUrl} alt="Decoded" className="max-h-64 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="primary" size="md" onClick={handleDownload} className="w-full sm:w-auto">
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button variant="secondary" size="md" onClick={handleCopyImage} disabled={copying} className="w-full sm:w-auto">
                {copyMsg === "Image copied to clipboard." ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : copyMsg ? (
                  <Clipboard className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copying ? "Copying..." : "Copy image"}
              </Button>
            </div>
            {copyMsg && (
              <p className={`text-xs mt-2 ${copyMsg === "Image copied to clipboard." ? "text-green-500" : "text-gray-500"}`}>
                {copyMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
