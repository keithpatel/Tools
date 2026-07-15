"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import * as pdfjsLib from "pdfjs-dist";
import { Copy, Check } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function ExtractText() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ page: number; text: string }[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [copied, setCopied] = useState(false);

  const onFiles = useCallback((incoming: File[]) => {
    const f = incoming[0];
    if (f) {
      setFile(f);
      setPages([]);
    }
  }, []);

  const extract = async () => {
    if (!file) return;
    setExtracting(true);
    try {
      const srcBytes = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(srcBytes) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;
      const results: { page: number; text: string }[] = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(" ");
        results.push({ page: i, text });
      }
      setPages(results);
    } finally {
      setExtracting(false);
    }
  };

  const fullText = pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");

  const copyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="Extract Text"
      description="Extract all text content from a PDF file."
    >
      <DropZone onFiles={onFiles} accept=".pdf" label="Drop a PDF here or click to browse" />
      {file && !pages.length && (
        <div className="mt-6">
          <button
            onClick={extract}
            disabled={extracting}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {extracting ? "Extracting..." : "Extract Text"}
          </button>
        </div>
      )}
      {pages.length > 0 && (
        <div className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{pages.length} page{pages.length !== 1 ? "s" : ""} extracted</p>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
          </div>
          <textarea
            className="w-full h-80 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent"
            value={fullText}
            readOnly
          />
          <div className="space-y-4">
            {pages.map((p) => (
              <details key={p.page} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <summary className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 cursor-pointer text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Page {p.page}
                </summary>
                <pre className="px-4 py-3 text-sm whitespace-pre-wrap font-mono text-gray-600 dark:text-gray-400">{p.text || "(no text found)"}</pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
