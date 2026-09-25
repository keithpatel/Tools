"use client";

import { useRef } from "react";

export function TrimRange({
  min,
  max,
  start,
  end,
  onChange,
  disabled,
}: {
  min: number;
  max: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  disabled?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<"start" | "end" | null>(null);
  const range = max - min;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const posToValue = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = range > 0 ? (clientX - rect.left) / rect.width : 0;
    return clamp(min + ratio * range);
  };

  const update = (clientX: number) => {
    const v = posToValue(clientX);
    if (activeRef.current === "start") onChange(Math.min(v, end), end);
    else if (activeRef.current === "end") onChange(start, Math.max(v, start));
  };

  const onTrackDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    const v = posToValue(e.clientX);
    activeRef.current = Math.abs(v - start) <= Math.abs(v - end) ? "start" : "end";
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e.clientX);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!activeRef.current || disabled) return;
    update(e.clientX);
  };

  const onUp = () => {
    activeRef.current = null;
  };

  const startPct = range > 0 ? ((start - min) / range) * 100 : 0;
  const endPct = range > 0 ? ((end - min) / range) * 100 : 100;

  return (
    <div
      ref={trackRef}
      className={`relative h-8 select-none touch-none ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      onPointerDown={onTrackDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* Full track */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-border-soft" />
      {/* Selected range */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-accent"
        style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
      />
      {/* Start handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-surface border border-border shadow-sm transition-shadow hover:shadow-md cursor-ew-resize"
        style={{ left: `${startPct}%` }}
        aria-hidden="true"
      />
      {/* End handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-surface border border-border shadow-sm transition-shadow hover:shadow-md cursor-ew-resize"
        style={{ left: `${endPct}%` }}
        aria-hidden="true"
      />
    </div>
  );
}
