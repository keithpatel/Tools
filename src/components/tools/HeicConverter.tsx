"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";

export default function HeicConverter() {
  const [urls, setUrls] = useState<{ name: string; url: string }[]>([]);
  const [format, setFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null); setLoading(true);
    try {
      const heic2any = (await import("heic2any")).default;
      const out: { name: string; url: string }[] = [];
      for (const f of files) {
        const blob = (await heic2any({ blob: f, toType: format })) as Blob | Blob[];
        const b = Array.isArray(blob) ? blob[0] : blob;
        const ext = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
        out.push({ name: f.name.replace(/\.[^.]+$/, "") + "." + ext, url: URL.createObjectURL(b) });
      }
      setUrls((p) => [...p, ...out]);
    } catch {
      setError("Conversion failed. Make sure the file is a valid HEIC/HEIF photo.");
    } finally { setLoading(false); }
  }, [format]);

  const downloadAll = () => urls.forEach((u) => { const a = document.createElement("a"); a.href = u.url; a.download = u.name; a.click(); });

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2 mb-3">
        {(["image/jpeg", "image/png", "image/webp"] as const).map((f) => (
          <button key={f} onClick={() => setFormat(f)} className={`text-xs px-3 py-2 rounded-full border min-h-[36px] ${format === f ? "bg-accent text-white border-accent" : "bg-surface-hover border-border-soft"}`}>{f.split("/")[1].toUpperCase()}</button>
        ))}
      </div>
      <DropZone onFiles={handleFiles} accept=".heic,.heif,image/heic,image/heif" multiple label="Drop HEIC photos here" />
      <ResultPanel loading={loading} loadingLabel="Converting..." error={error} onDownload={urls.length ? downloadAll : undefined} downloadLabel={`Download ${urls.length} file(s)`} onReset={urls.length ? () => setUrls([]) : undefined} sourceToolSlug="heic-converter" outputType="image">
        {urls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {urls.map((u, i) => <a key={i} href={u.url} download={u.name}><img src={u.url} alt={u.name} className="rounded-lg border border-border aspect-square object-cover w-full" /></a>)}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
