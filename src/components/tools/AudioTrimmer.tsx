"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

function wavEncode(buffer: AudioBuffer): Blob {
  const ch = buffer.numberOfChannels, sr = buffer.sampleRate;
  const len = buffer.length * ch * 2 + 44;
  const ab = new ArrayBuffer(len);
  const v = new DataView(ab);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + buffer.length * ch * 2, true); ws(8, "WAVE"); ws(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true); ws(36, "data"); v.setUint32(40, buffer.length * ch * 2, true);
  const chans: Float32Array[] = [];
  for (let c = 0; c < ch; c++) chans.push(buffer.getChannelData(c));
  let off = 44;
  for (let i = 0; i < buffer.length; i++) for (let c = 0; c < ch; c++) {
    const s = Math.max(-1, Math.min(1, chans[c][i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2;
  }
  return new Blob([ab], { type: "audio/wav" });
}

export default function AudioTrimmer() {
  const [buf, setBuf] = useState<AudioBuffer | null>(null);
  const [name, setName] = useState("audio");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sendOutput } = useWorkflowStore();

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null); setUrl(null); setBuf(null);
    setLoading(true);
    try {
      const ab = await f.arrayBuffer();
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(ab);
      ctx.close().catch(() => {});
      setBuf(decoded);
      setName(f.name.replace(/\.[^.]+$/, ""));
      setStart(0); setEnd(decoded.duration);
    } catch { setError("Could not decode audio. Try MP3, WAV, or M4A."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!buf || !canvasRef.current) return;
    const cv = canvasRef.current, ctx = cv.getContext("2d");
    if (!ctx) return;
    const d = buf.getChannelData(0), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(124,58,237,0.5)";
    const step = Math.ceil(d.length / W);
    for (let i = 0; i < W; i++) {
      let mx = 0;
      for (let j = 0; j < step; j += 10) mx = Math.max(mx, Math.abs(d[i * step + j] || 0));
      const h = mx * H;
      ctx.fillRect(i, (H - h) / 2, 1, h);
    }
    // selection overlay
    const x1 = (start / buf.duration) * W, x2 = (end / buf.duration) * W;
    ctx.fillStyle = "rgba(124,58,237,0.15)";
    ctx.fillRect(x1, 0, x2 - x1, H);
  }, [buf, start, end]);

  const trim = async () => {
    if (!buf) return;
    setLoading(true);
    try {
      const sr = buf.sampleRate;
      const s0 = Math.floor(start * sr), s1 = Math.min(buf.length, Math.floor(end * sr));
      if (s1 <= s0) { setError("End must be after start."); return; }
      const off = new OfflineAudioContext(buf.numberOfChannels, s1 - s0, sr);
      const src = off.createBufferSource();
      src.buffer = buf;
      src.connect(off.destination);
      src.start(0, start, (s1 - s0) / sr);
      const rendered = await off.startRendering();
      const blob = wavEncode(rendered);
      const u = URL.createObjectURL(blob);
      setUrl(u);
      sendOutput({ type: "audio", data: blob, filename: `${name}-trimmed.wav`, sourceToolSlug: "audio-trimmer", createdAt: Date.now() });
    } catch { setError("Trim failed."); }
    finally { setLoading(false); }
  };

  return (
    <ToolLayout title="" description="">
      {!buf ? <DropZone onFiles={handleFiles} accept="audio/*,.mp3,.wav,.m4a,.ogg" label="Drop an audio file here" />
      : (
        <div>
          <p className="text-sm mb-2 font-mono">{name} · {buf.duration.toFixed(1)}s · {(buf.sampleRate / 1000).toFixed(1)}kHz</p>
          <canvas ref={canvasRef} width={800} height={120} className="w-full h-28 bg-surface-hover rounded-lg border border-border-soft" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <label className="text-xs">Start (s)<input type="number" step={0.1} min={0} max={end} value={start} onChange={(e) => setStart(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
            <label className="text-xs">End (s)<input type="number" step={0.1} min={start} max={buf.duration} value={end} onChange={(e) => setEnd(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={trim} loading={loading}>Trim & export WAV</Button>
            <Button variant="ghost" onClick={() => { setBuf(null); setUrl(null); }}>New file</Button>
          </div>
          <ResultPanel loading={loading} error={error} onDownload={url ? () => { const a = document.createElement("a"); a.href = url; a.download = `${name}-trimmed.wav`; a.click(); } : undefined} downloadLabel="Download WAV" sourceToolSlug="audio-trimmer" outputType="audio">
            {url && <audio src={url} controls className="w-full" />}
          </ResultPanel>
        </div>
      )}
    </ToolLayout>
  );
}
