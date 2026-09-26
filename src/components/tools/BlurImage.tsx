"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";

export default function BlurImage() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [strength, setStrength] = useState(12);
  const [mode, setMode] = useState<"blur-all" | "pixelate">("blur-all");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null); setResultUrl(null);
    setImgUrl(URL.createObjectURL(f));
  }, []);

  const apply = () => {
    if (!imgUrl) return;
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = mode === "blur-all" ? `blur(${strength}px)` : "none";
      ctx.drawImage(img, 0, 0);
      ctx.filter = "none";
      if (mode === "pixelate") {
        const blocks = Math.max(8, 60 - strength);
        const w = Math.ceil(canvas.width / blocks), h = Math.ceil(canvas.height / blocks);
        const tmp = document.createElement("canvas");
        tmp.width = w; tmp.height = h;
        tmp.getContext("2d")!.drawImage(canvas, 0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
      }
      setResultUrl(canvas.toDataURL("image/png"));
    };
    img.onerror = () => setError("Could not load image.");
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "blurred.png";
    a.click();
  };

  return (
    <ToolLayout title="" description="">
      {!imgUrl ? (
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop an image to blur" enableCamera />
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button variant={mode === "blur-all" ? "primary" : "secondary"} size="sm" onClick={() => setMode("blur-all")}>Blur all</Button>
            <Button variant={mode === "pixelate" ? "primary" : "secondary"} size="sm" onClick={() => setMode("pixelate")}>Pixelate</Button>
            <label className="text-xs self-center ml-2">Strength: {strength}<input type="range" min={2} max={50} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="ml-2 align-middle" /></label>
            <Button size="sm" onClick={apply}>Apply</Button>
          </div>
          <canvas ref={canvasRef} className="max-w-full rounded-lg border border-border" />
          {imgUrl && !resultUrl && <img src={imgUrl} alt="Original" className="mt-2 max-h-64 rounded-lg border border-border" />}
          <ResultPanel error={error} onDownload={resultUrl ? download : undefined} downloadLabel="Download PNG" onReset={() => { setImgUrl(null); setResultUrl(null); }} sourceToolSlug="blur-image" outputType="image">
            {resultUrl && <img src={resultUrl} alt="Blurred" className="max-h-80 mx-auto rounded-lg" />}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
