"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";

export default function QrScanner() {
  const [result, setResult] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const urlRef = useRef<string | null>(null);

  const scan = useCallback(async (file: File) => {
    setError(null); setResult(""); setLoading(true);
    try {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(file);
      urlRef.current = url;
      setPreview(url);
      const img = new Image();
      img.src = url;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(data.data, data.width, data.height);
      if (!code) { setError("No QR code found in this image. Try a clearer, well-lit photo."); return; }
      setResult(code.data);
    } catch {
      setError("Could not read this image.");
    } finally { setLoading(false); }
  }, []);

  const reset = () => { setResult(""); setPreview(null); setError(null); if (urlRef.current) URL.revokeObjectURL(urlRef.current); };

  return (
    <ToolLayout title="" description="">
      {!preview ? (
        <DropZone onFiles={(f) => f[0] && scan(f[0])} accept="image/*" multiple={false} label="Drop a QR code image here" enableCamera cameraLabel="Scan with camera" />
      ) : (
        <div className="space-y-4">
          {preview && <img src={preview} alt="Scanned" className="max-h-64 mx-auto rounded-lg border border-border" />}
          <ResultPanel loading={loading} loadingLabel="Scanning..." error={error} onReset={reset} sourceToolSlug="qr-scanner" outputType="text">
            {result && (
              <div>
                <p className="text-xs text-text-secondary mb-1">Decoded content</p>
                <p className="p-3 bg-surface-hover rounded-lg font-mono text-sm break-all">{result}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(result)}>Copy</Button>
                  {/^https?:\/\//.test(result) && <a href={result} target="_blank" rel="noopener" className="text-sm text-accent underline self-center">Open link</a>}
                </div>
              </div>
            )}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
