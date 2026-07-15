"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Download } from "lucide-react";

export default function Base64ToImage() {
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [mimeType, setMimeType] = useState("image/png");

  const validateAndRender = () => {
    setError("");
    setImageUrl("");

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

        <div className="flex gap-2">
          <button
            onClick={validateAndRender}
            className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all"
          >
            Render
          </button>
          <button
            onClick={() => { setInput(""); setImageUrl(""); setError(""); }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
          >
            Clear
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {imageUrl && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Decoded Image ({mimeType})</p>
            <img src={imageUrl} alt="Decoded" className="max-h-64 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
