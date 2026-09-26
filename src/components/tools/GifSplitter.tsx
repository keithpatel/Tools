"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";

export default function GifSplitter() {
  const [frames, setFrames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null); setFrames([]); setLoading(true);
    try {
      const buf = await f.arrayBuffer();
      const { parseGIF, decompressFrames } = await import("gifuct-js");
      const gif = parseGIF(buf);
      const dec = decompressFrames(gif, true) as unknown as { dims: { width: number; height: number; left: number; top: number }; disposalType: number; patch: number[] }[];
      const urls: string[] = [];
      const canvas = document.createElement("canvas");
      canvas.width = gif.lsd.width;
      canvas.height = gif.lsd.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      for (const frame of dec) {
        const tmp = document.createElement("canvas");
        tmp.width = frame.dims.width;
        tmp.height = frame.dims.height;
        const tctx = tmp.getContext("2d");
        if (!tctx) continue;
        const imgData = tctx.createImageData(frame.dims.width, frame.dims.height);
        imgData.data.set(frame.patch);
        tctx.putImageData(imgData, 0, 0);
        if (frame.disposalType === 2) ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tmp, frame.dims.left, frame.dims.top);
        const out = document.createElement("canvas");
        out.width = canvas.width; out.height = canvas.height;
        out.getContext("2d")!.drawImage(canvas, 0, 0);
        urls.push(out.toDataURL("image/png"));
      }
      if (!urls.length) throw new Error("No frames");
      setFrames(urls);
    } catch {
      setError("Could not split this GIF. Try another animated GIF.");
    } finally { setLoading(false); }
  }, []);

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (let i = 0; i < frames.length; i++) {
      const res = await fetch(frames[i]);
      zip.file(`frame-${String(i + 1).padStart(3, "0")}.png`, await res.blob());
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gif-frames.zip";
    a.click();
  };

  return (
    <ToolLayout title="" description="">
      {frames.length === 0 && <DropZone onFiles={handleFiles} accept="image/gif" label="Drop an animated GIF here" />}
      <ResultPanel loading={loading} loadingLabel="Splitting GIF..." error={error} onDownload={frames.length ? downloadAll : undefined} downloadLabel={`Download ${frames.length} frames (ZIP)`} onReset={frames.length ? () => setFrames([]) : undefined} sourceToolSlug="gif-splitter" outputType="file-batch">
        {frames.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {frames.map((u, i) => <a key={i} href={u} download={`frame-${i + 1}.png`}><img src={u} alt={`Frame ${i + 1}`} className="rounded border border-border aspect-square object-contain bg-surface-hover w-full" /></a>)}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
