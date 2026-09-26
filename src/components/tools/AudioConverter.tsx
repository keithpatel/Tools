"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

function wavEncode(buffer: AudioBuffer): Blob {
  const ch = buffer.numberOfChannels, sr = buffer.sampleRate;
  const ab = new ArrayBuffer(44 + buffer.length * ch * 2);
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

export default function AudioConverter() {
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState("audio");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendOutput } = useWorkflowStore();

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null); setUrl(null); setLoading(true);
    try {
      const ab = await f.arrayBuffer();
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(ab);
      ctx.close().catch(() => {});
      const wav = wavEncode(decoded);
      const u = URL.createObjectURL(wav);
      setUrl(u);
      const base = f.name.replace(/\.[^.]+$/, "");
      setName(base);
      setInfo(`${decoded.sampleRate / 1000}kHz · ${decoded.numberOfChannels === 1 ? "Mono" : "Stereo"} · ${decoded.duration.toFixed(1)}s · ${(wav.size / 1024 / 1024).toFixed(2)} MB WAV`);
      sendOutput({ type: "audio", data: wav, filename: `${base}.wav`, sourceToolSlug: "audio-converter", createdAt: Date.now() });
    } catch { setError("Could not convert this file. Try MP3, M4A, OGG, or WebM."); }
    finally { setLoading(false); }
  }, []);

  return (
    <ToolLayout title="" description="">
      <DropZone onFiles={handleFiles} accept="audio/*,.mp3,.m4a,.ogg,.webm,.wav" label="Drop an audio file to convert to WAV" />
      {info && <p className="text-xs text-text-secondary mt-2">{info}</p>}
      <ResultPanel loading={loading} loadingLabel="Converting..." error={error} onDownload={url ? () => { const a = document.createElement("a"); a.href = url; a.download = `${name}.wav`; a.click(); } : undefined} downloadLabel="Download WAV" onReset={url ? () => { setUrl(null); setInfo(""); } : undefined} sourceToolSlug="audio-converter" outputType="audio">
        {url && <audio src={url} controls className="w-full" />}
      </ResultPanel>
      <div className="flex gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={() => { window.location.href = "/tools/audio-trimmer"; }}>Need trimming? Open Audio Trimmer</Button>
      </div>
    </ToolLayout>
  );
}
