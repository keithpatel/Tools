"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download } from "lucide-react";
import exifr from "exifr";

export default function ExifViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [exifData, setExifData] = useState<Record<string, any> | null>(null);
  const [cleanedUrl, setCleanedUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setExifData(null);
    setCleanedUrl("");

    setLoading(true);
    try {
      const data = await exifr.parse(f);
      setExifData(data || {});
    } catch {
      setExifData({});
    }
    setLoading(false);
  }, []);

  const removeExif = () => {
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) setCleanedUrl(URL.createObjectURL(blob));
      }, file.type);
    };
    img.src = imageUrl;
  };

  const formatKey = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  return (
    <ToolLayout
      title="EXIF Viewer"
      description="View and remove EXIF metadata from images."
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" />
      ) : (
        <div className="space-y-4">
          <img src={imageUrl} alt="Uploaded" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800" />

          {loading ? (
            <p className="text-sm text-gray-500">Reading EXIF data...</p>
          ) : (
            <>
              {exifData && Object.keys(exifData).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="text-left p-2 border border-gray-300 dark:border-gray-700 font-medium">Tag</th>
                        <th className="text-left p-2 border border-gray-300 dark:border-gray-700 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(exifData).map(([key, val]) => (
                        <tr key={key} className="border-b border-gray-200 dark:border-gray-800">
                          <td className="p-2 border border-gray-300 dark:border-gray-700 text-gray-500 text-xs">{formatKey(key)}</td>
                          <td className="p-2 border border-gray-300 dark:border-gray-700 font-mono text-xs break-all">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No EXIF data found.</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={removeExif}
                  className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all"
                >
                  Remove EXIF & Export
                </button>
                <button
                  onClick={() => { setFile(null); setImageUrl(""); setExifData(null); setCleanedUrl(""); }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
                >
                  Reset
                </button>
              </div>

              {cleanedUrl && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cleaned (no EXIF)</p>
                  <img src={cleanedUrl} alt="Cleaned" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
                  <a
                    href={cleanedUrl}
                    download={`noexif-${file.name}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download Cleaned
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
