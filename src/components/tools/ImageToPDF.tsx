"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download, FileImage } from "lucide-react";
import { PDFDocument } from "pdf-lib";

export default function ImageToPDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback((fs: File[]) => {
    setFiles(fs);
    setUrls(fs.map((f) => URL.createObjectURL(f)));
    setPdfUrl("");
  }, []);

  const generatePdf = async () => {
    if (files.length === 0) return;
    setLoading(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const buffer = await file.arrayBuffer();

        let image;
        if (file.type === "image/png") {
          image = await pdfDoc.embedPng(buffer);
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(buffer);
        } else {
          const pngBuffer = await convertToPng(buffer, file.type);
          image = await pdfDoc.embedPng(pngBuffer);
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setLoading(false);
  };

  const convertToPng = (buffer: ArrayBuffer, mimeType: string): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer as BlobPart], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          if (!b) { reject(new Error("Conversion failed")); return; }
          b.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
        }, "image/png");
        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  return (
    <ToolLayout
      title="Image to PDF"
      description="Convert multiple images into a single PDF document."
    >
      {files.length === 0 ? (
        <DropZone onFiles={handleFiles} accept="image/*" multiple />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {urls.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  alt={`Page ${i + 1}`}
                  className="w-24 h-24 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
                />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500">{files.length} image(s) selected</p>

          <div className="flex gap-2">
            <button
              onClick={generatePdf}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-all"
            >
              <FileImage className="w-4 h-4" /> {loading ? "Generating..." : "Generate PDF"}
            </button>
            <button
              onClick={() => { setFiles([]); setUrls([]); setPdfUrl(""); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          {pdfUrl && (
            <div>
              <a
                href={pdfUrl}
                download="images.pdf"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
