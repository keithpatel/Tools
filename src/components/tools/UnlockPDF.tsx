"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Unlock, Eye, EyeOff, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function UnlockPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const { sendOutput } = useWorkflowStore();

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setResultBlob(null);
    setResultUrl("");
    setError("");

    try {
      const bytes = await f.arrayBuffer();
      // Try opening with PDF.js to check if it asks for a password
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
      loadingTask.onPassword = () => {
        setNeedsPassword(true);
      };
      await loadingTask.promise;
      // If succeeded without prompting, it might be permission-restricted or normal
      setNeedsPassword(false);
    } catch (err: any) {
      if (err?.name === "PasswordException") {
        setNeedsPassword(true);
      }
    }
  }, []);

  const handleUnlock = async () => {
    if (!file) return;
    setUnlocking(true);
    setError("");

    try {
      const buffer = await file.arrayBuffer();

      if (!needsPassword) {
        // Try direct strip using pdf-lib ignoreEncryption
        try {
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          const outBytes = await pdfDoc.save();
          const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
          finishUnlock(blob);
          return;
        } catch {
          // If load failed, fall back to PDF.js
        }
      }

      // Unlock through PDF.js with user password
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        password,
      });

      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // Reconstruct clean unlocked PDF document
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        // Render at 2.0 scale (144-150 DPI) for crisp document fidelity
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, viewport }).promise;

        const pngUrl = canvas.toDataURL("image/png");
        const pngBytes = await fetch(pngUrl).then((r) => r.arrayBuffer());
        const embeddedImage = await newPdf.embedPng(pngBytes);

        // Convert back to original 72 DPI PDF point size
        const origViewport = page.getViewport({ scale: 1.0 });
        const pdfPage = newPdf.addPage([origViewport.width, origViewport.height]);
        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });
      }

      const out = await newPdf.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      finishUnlock(blob);
    } catch (err: any) {
      if (err?.name === "PasswordException") {
        setError("Incorrect password. Please verify and try again.");
      } else {
        setError(err?.message || "Failed to unlock PDF. The file may be corrupted.");
      }
    } finally {
      setUnlocking(false);
    }
  };

  const finishUnlock = (blob: Blob) => {
    const filename = (file?.name || "document").replace(/\.pdf$/i, "") + "_unlocked.pdf";
    setResultBlob(blob);
    setResultUrl(URL.createObjectURL(blob));

    sendOutput({
      type: "pdf",
      data: blob,
      filename,
      sourceToolSlug: "unlock-pdf",
      createdAt: Date.now(),
    });
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_unlocked.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPassword("");
    setNeedsPassword(false);
    setResultBlob(null);
    setResultUrl("");
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept=".pdf"
          multiple={false}
          label="Drop your locked or restricted PDF here"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-soft bg-surface">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-text-secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-text-secondary hover:text-red-500 transition-colors px-2 py-1"
            >
              Change file
            </button>
          </div>

          {!resultBlob && (
            <div className="p-6 rounded-2xl border border-border-soft bg-surface space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-border-soft">
                <Unlock className="w-5 h-5 text-accent" />
                <h3 className="text-sm font-heading font-semibold">Unlock & Decrypt</h3>
              </div>

              {needsPassword ? (
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Enter Document Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password to open this PDF"
                      className="w-full pr-10 pl-3 py-2.5 text-sm rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1.5">
                    This file is encrypted with an open password. Once unlocked, the password will be permanently removed.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-accent/5 border border-accent/15">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div className="text-xs text-text-secondary">
                    <strong className="text-text-primary block mb-0.5">Permission Unlock Ready</strong>
                    This PDF does not require an open password, but may contain editing, printing, or copying restrictions. Click Unlock to generate a clean, restriction-free version.
                  </div>
                </div>
              )}

              {/* Legal disclosure requirement */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-raised border border-border-soft text-text-secondary text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Notice: Only unlock PDF files that you own or have authorized permission to remove restrictions from.
                </span>
              </div>
            </div>
          )}

          <ResultPanel
            loading={unlocking}
            loadingLabel="Unlocking & Decrypting Document..."
            error={error}
            onAction={!resultBlob ? handleUnlock : undefined}
            actionLabel="Unlock PDF"
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Unlocked PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Unlock Another PDF"
            sourceToolSlug="unlock-pdf"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Unlock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  PDF Successfully Unlocked!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  All passwords and permission restrictions have been removed. You can now edit, print, and copy freely.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
