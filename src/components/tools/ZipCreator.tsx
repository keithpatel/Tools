"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";

export default function ZipCreator() {
  const [mode, setMode] = useState<"create" | "extract">("create");
  const [files, setFiles] = useState<File[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((f: File[]) => {
    setError(null); setResultUrl(null); setExtracted([]);
    setFiles((p) => [...p, ...f]);
  }, []);

  const create = async () => {
    setLoading(true); setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const f of files) zip.file(f.name, f);
      const blob = await zip.generateAsync({ type: "blob" });
      setResultUrl(URL.createObjectURL(blob));
    } catch { setError("Could not create ZIP."); }
    finally { setLoading(false); }
  };

  const extract = async () => {
    setLoading(true); setError(null);
    try {
      const JSZip = (await import("jszip")).default;
      const out: { name: string; url: string }[] = [];
      for (const f of files) {
        const zip = await JSZip.loadAsync(f);
        for (const [name, entry] of Object.entries(zip.files)) {
          if ((entry as unknown as { dir: boolean }).dir) continue;
          const blob = await (entry as unknown as { async: (t: string) => Promise<Blob> }).async("blob");
          out.push({ name, url: URL.createObjectURL(blob) });
        }
      }
      setExtracted(out);
      if (!out.length) setError("No files found in archive.");
    } catch { setError("Could not extract ZIP."); }
    finally { setLoading(false); }
  };

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2 mb-3">
        <Button variant={mode === "create" ? "primary" : "secondary"} size="sm" onClick={() => { setMode("create"); setFiles([]); setResultUrl(null); }}>Create ZIP</Button>
        <Button variant={mode === "extract" ? "primary" : "secondary"} size="sm" onClick={() => { setMode("extract"); setFiles([]); setExtracted([]); }}>Extract ZIP</Button>
      </div>
      <DropZone onFiles={handleFiles} multiple label={mode === "create" ? "Drop files to zip" : "Drop a .zip to extract"} accept={mode === "extract" ? ".zip" : undefined} />
      {files.length > 0 && (
        <ul className="mt-2 text-xs space-y-1">
          {files.map((f, i) => <li key={i} className="font-mono p-1.5 bg-surface-hover rounded">{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>)}
        </ul>
      )}
      <div className="flex gap-2 mt-3">
        {mode === "create" && files.length > 0 && <Button onClick={create} loading={loading}>Create ZIP</Button>}
        {mode === "extract" && files.length > 0 && <Button onClick={extract} loading={loading}>Extract</Button>}
        {files.length > 0 && <Button variant="ghost" onClick={() => { setFiles([]); setResultUrl(null); setExtracted([]); }}>Clear</Button>}
      </div>
      <ResultPanel loading={loading} error={error} onDownload={resultUrl ? () => { const a = document.createElement("a"); a.href = resultUrl; a.download = "archive.zip"; a.click(); } : undefined} downloadLabel="Download ZIP" sourceToolSlug="zip-creator" outputType="file-batch">
        {(resultUrl || extracted.length > 0) && (
          <div>
            {resultUrl && <p className="text-sm font-semibold text-success">ZIP ready.</p>}
            {extracted.length > 0 && <div className="grid sm:grid-cols-2 gap-1">{extracted.map((e, i) => <a key={i} href={e.url} download={e.name} className="text-xs font-mono p-2 bg-surface-hover rounded hover:underline truncate">{e.name}</a>)}</div>}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
