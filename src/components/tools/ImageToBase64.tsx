"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Copy, Check } from "lucide-react";

export default function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [base64, setBase64] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setBase64("");
    setCopied(false);

    const reader = new FileReader();
    reader.onload = () => {
      setBase64(reader.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(base64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = base64;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <ToolLayout
      title="Image to Base64"
      description="Convert any image to a Base64 data URI string."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" />
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <img src={imageUrl} alt="Uploaded" className="w-32 h-32 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
            <div className="text-sm text-gray-500">
              <p>Name: {file.name}</p>
              <p>Size: {formatSize(file.size)}</p>
              <p>Type: {file.type}</p>
              <p>Base64 length: {base64.length.toLocaleString()} chars</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={base64}
              className="w-full h-40 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs font-mono resize-y focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {copied && <p className="text-xs text-green-500">Copied to clipboard!</p>}

          <button
            onClick={() => { setFile(null); setImageUrl(""); setBase64(""); setCopied(false); }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
