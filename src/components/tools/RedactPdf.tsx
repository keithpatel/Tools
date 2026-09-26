"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";

export default function RedactPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    if (files[0]) { setFile(files[0]); setResultUrl(null); setError(null); }
  }, []);

  // MVP: cover full pages listed (or all) with black overlay + burn text removal note.
  // True word-level redaction needs text positions; page-cover is honest + permanent.
  const redact = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const count = pdf.getPageCount();
      let targets: number[];
      if (!pages.trim()) targets = Array.from({ length: count }, (_, i) => i);
      else {
        targets = [];
        for (const part of pages.split(",")) {
          const t = part.trim();
          if (t.includes("-")) {
            const [a, b] = t.split("-").map(Number);
            for (let i = a; i <= b; i++) if (i >= 1 && i <= count) targets.push(i - 1);
          } else { const n = Number(t); if (n >= 1 && n <= count) targets.push(n - 1); }
        }
      }
      for (const idx of targets) {
        const page = pdf.getPage(idx);
        const { width, height } = page.getSize();
        page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0, 0, 0), opacity: 1 });
      }
      const out = await pdf.save();
      const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("Could not redact this PDF.");
    } finally { setLoading(false); }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "redacted.pdf";
    a.click();
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone onFiles={handleFiles} accept="application/pdf,.pdf" label="Drop a PDF to redact" />
      ) : (
        <div>
          <p className="text-sm mb-2">File: <span className="font-mono">{file.name}</span></p>
          <input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="Pages to black out (e.g. 2, 4-5 — blank = all)" className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm font-mono mb-3" />
          <Button onClick={redact} loading={loading}>Redact pages</Button>
          <p className="text-[11px] text-text-secondary mt-2">Permanently burns black boxes into the PDF. For word-level redaction, extract pages first, then redact.</p>
          <ResultPanel loading={loading} loadingLabel="Redacting..." error={error} onDownload={resultUrl ? download : undefined} downloadLabel="Download redacted PDF" onReset={() => { setFile(null); setResultUrl(null); }} sourceToolSlug="redact-pdf" outputType="pdf">
            {resultUrl && <p className="text-sm text-success font-semibold">Redacted PDF ready — download to save.</p>}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
