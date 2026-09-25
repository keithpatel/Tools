"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { PDFDocument } from "pdf-lib";
import { Tags, ShieldAlert, Sparkles, FileText, CheckCircle2 } from "lucide-react";

export default function PDFMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [creator, setCreator] = useState("");
  const [producer, setProducer] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [modDate, setModDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const { sendOutput } = useWorkflowStore();

  const onFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setError("");
    setResultBlob(null);
    setResultUrl("");

    try {
      const bytes = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      setTitle(pdfDoc.getTitle() || "");
      setAuthor(pdfDoc.getAuthor() || "");
      setSubject(pdfDoc.getSubject() || "");
      setKeywords(pdfDoc.getKeywords() || "");
      setCreator(pdfDoc.getCreator() || "");
      setProducer(pdfDoc.getProducer() || "");

      const cDate = pdfDoc.getCreationDate();
      setCreationDate(cDate ? cDate.toLocaleString() : "Not specified");

      const mDate = pdfDoc.getModificationDate();
      setModDate(mDate ? mDate.toLocaleString() : "Not specified");
    } catch {
      setError("Failed to read PDF metadata. The file may be password protected or corrupted.");
    }
  }, []);

  const stripAllMetadata = () => {
    setTitle("");
    setAuthor("");
    setSubject("");
    setKeywords("");
    setCreator("");
    setProducer("");
  };

  const saveMetadata = async () => {
    if (!file) return;
    setSaving(true);
    setError("");

    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      pdfDoc.setTitle(title.trim());
      pdfDoc.setAuthor(author.trim());
      pdfDoc.setSubject(subject.trim());
      pdfDoc.setCreator(creator.trim());
      pdfDoc.setProducer(producer.trim());

      const kwList = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      pdfDoc.setKeywords(kwList);
      pdfDoc.setModificationDate(new Date());

      const out = await pdfDoc.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const filename = file.name.replace(/\.pdf$/i, "") + "_updated_metadata.pdf";

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));

      sendOutput({
        type: "pdf",
        data: blob,
        filename,
        sourceToolSlug: "pdf-metadata",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setError(err?.message || "Failed to update PDF metadata.");
    } finally {
      setSaving(false);
    }
  };

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.pdf$/i, "") + "_metadata.pdf";
    a.click();
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setAuthor("");
    setSubject("");
    setKeywords("");
    setCreator("");
    setProducer("");
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
          label="Drop your PDF here to view or edit metadata"
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
                  Created: {creationDate} • Modified: {modDate}
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs text-text-secondary hover:text-error transition-colors px-2 py-1"
            >
              Change file
            </button>
          </div>

          {!resultBlob && (
            <div className="p-6 rounded-2xl border border-border-soft bg-surface space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-heading font-semibold">Document Metadata Properties</h3>
                </div>
                <button
                  type="button"
                  onClick={stripAllMetadata}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-error-soft text-error-text hover:bg-error-soft0/15 border border-error-border transition-colors self-start sm:self-auto"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Strip All Metadata (Privacy Mode)
                </button>
              </div>

              {/* Form fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Annual Financial Report"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Author / Creator Name
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Subject / Description
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Summary of quarterly findings"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. finance, report, 2026, taxes"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    Application / Software
                  </label>
                  <input
                    type="text"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    placeholder="e.g. MultiTool PDF Suite"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    PDF Producer
                  </label>
                  <input
                    type="text"
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    placeholder="e.g. pdf-lib"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-soft bg-surface-raised text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </div>
              </div>
            </div>
          )}

          <ResultPanel
            loading={saving}
            loadingLabel="Saving Updated Metadata..."
            error={error}
            onAction={!resultBlob ? saveMetadata : undefined}
            actionLabel="Save & Download PDF"
            onDownload={resultBlob ? download : undefined}
            downloadLabel="Download Updated PDF"
            onReset={resultBlob ? reset : undefined}
            resetLabel="Edit Another PDF"
            sourceToolSlug="pdf-metadata"
            outputType="pdf"
          >
            {resultBlob && (
              <div className="text-center py-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-semibold text-text-primary">
                  PDF Metadata Updated!
                </h4>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  Your PDF properties have been modified and saved directly on your device.
                </p>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
