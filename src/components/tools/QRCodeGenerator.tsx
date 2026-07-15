"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ResultPanel } from "@/components/ResultPanel";
import QRCode from "qrcode";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

export default function QRCodeGenerator() {
  const [text, setText] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendOutput } = useWorkflowStore();

  const generate = async () => {
    setError("");
    setLoading(true);
    try {
      const url = await QRCode.toDataURL(text || " ", { width: 400, margin: 2 });
      setDataUrl(url);
      const qrBlob = await (await fetch(url)).blob();
      sendOutput({ type: "image", data: qrBlob, filename: "qrcode.png", sourceToolSlug: "qr-code-generator", createdAt: Date.now() });
    } catch {
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
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
