"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { Download } from "lucide-react";

export default function AddWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("DRAFT");
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.2);
  const [rotation, setRotation] = useState(-45);
  const [processing, setProcessing] = useState(false);

  const onFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (f) setFile(f);
  }, []);

  const apply = async () => {
    if (!file || !text) return;
    setProcessing(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(text, {
          x: width / 2 - (fontSize * text.length) / 4,
          y: height / 2 - fontSize / 2,
          size: fontSize,
          opacity,
          rotate: rotation !== 0 ? degrees(rotation) : undefined,
          color: rgb(0, 0, 0),
        });
      }

      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `watermarked-${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Add Watermark"
      description="Add text watermarks to every page of a PDF."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {file && (
        <div className="mt-6 space-y-4 max-w-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Watermark text</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="DRAFT"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Font size ({fontSize})</label>
            <input type="range" min={12} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Opacity ({(opacity * 100).toFixed(0)}%)</label>
            <input type="range" min={0.05} max={0.8} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rotation ({rotation}°)</label>
            <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-green-600" />
          </div>
          <button
            onClick={apply}
            disabled={processing || !text}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {processing ? "Applying..." : "Apply & Download"}
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
