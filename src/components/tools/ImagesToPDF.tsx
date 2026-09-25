"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { FilePreview } from "@/components/FilePreview";
import { ResultPanel } from "@/components/ResultPanel";
import { PDFDocument } from "pdf-lib";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { useChainInput } from "@/components/ToolPageLayout";

export default function ImagesToPDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const { sendOutput } = useWorkflowStore();
  const chainInput = useChainInput();

  const onFiles = useCallback((incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...images]);
    for (const f of images) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target!.result as string]);
      };
      reader.readAsDataURL(f);
    }
  }, []);

  // Auto-load files from workflow chain input on mount
  useEffect(() => {
    if (!chainInput) return;
    if ("items" in chainInput) {
      const fileList = chainInput.items.map((item) =>
        item.data instanceof File ? item.data : new File([item.data], item.filename)
      );
      if (fileList.length > 0) onFiles(fileList);
    } else if (chainInput.type === "image" && chainInput.data) {
      const file = chainInput.data instanceof File ? chainInput.data : new File([chainInput.data], chainInput.filename);
      onFiles([file]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReorder = useCallback((newFiles: File[], newPreviews: string[]) => {
    setFiles(newFiles);
    setPreviews(newPreviews);
  }, []);

  const remove = useCallback((i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const createPdf = async () => {
    if (files.length === 0) return;
    setCreating(true);
    setError("");
    try {
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isPng = file.type === "image/png";
        const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const { width, height } = img.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(img, { x: 0, y: 0, width, height });
      }
      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      sendOutput({ type: "pdf", data: blob, filename: "images.pdf", sourceToolSlug: "images-to-pdf", createdAt: Date.now() });
    } catch {
      setError("Failed to create PDF. Please check your images and try again.");
    } finally {
      setCreating(false);
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "images.pdf";
    a.click();
  };

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      <div ref={dropzoneRef}>
        <DropZone onFiles={onFiles} accept="image/*" multiple label="Drop images here or click to browse" enableCamera cameraLabel="Take a photo instead" />
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <FilePreview
            files={files}
            previews={previews}
            onReorder={handleReorder}
            onRemove={remove}
            maxFiles={20}
            maxSizeMB={10}
            acceptLabel="Supports PNG, JPG, WebP"
          />
        </div>
      )}

      <ResultPanel
        loading={creating}
        loadingLabel="Creating your PDF..."
        error={error}
        onAction={files.length > 0 && !resultBlob ? createPdf : undefined}
        actionLabel="Create PDF"
        onDownload={resultBlob ? download : undefined}
        downloadLabel="Download PDF"
        onReset={resultBlob ? reset : undefined}
        resetLabel="Start Over"
        sourceToolSlug="images-to-pdf"
        outputType="pdf"
      >
        {resultBlob && (
          <div className="text-sm text-text-secondary dark:text-text-secondary/70 space-y-1">
            <p className="font-medium text-text-primary">PDF created successfully</p>
            <p>{files.length} page{files.length !== 1 ? "s" : ""} &middot; {(resultBlob.size / 1024).toFixed(1)} KB</p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
