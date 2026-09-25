"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";
import { Download, MapPin, Trash2, Archive, FileText } from "lucide-react";
import exifr from "exifr";
import JSZip from "jszip";

interface CleanedResult {
  name: string;
  url: string;
  blob: Blob;
}

const EDITABLE_FIELDS = ["Artist", "Copyright", "ImageDescription"] as const;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildXmpSidecar(fields: Record<string, string>, sourceName: string): string {
  const artist = escapeXml(fields.Artist ?? "");
  const copyright = escapeXml(fields.Copyright ?? "");
  const description = escapeXml(fields.ImageDescription ?? "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="ImageTools">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
    <rdf:Description rdf:about="${escapeXml(sourceName)}">
      <dc:creator><rdf:Seq><rdf:li>${artist}</rdf:li></rdf:Seq></dc:creator>
      <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${copyright}</rdf:li></rdf:Alt></dc:rights>
      <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${description}</rdf:li></rdf:Alt></dc:description>
      <xmp:CreatorTool>ImageTools ExifViewer</xmp:CreatorTool>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
`;
}

function stripImageToBlob(file: File, imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas export failed"));
        },
        file.type || "image/jpeg"
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

export default function ExifViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [exifData, setExifData] = useState<Record<string, unknown> | null>(null);
  const [cleanedUrl, setCleanedUrl] = useState("");
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({
    Artist: "",
    Copyright: "",
    ImageDescription: "",
  });
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchResults, setBatchResults] = useState<CleanedResult[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const handleFiles = useCallback(async (incoming: File[]) => {
    const f = incoming[0];
    if (!f) return;
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setExifData(null);
    setCleanedUrl("");
    setCleanedBlob(null);
    setEditedFields({ Artist: "", Copyright: "", ImageDescription: "" });

    setLoading(true);
    try {
      const data = await exifr.parse(f);
      const record = (data || {}) as Record<string, unknown>;
      setExifData(record);
      setEditedFields({
        Artist: typeof record.Artist === "string" ? record.Artist : "",
        Copyright: typeof record.Copyright === "string" ? record.Copyright : "",
        ImageDescription:
          typeof record.ImageDescription === "string" ? record.ImageDescription : "",
      });
    } catch {
      setExifData({});
    }
    setLoading(false);
  }, []);

  const handleBatchFiles = useCallback((incoming: File[]) => {
    setBatchFiles(incoming);
    setBatchResults([]);
  }, []);

  const removeExif = async () => {
    if (!file) return;
    const blob = await stripImageToBlob(file, imageUrl);
    setCleanedBlob(blob);
    setCleanedUrl(URL.createObjectURL(blob));
  };

  const stripLocation = async () => {
    await removeExif();
  };

  const downloadXmpSidecar = () => {
    if (!file) return;
    const xmp = buildXmpSidecar(editedFields, file.name);
    const blob = new Blob([xmp], { type: "application/rdf+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = file.name.replace(/\.[^.]+$/, "");
    a.download = `${base}.xmp`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const batchStrip = async () => {
    if (batchFiles.length === 0) return;
    setBatchProcessing(true);
    try {
      const out: CleanedResult[] = [];
      for (const f of batchFiles) {
        const url = URL.createObjectURL(f);
        try {
          const blob = await stripImageToBlob(f, url);
          out.push({
            name: `noexif-${f.name.replace(/\.[^.]+$/, "")}.png`,
            url: URL.createObjectURL(blob),
            blob,
          });
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      setBatchResults(out);
    } finally {
      setBatchProcessing(false);
    }
  };

  const downloadBatchZip = async () => {
    if (batchResults.length === 0) return;
    const zip = new JSZip();
    batchResults.forEach((r) => {
      zip.file(r.name, r.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exif-stripped-batch.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const formatKey = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  const gpsLat =
    exifData && typeof exifData["GPSLatitude"] === "number"
      ? (exifData["GPSLatitude"] as number)
      : exifData && typeof exifData["latitude"] === "number"
        ? (exifData["latitude"] as number)
        : null;
  const gpsLon =
    exifData && typeof exifData["GPSLongitude"] === "number"
      ? (exifData["GPSLongitude"] as number)
      : exifData && typeof exifData["longitude"] === "number"
        ? (exifData["longitude"] as number)
        : null;
  const hasGps = gpsLat !== null && gpsLon !== null;
  const osmUrl =
    hasGps === true
      ? `https://www.openstreetmap.org/?mlat=${gpsLat}&mlon=${gpsLon}#map=15/${gpsLat}/${gpsLon}`
      : "";

  return (
    <ToolLayout
      title="EXIF Viewer"
      description="View and remove EXIF metadata from images. Canvas re-encode drops ALL EXIF, so text edits are exported as an XMP sidecar."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Uploaded" className="max-h-48 rounded-lg object-contain bg-surface-hover checkerboard" />

          {loading ? (
            <p className="text-sm text-text-secondary">Reading EXIF data...</p>
          ) : (
            <>
              {exifData && Object.keys(exifData).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-surface-hover checkerboard">
                        <th className="text-left p-2 border border-border font-medium">Tag</th>
                        <th className="text-left p-2 border border-border font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(exifData).map(([key, val]) => (
                        <tr key={key} className="border-b border-border-soft dark:border-border-soft">
                          <td className="p-2 border border-border text-text-secondary text-xs">{formatKey(key)}</td>
                          <td className="p-2 border border-border font-mono text-xs break-all">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No EXIF data found.</p>
              )}

              {hasGps && (
                <div className="p-4 rounded-lg border border-warning-border bg-warning-soft space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Location found in EXIF
                  </p>
                  <p className="text-sm font-mono">
                    {gpsLat}, {gpsLon}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={osmUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors min-h-[44px] sm:min-h-0"
                    >
                      <MapPin className="w-4 h-4" /> View on OpenStreetMap
                    </a>
                    <Button onClick={stripLocation} className="w-full sm:w-auto min-h-[44px] bg-error hover:opacity-90">
                      <Trash2 className="w-4 h-4" /> Strip location data
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-surface-hover checkerboard space-y-3">
                <p className="text-sm font-medium">Edit writable text fields</p>
                <p className="text-xs text-text-secondary">
                  Browsers cannot rewrite JPEG EXIF segments without a segment writer; canvas
                  re-encode always drops metadata. Your edits are saved to an XMP sidecar file
                  alongside the cleaned image.
                </p>
                {EDITABLE_FIELDS.map((field) => (
                  <div key={field}>
                    <label className="text-xs font-medium">{field}</label>
                    <input
                      value={editedFields[field] ?? ""}
                      onChange={(e) =>
                        setEditedFields((prev) => ({ ...prev, [field]: e.target.value }))
                      }
                      placeholder={`Enter ${field}`}
                      className="w-full p-2.5 sm:p-2 border border-border rounded-lg bg-surface text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent mt-1"
                    />
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={downloadXmpSidecar} variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                    <FileText className="w-4 h-4" /> Download .xmp sidecar with your edits
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={removeExif} className="w-full sm:w-auto min-h-[44px]">
                  Remove all EXIF
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setFile(null); setImageUrl(""); setExifData(null); setCleanedUrl(""); setCleanedBlob(null); }}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Reset
                </Button>
              </div>

              {cleanedUrl && (
                <div>
                  <p className="text-xs text-text-secondary mb-1">Cleaned (no EXIF)</p>
                  <img src={cleanedUrl} alt="Cleaned" className="max-h-48 rounded-lg object-contain bg-surface-hover checkerboard mb-2" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={cleanedUrl}
                      download={`noexif-${file.name}`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium transition-colors min-h-[44px]"
                    >
                      <Download className="w-4 h-4" /> Download cleaned image
                    </a>
                    <Button onClick={downloadXmpSidecar} variant="secondary" className="w-full sm:w-auto min-h-[44px]">
                      <FileText className="w-4 h-4" /> Download .xmp sidecar
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border-soft dark:border-border-soft space-y-3">
        <h3 className="text-sm font-semibold">Batch strip EXIF</h3>
        <p className="text-xs text-text-secondary">Strip metadata from multiple images at once, then download individually or as a ZIP.</p>
        <DropZone onFiles={handleBatchFiles} accept="image/*" multiple label="Drop multiple images here to batch-strip" />
        {batchFiles.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-secondary">{batchFiles.length} file(s) selected.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={batchStrip} disabled={batchProcessing} className="w-full sm:w-auto min-h-[44px]">
                {batchProcessing ? "Stripping..." : `Strip ${batchFiles.length} file(s)`}
              </Button>
              {batchResults.length > 0 && (
                <Button onClick={downloadBatchZip} className="w-full sm:w-auto min-h-[44px] bg-brand-600 hover:opacity-90">
                  <Archive className="w-4 h-4" /> Download ZIP
                </Button>
              )}
            </div>
            {batchResults.length > 0 && (
              <ul className="space-y-1.5">
                {batchResults.map((r, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="truncate flex-1 text-text-secondary">{r.name}</span>
                    <a href={r.url} download={r.name} className="inline-flex items-center gap-1 text-xs text-accent hover:underline p-2 min-h-[36px]">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
