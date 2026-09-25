"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Copy, Check, AlertTriangle, Code } from "lucide-react";

const SIZE_WARNING_THRESHOLD = 1_000_000;

export default function ImageToBase64() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [base64, setBase64] = useState("");
  const [copied, setCopied] = useState(false);
  const [cssCopied, setCssCopied] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setBase64("");
    setCopied(false);
    setCssCopied(false);

    const reader = new FileReader();
    reader.onload = () => {
      setBase64(reader.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const copyText = async (text: string, onDone: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onDone();
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      onDone();
    }
  };

  const handleCopy = async () => {
    await copyText(base64, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const cssSnippet = base64
    ? `.bg-image {\n  background-image: url("${base64}");\n  background-size: cover;\n  background-repeat: no-repeat;\n}`
    : "";

  const handleCopyCss = async () => {
    if (!cssSnippet) return;
    await copyText(cssSnippet, () => {
      setCssCopied(true);
      setTimeout(() => setCssCopied(false), 2000);
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const showSizeWarning = base64.length > SIZE_WARNING_THRESHOLD;

  return (
    <ToolLayout
      title="Image to Base64"
      description="Convert any image to a Base64 data URI string."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <img src={imageUrl} alt="Uploaded" className="w-32 h-32 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
            <div className="text-sm text-gray-500">
              <p>Name: {file.name}</p>
              <p>Size: {formatSize(file.size)}</p>
              <p>Type: {file.type}</p>
              <p>Base64 length: {base64.length.toLocaleString()} chars</p>
            </div>
          </div>

          {showSizeWarning && (
            <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                This output exceeds ~1MB ({base64.length.toLocaleString()} chars). Embedding this
                large a data URI is not recommended — it bloats CSS/HTML and slows page loads.
                Consider compressing the image first.
              </p>
            </div>
          )}

          <div className="relative">
            <textarea
              readOnly
              value={base64}
              className="w-full h-40 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs font-mono resize-y focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="min-h-[38px] sm:min-h-0 absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {copied && <p className="text-xs text-green-500">Copied to clipboard!</p>}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" size="md" onClick={handleCopy} className="w-full sm:w-auto">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {base64 && (
            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Code className="w-4 h-4" /> CSS snippet
              </p>
              <textarea
                readOnly
                value={cssSnippet}
                className="w-full h-28 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-xs font-mono resize-y focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={handleCopyCss} className="w-full sm:w-auto min-h-[38px] sm:min-h-0">
                {cssCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {cssCopied ? "CSS copied" : "Copy CSS snippet"}
              </Button>
            </div>
          )}

          <button
            onClick={() => { setFile(null); setImageUrl(""); setBase64(""); setCopied(false); setCssCopied(false); }}
            className="min-h-[44px] sm:min-h-0 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
