"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { FilePreview } from "@/components/FilePreview";
import { ResultPanel } from "@/components/ResultPanel";
import { loadPdfLib } from "@/lib/pdf";
import { checkFiles } from "@/lib/fileLimits";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const { sendOutput } = useWorkflowStore();

  const onFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
  }, []);

  const handleReorder = useCallback((newFiles: File[], _newPreviews: string[]) => {
    setFiles(newFiles);
  }, []);

  const removeFile = useCallback((i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const merge = async () => {
    if (files.length < 2) return;
    const limitError = checkFiles(files);
    if (limitError) {
      setError(limitError);
      return;
    }
    setMerging(true);
    setError("");
    try {
      const { PDFDocument } = await loadPdfLib();
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => mergedPdf.addPage(p));
      }
      const out = await mergedPdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      sendOutput({ type: "pdf", data: blob, filename: "merged.pdf", sourceToolSlug: "merge-pdf", createdAt: Date.now() });
    } catch {
      setError("Failed to merge PDFs. One or more files may be corrupted.");
    } finally {
      setMerging(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "merged.pdf";
    a.click();
  };

  const reset = () => {
    setFiles([]);
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      <DropZone onFiles={onFiles} accept=".pdf" multiple label="Drop PDF files here or click to browse" />

      {files.length > 0 && (
        <div className="mt-4">
          <FilePreview
            files={files}
            previews={[]}
            onReorder={handleReorder}
            onRemove={removeFile}
            maxFiles={20}
            maxSizeMB={50}
            acceptLabel="Supports PDF files"
          />
        </div>
      )}

      <ResultPanel
        loading={merging}
        loadingLabel="Merging PDFs..."
        error={error}
        onAction={files.length >= 2 && !resultBlob ? merge : undefined}
        actionLabel="Merge PDFs"
        onDownload={resultBlob ? download : undefined}
        downloadLabel="Download Merged PDF"
        onReset={resultBlob ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="merge-pdf"
        outputType="pdf"
      >
        {resultBlob && (
          <div className="text-sm text-text-secondary dark:text-text-secondary/70 space-y-1">
            <p className="font-medium text-text-primary">PDFs merged successfully</p>
            <p>{files.length} file{files.length !== 1 ? "s" : ""} merged &middot; {(resultBlob.size / 1024).toFixed(1)} KB</p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
