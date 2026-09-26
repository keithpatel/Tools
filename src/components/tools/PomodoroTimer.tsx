"use client";

import { useState, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

type Mode = "pomodoro" | "stopwatch" | "countdown";
const FOCUS = 25 * 60;

function fmt(s: number) {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.floor(Math.abs(s) % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [secs, setSecs] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const [mins, setMins] = useState(5);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = window.setInterval(() => {
        setSecs((s) => (mode === "stopwatch" ? s + 1 : s - 1));
      }, 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running, mode]);

  useEffect(() => {
    if (mode !== "stopwatch" && secs <= 0 && running) {
      setRunning(false);
      setSecs(0);
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
      if ("Notification" in window && Notification.permission === "granted") new Notification("Timer done!");
    }
  }, [secs, running, mode]);

  const reset = () => {
    setRunning(false);
    setSecs(mode === "stopwatch" ? 0 : mode === "countdown" ? mins * 60 : FOCUS);
  };

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2 mb-4">
        {(["pomodoro", "stopwatch", "countdown"] as Mode[]).map((m) => (
          <Button key={m} variant={mode === m ? "primary" : "secondary"} onClick={() => { setMode(m); setRunning(false); setSecs(m === "stopwatch" ? 0 : m === "countdown" ? mins * 60 : FOCUS); }}>{m === "pomodoro" ? "Pomodoro" : m === "stopwatch" ? "Stopwatch" : "Countdown"}</Button>
        ))}
      </div>
      {mode === "countdown" && (
        <label className="text-sm flex items-center gap-2 mb-3">Minutes:
          <input type="number" min={1} max={600} value={mins} onChange={(e) => { setMins(Number(e.target.value) || 1); setSecs((Number(e.target.value) || 1) * 60); }} className="w-20 px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
        </label>
      )}
      <div className="text-center py-8 bg-surface-hover rounded-[18px]">
        <p className="font-mono text-6xl font-bold tabular-nums">{fmt(secs)}</p>
        <p className="text-xs text-text-secondary mt-1">{mode === "pomodoro" ? "25 min focus · 5 min break" : mode}</p>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</Button>
        <Button variant="secondary" onClick={reset}>Reset</Button>
        <Button variant="ghost" onClick={() => { if ("Notification" in window) Notification.requestPermission(); }}>Enable notification</Button>
      </div>
    </ToolLayout>
  );
}
