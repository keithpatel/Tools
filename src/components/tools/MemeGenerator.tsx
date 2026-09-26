"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Download, ImagePlus, Move, Type, Share2, Check } from "lucide-react";

interface TextPos {
  x: number;
  y: number;
}

function initialMemeParams() {
  const d = { top: "TOP TEXT", bottom: "BOTTOM TEXT", size: 48 };
  if (typeof window === "undefined") return d;
  try {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("top");
    const b = sp.get("bottom");
    const s = Number(sp.get("size"));
    if (t) d.top = t.slice(0, 80);
    if (b) d.bottom = b.slice(0, 80);
    if (!isNaN(s)) d.size = Math.min(120, Math.max(20, s));
  } catch {}
  return d;
}

const SAMPLE_W = 800;
const SAMPLE_H = 600;
const MAX_W = 900;

function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  pos: TextPos,
  w: number,
  h: number,
  size: number
) {
  const upper = text.trim().toUpperCase();
  if (!upper) return;
  const maxWidth = w * 0.92;
  let px = size;
  const setFont = (s: number) => {
    ctx.font = `bold ${s}px Impact, "Arial Black", sans-serif`;
  };
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  setFont(px);
  while (ctx.measureText(upper).width > maxWidth && px > 12) {
    px -= 2;
    setFont(px);
  }
  const x = pos.x * w;
  const y = pos.y * h;
  ctx.lineWidth = Math.max(2, px / 12);
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#ffffff";
  ctx.strokeText(upper, x, y);
  ctx.fillText(upper, x, y);
}

export default function MemeGenerator() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [initMeme] = useState(initialMemeParams);
  const [topText, setTopText] = useState(initMeme.top);
  const [bottomText, setBottomText] = useState(initMeme.bottom);
  const [fontSize, setFontSize] = useState(initMeme.size);
  const [topPos, setTopPos] = useState<TextPos>({ x: 0.5, y: 0.12 });
  const [bottomPos, setBottomPos] = useState<TextPos>({ x: 0.5, y: 0.88 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const sharePreset = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("top", topText);
      url.searchParams.set("bottom", bottomText);
      url.searchParams.set("size", String(fontSize));
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<"top" | "bottom" | null>(null);

  const ready = isSample || image !== null;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (isSample || !image) {
      canvas.width = SAMPLE_W;
      canvas.height = SAMPLE_H;
      const grad = ctx.createLinearGradient(0, 0, SAMPLE_W, SAMPLE_H);
      grad.addColorStop(0, "#4c1d95");
      grad.addColorStop(0.5, "#7c3aed");
      grad.addColorStop(1, "#db2777");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SAMPLE_W, SAMPLE_H);
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(150, 120, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(680, 480, 130, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      const scale = Math.min(1, MAX_W / image.naturalWidth);
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }
    drawMemeText(ctx, topText, topPos, canvas.width, canvas.height, fontSize);
    drawMemeText(ctx, bottomText, bottomPos, canvas.width, canvas.height, fontSize);
  }, [image, isSample, topText, bottomText, topPos, bottomPos, fontSize]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError("");
    setLoading(true);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setIsSample(false);
      setLoading(false);
    };
    img.onerror = () => {
      setError("Could not read that image. Please try a different file.");
      setLoading(false);
    };
    img.src = url;
  }, []);

  const useSample = () => {
    setImage(null);
    setIsSample(true);
    setError("");
  };

  const posFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): TextPos => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready || loading) return;
    const p = posFromEvent(e);
    const canvas = canvasRef.current;
    const h = canvas?.height || 1;
    const threshold = (fontSize * 1.6) / h;
    const dTop = Math.abs(p.y - topPos.y) + Math.abs(p.x - topPos.x) * 0.5;
    const dBottom = Math.abs(p.y - bottomPos.y) + Math.abs(p.x - bottomPos.x) * 0.5;
    if (dTop <= threshold && dTop <= dBottom) {
      dragRef.current = "top";
    } else if (dBottom <= threshold) {
      dragRef.current = "bottom";
    } else {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const p = posFromEvent(e);
    if (dragRef.current === "top") {
      setTopPos(p);
    } else {
      setBottomPos(p);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Export failed. Please try again.");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meme.png";
      a.click();
    }, "image/png");
  };

  const reset = () => {
    setImage(null);
    setIsSample(false);
    setTopText("TOP TEXT");
    setBottomText("BOTTOM TEXT");
    setFontSize(48);
    setTopPos({ x: 0.5, y: 0.12 });
    setBottomPos({ x: 0.5, y: 0.88 });
    setError("");
  };

  return (
    <ToolLayout title="" description="">
      {!ready && !loading ? (
        <div className="space-y-3">
          <DropZone
            onFiles={handleFiles}
            accept="image/*"
            label="Drop an image here or click to browse"
            enableCamera
          />
          <div className="text-center">
            <Button variant="secondary" onClick={useSample} className="w-full sm:w-auto min-h-[44px]">
              <ImagePlus className="w-4 h-4" />
              Use Sample Image Instead
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="max-w-full h-auto rounded-xl border border-border-soft cursor-move touch-none select-none"
            />
          </div>

          <p className="flex items-center justify-center gap-2 text-xs sm:text-sm text-text-secondary">
            <Move className="w-4 h-4" />
            Tip: drag the text on the image to reposition it.
          </p>

          <div>
            <p className="flex items-center gap-2 text-sm font-medium mb-2">
              <Type className="w-4 h-4" />
              Captions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="meme-top" className="text-sm font-medium">
                  Top text
                </label>
                <input
                  id="meme-top"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="TOP TEXT"
                  maxLength={80}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label htmlFor="meme-bottom" className="text-sm font-medium">
                  Bottom text
                </label>
                <input
                  id="meme-bottom"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="BOTTOM TEXT"
                  maxLength={80}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-border-soft bg-surface px-3 py-2 text-sm text-text-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="meme-size" className="text-sm font-medium">
              Font size: {fontSize}px
            </label>
            <input
              id="meme-size"
              type="range"
              min={20}
              max={120}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full mt-1 accent-accent"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={reset} className="min-h-[44px] sm:min-h-0">
              New Meme
            </Button>
            <Button variant="secondary" size="sm" onClick={sharePreset} className="min-h-[44px] sm:min-h-0">
              {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? "Link copied" : "Share preset"}
            </Button>
          </div>
        </div>
      )}

      <ResultPanel
        loading={loading}
        loadingLabel="Loading image…"
        error={error}
        onReset={ready && !loading ? reset : undefined}
        resetLabel="Start Over"
      >
        {ready && !loading && (
          <div className="sticky bottom-20 md:static">
            <Button onClick={handleDownload} className="w-full sm:w-auto min-h-[44px]">
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
