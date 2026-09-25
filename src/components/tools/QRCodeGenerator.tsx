"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ResultPanel } from "@/components/ResultPanel";
import QRCode from "qrcode";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { Share2, Check } from "lucide-react";

export default function QRCodeGenerator() {
  const [text, setText] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { sendOutput } = useWorkflowStore();

  const generateWithText = async (content: string) => {
    if (!content.trim()) return;
    setError("");
    setLoading(true);
    try {
      const url = await QRCode.toDataURL(content, { width: 400, margin: 2 });
      setDataUrl(url);
      const qrBlob = await (await fetch(url)).blob();
      sendOutput({ type: "image", data: qrBlob, filename: "qrcode.png", sourceToolSlug: "qr-code-generator", createdAt: Date.now() });
    } catch {
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("text");
    if (param) {
      setText(param);
      generateWithText(param);
    }
  }, []);

  const generate = async () => {
    generateWithText(text || " ");
  };

  const copyShareLink = async () => {
    if (typeof window === "undefined" || !text) return;
    const url = new URL(window.location.href);
    url.searchParams.set("text", text);
    await navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  const copyQr = async () => {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  };

  const reset = () => { setText(""); setDataUrl(""); setError(""); };

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Enter text or URL..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        {text && (
          <button
            type="button"
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border bg-surface rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
            title="Share URL with this QR code text"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? "Copied" : "Share"}
          </button>
        )}
      </div>

      <ResultPanel
        loading={loading}
        loadingLabel="Generating QR code..."
        error={error}
        onAction={text && !dataUrl ? generate : undefined}
        actionLabel="Generate QR Code"
        onDownload={dataUrl ? download : undefined}
        downloadLabel="Download PNG"
        onCopy={dataUrl ? copyQr : undefined}
        copyLabel="Copy Image"
        onReset={dataUrl ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="qr-code-generator"
        outputType="image"
      >
        {dataUrl && (
          <div className="flex flex-col items-center">
            <img src={dataUrl} alt="QR Code" className="w-48 h-48 border border-gray-300 dark:border-gray-700 rounded-lg" />
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
