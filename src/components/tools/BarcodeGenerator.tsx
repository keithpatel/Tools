"use client";

import { useRef, useEffect, useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Download } from "lucide-react";
import JsBarcode from "jsbarcode";

export default function BarcodeGenerator() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [text, setText] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (generated && svgRef.current && text) {
      try {
        JsBarcode(svgRef.current, text, { format: "CODE128" });
      } catch {
        // ignore barcode errors
      }
    }
  }, [generated, text]);

  const generate = () => {
    if (!text) return;
    setGenerated(true);
  };

  const download = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="Barcode Generator"
      description="Generate barcodes for any data."
      faq={[
        { q: "What format is used?", a: "Barcodes are generated using CODE128 encoding." },
        { q: "Can I scan these barcodes?", a: "Yes, they are standard barcodes scannable by any barcode reader." },
      ]}
    >
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Enter barcode content..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <button onClick={generate} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Generate</button>
      </div>
      {generated && text && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <svg ref={svgRef} className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white" />
          <button onClick={download} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Download SVG
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
