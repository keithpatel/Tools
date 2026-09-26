"use client";

import { useState, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

export default function VoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const { sendOutput } = useWorkflowStore();

  const start = async () => {
    setError(null); setUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const u = URL.createObjectURL(blob);
        setUrl(u);
        sendOutput({ type: "audio", data: blob, filename: `voice-${Date.now()}.webm`, sourceToolSlug: "voice-recorder", createdAt: Date.now() });
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setRecording(true);
      setSecs(0);
      timer.current = window.setInterval(() => setSecs((s) => s + 1), 1000);
    } catch { setError("Microphone access denied. Allow mic permission and use HTTPS."); }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  };

  return (
    <ToolLayout title="" description="">
      <div className="text-center py-8 bg-surface-hover rounded-[18px]">
        <p className={`inline-block w-3 h-3 rounded-full mb-2 ${recording ? "bg-red-500 animate-pulse" : "bg-border"}`} />
        <p className="font-mono text-5xl font-bold tabular-nums">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</p>
        <p className="text-xs text-text-secondary mt-1">{recording ? "Recording..." : "Ready"}</p>
      </div>
      <div className="flex gap-2 mt-4">
        {!recording ? <Button onClick={start}>Start recording</Button> : <Button variant="secondary" onClick={stop}>Stop</Button>}
      </div>
      <ResultPanel error={error} onDownload={url ? () => { const a = document.createElement("a"); a.href = url; a.download = "voice-note.webm"; a.click(); } : undefined} downloadLabel="Download recording" onReset={url ? () => setUrl(null) : undefined} sourceToolSlug="voice-recorder" outputType="audio">
        {url && <audio src={url} controls className="w-full" />}
      </ResultPanel>
    </ToolLayout>
  );
}
