"use client";
/* eslint-disable @next/next/no-img-element -- filmstrip renders data: URL thumbnails, which next/image cannot optimize */

import { useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize, Film, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilmstrip } from "./useFilmstrip";
import {
  formatTimeShort,
  clampToNeighbors,
  MIN_ZOOM_DURATION,
  VIEW_MIN_SPAN,
  ratioToViewTime,
  viewTimeToRatio,
  viewTickStep,
  zoomView,
  fullView,
  type ZoomKeyframe,
  type TimelineView,
} from "./zoomTypes";

interface ZoomTimelineProps {
  duration: number;
  /** Same blob URL as the preview — used to sample filmstrip thumbnails */
  sourceVideoUrl: string;
  keyframes: ZoomKeyframe[];
  selectedId: string | null;
  currentTime: number;
  view: TimelineView;
  onViewChange: (view: TimelineView) => void;
  /** Highlights the zoom lane as a drop target while a preset chip hovers it */
  dropActive?: boolean;
  /** Exposes the zoom-lane element so the preset drag can hit-test it */
  onTrackElement?: (el: HTMLDivElement | null) => void;
  onSeek: (time: number) => void;
  onSelect: (id: string | null) => void;
  onChange: (keyframes: ZoomKeyframe[]) => void;
}

type DragKind = { id: string; mode: "move" | "start" | "end"; grabOffset: number };

/** Snap threshold in screen pixels (converted to seconds per view) */
const SNAP_PX = 10;

export function ZoomTimeline({
  duration,
  sourceVideoUrl,
  keyframes,
  selectedId,
  currentTime,
  view,
  onViewChange,
  dropActive,
  onTrackElement,
  onSeek,
  onSelect,
  onChange,
}: ZoomTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragKind | null>(null);
  const scrubbingRef = useRef(false);
  // Snapshot keyframes at drag start so neighbor clamping stays stable
  const snapshotRef = useRef<ZoomKeyframe[]>([]);
  const [dragging, setDragging] = useState(false);

  const safeDuration = duration > 0 ? duration : 1;
  const canZoomView = safeDuration > VIEW_MIN_SPAN + 1;
  const fitted = view.span >= safeDuration - 0.01;

  const { thumbs, loading: filmLoading } = useFilmstrip(sourceVideoUrl, safeDuration);

  const setTrackEl = useCallback(
    (el: HTMLDivElement | null) => {
      trackRef.current = el;
      onTrackElement?.(el);
    },
    [onTrackElement]
  );

  const toTime = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return view.start;
      const ratio = (clientX - rect.left) / rect.width;
      return Math.min(safeDuration, Math.max(0, ratioToViewTime(ratio, view)));
    },
    [view, safeDuration]
  );

  /** Snap a timestamp to the playhead or a neighboring block edge when close */
  const snapTime = useCallback(
    (t: number, excludeId: string | null) => {
      const el = trackRef.current;
      const rect = el?.getBoundingClientRect();
      const threshold = rect && rect.width > 0 ? (SNAP_PX * view.span) / rect.width : 0;
      if (threshold <= 0) return t;
      const candidates = [currentTime];
      for (const k of snapshotRef.current) {
        if (k.id === excludeId) continue;
        candidates.push(k.start, k.end);
      }
      for (const c of candidates) {
        if (Math.abs(t - c) <= threshold) return Math.min(safeDuration, Math.max(0, c));
      }
      return t;
    },
    [view.span, currentTime, safeDuration]
  );

  const onPointerDownTrack = (e: React.PointerEvent) => {
    // Block/handle presses stop propagation; reaching here means empty lane
    onSeek(toTime(e.clientX));
    onSelect(null);
  };

  // ─── Ruler scrub: press and slide to move the playhead ───
  const rulerSeek = (clientX: number) => {
    const el = rulerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(Math.min(safeDuration, Math.max(0, ratioToViewTime(ratio, view))));
  };

  const onRulerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    scrubbingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    rulerSeek(e.clientX);
  };

  const onRulerMove = (e: React.PointerEvent) => {
    if (scrubbingRef.current) rulerSeek(e.clientX);
  };

  const onRulerUp = () => {
    scrubbingRef.current = false;
  };

  const beginDrag = (e: React.PointerEvent, id: string, mode: DragKind["mode"]) => {
    e.stopPropagation();
    e.preventDefault();
    const t = toTime(e.clientX);
    const kf = keyframes.find((k) => k.id === id);
    if (!kf) return;
    snapshotRef.current = keyframes;
    dragRef.current = {
      id,
      mode,
      grabOffset: mode === "move" ? t - kf.start : 0,
    };
    onSelect(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const base = snapshotRef.current;
    const orig = base.find((k) => k.id === drag.id);
    if (!orig) return;
    const t = toTime(e.clientX);

    let next: ZoomKeyframe[];
    if (drag.mode === "move") {
      const len = orig.end - orig.start;
      let s = snapTime(t - drag.grabOffset, drag.id);
      // If the leading edge didn't snap, try the trailing edge
      if (Math.abs(s + len - (t - drag.grabOffset + len)) < 1e-9) {
        const snappedEnd = snapTime(s + len, drag.id);
        if (snappedEnd !== s + len) s = snappedEnd - len;
      }
      const clamped = clampToNeighbors(base, drag.id, s, s + len, safeDuration);
      next = base.map((k) => (k.id === drag.id ? { ...k, start: clamped.start, end: clamped.end } : k));
    } else if (drag.mode === "start") {
      const s = snapTime(Math.min(t, orig.end - MIN_ZOOM_DURATION), drag.id);
      const clamped = clampToNeighbors(base, drag.id, s, orig.end, safeDuration);
      next = base.map((k) => (k.id === drag.id ? { ...k, start: clamped.start } : k));
    } else {
      const en = snapTime(Math.max(t, orig.start + MIN_ZOOM_DURATION), drag.id);
      const clamped = clampToNeighbors(base, drag.id, orig.start, en, safeDuration);
      next = base.map((k) => (k.id === drag.id ? { ...k, end: clamped.end } : k));
    }
    onChange(next);
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // Ruler ticks aligned to the visible window
  const step = viewTickStep(view.span);
  const ticks: number[] = [];
  for (let t = Math.ceil(view.start / step) * step; t <= view.start + view.span + 0.001; t += step) {
    ticks.push(Math.min(t, safeDuration));
  }

  const playheadRatio = viewTimeToRatio(currentTime, view);
  const playheadVisible = currentTime >= view.start - 0.001 && currentTime <= view.start + view.span + 0.001;

  const zoomIn = () => onViewChange(zoomView(safeDuration, view, 2, currentTime));
  const zoomOut = () => onViewChange(zoomView(safeDuration, view, 0.5, currentTime));
  const fit = () => onViewChange(fullView(safeDuration));

  const filmSlice = thumbs.length > 0 ? safeDuration / thumbs.length : 0;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Timeline toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-soft">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-text-secondary">Timeline</span>
          <span className="font-mono font-semibold px-2 py-0.5 bg-surface-raised border border-border rounded-md">
            {formatTimeShort(currentTime)} / {formatTimeShort(safeDuration)}
          </span>
        </div>
        {canZoomView && (
          <div className="flex items-center gap-1" role="group" aria-label="Timeline zoom">
            <button
              type="button"
              onClick={zoomOut}
              disabled={fitted}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border border-border hover:bg-surface-hover transition-all disabled:opacity-40"
              aria-label="Zoom timeline out"
              title="Show more of the video"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={view.span <= VIEW_MIN_SPAN + 0.01}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border border-border hover:bg-surface-hover transition-all disabled:opacity-40"
              aria-label="Zoom timeline in"
              title="Zoom in for precise placement"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={fit}
              disabled={fitted}
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg border border-border hover:bg-surface-hover transition-all disabled:opacity-40"
              aria-label="Fit whole video in timeline"
              title="Show the whole video"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Lane headers */}
        <div className="w-14 sm:w-16 shrink-0 border-r border-border-soft py-1 space-y-1" aria-hidden="true">
          <div className="h-5" />
          <div className="h-12 flex flex-col items-center justify-center gap-0.5 text-text-secondary">
            <Film className="w-4 h-4" />
            <span className="text-[9px] font-semibold uppercase tracking-wide">Video</span>
          </div>
          <div className="h-16 flex flex-col items-center justify-center gap-0.5 text-accent">
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] font-semibold uppercase tracking-wide">Zoom</span>
          </div>
        </div>

        {/* Lanes */}
        <div className="relative flex-1 min-w-0 py-1 space-y-1">
          {/* Full-height playhead across ruler + lanes.
              Lanes use mx-2 (not container padding) so this calc lands
              exactly on the lane content boxes. */}
          {playheadVisible && (
            <div
              className="absolute top-1 bottom-1 w-0.5 bg-error z-20 pointer-events-none"
              style={{ left: `calc(8px + ${playheadRatio} * (100% - 16px))` }}
            >
              <span className="absolute -top-0.5 -left-[5px] w-3 h-3 rounded-full bg-error border-2 border-surface" />
            </div>
          )}

          {/* Ruler (drag to scrub) */}
          <div
            ref={rulerRef}
            onPointerDown={onRulerDown}
            onPointerMove={onRulerMove}
            onPointerUp={onRulerUp}
            onPointerCancel={onRulerUp}
            className="relative h-5 mx-2 select-none touch-none cursor-ew-resize"
            title="Drag to move the playhead"
          >
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-0 -translate-x-1/2 text-[10px] font-mono text-text-secondary/70 pointer-events-none"
                style={{ left: `${viewTimeToRatio(t, view) * 100}%` }}
              >
                {formatTimeShort(t)}
              </span>
            ))}
          </div>

          {/* Video lane: filmstrip overview (click to jump) */}
          <div
            onPointerDown={(e) => onSeek(toTime(e.clientX))}
            className="relative h-12 mx-2 rounded-lg bg-black/80 border border-border-soft overflow-hidden select-none touch-none cursor-pointer"
            title="Click to jump to that moment"
          >
            {thumbs.map((th) => {
              const center = viewTimeToRatio(th.time, view);
              if (center < -0.05 || center > 1.05) return null;
              const halfSlice = filmSlice / 2 / view.span;
              return (
                <img
                  key={th.time}
                  src={th.dataUrl}
                  alt=""
                  draggable={false}
                  className="absolute top-0 bottom-0 object-cover pointer-events-none"
                  style={{
                    left: `${Math.max(0, center - halfSlice) * 100}%`,
                    width: `${Math.min(1, center + halfSlice) * 100 - Math.max(0, center - halfSlice) * 100}%`,
                  }}
                />
              );
            })}
            {filmLoading && thumbs.length === 0 && (
              <div className="absolute inset-0 flex items-center gap-1 px-2" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1 h-8 rounded bg-white/10 animate-pulse" />
                ))}
              </div>
            )}
            {/* Dim the zoomed-out region edges? No — keep clean */}
          </div>

          {/* Zoom lane */}
          <div
            ref={setTrackEl}
            role="slider"
            aria-label="Zoom lane. Arrow keys seek, plus and minus zoom the timeline."
            aria-valuemin={0}
            aria-valuemax={Math.round(safeDuration)}
            aria-valuenow={Math.round(currentTime)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 1));
              else if (e.key === "ArrowRight") onSeek(Math.min(safeDuration, currentTime + 1));
              else if ((e.key === "+" || e.key === "=") && canZoomView) zoomIn();
              else if (e.key === "-" && canZoomView) zoomOut();
              else if (e.key === "0" && canZoomView) fit();
            }}
            onPointerDown={onPointerDownTrack}
            className={cn(
              "relative h-16 mx-2 rounded-lg bg-surface-raised border overflow-hidden select-none touch-none cursor-pointer transition-shadow",
              dropActive ? "border-accent shadow-[0_0_0_3px_var(--accent)] border-2" : "border-border"
            )}
          >
            {keyframes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-text-secondary/70 pointer-events-none px-3 text-center">
                Tap the video above, press + Zoom here, or drag a zoom chip below
              </div>
            )}

            {keyframes.map((k) => {
              // Skip blocks fully outside the visible window
              if (k.end < view.start || k.start > view.start + view.span) return null;
              const leftPct = viewTimeToRatio(k.start, view) * 100;
              const rightPct = viewTimeToRatio(k.end, view) * 100;
              const widthPct = Math.max(1.5, rightPct - leftPct);
              const selected = k.id === selectedId;
              return (
                <div
                  key={k.id}
                  onPointerDown={(e) => beginDrag(e, k.id, "move")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  title={`${k.mode === "in" ? "Zoom in" : "Zoom out"} ${k.scale.toFixed(1)}x · ${formatTimeShort(k.start)} – ${formatTimeShort(k.end)}. Drag to move, drag edges to resize.`}
                  className={cn(
                    "absolute top-2 bottom-2 rounded-lg border flex items-center justify-center gap-1 text-[11px] font-semibold touch-none",
                    selected
                      ? "bg-accent/20 border-accent text-accent shadow-sm z-[5]"
                      : "bg-accent/10 border-accent/40 text-text-primary hover:bg-accent/15",
                    dragging && "cursor-grabbing"
                  )}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {/* Left handle */}
                  <span
                    onPointerDown={(e) => beginDrag(e, k.id, "start")}
                    className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center rounded-l-lg hover:bg-accent/20 active:bg-accent/30"
                    aria-hidden="true"
                  >
                    <span className="w-1 h-5 rounded-full bg-accent/70" />
                  </span>
                  <span className="pointer-events-none truncate px-4">
                    {k.scale.toFixed(1)}x {k.mode === "out" ? "out" : ""}
                  </span>
                  {/* Right handle */}
                  <span
                    onPointerDown={(e) => beginDrag(e, k.id, "end")}
                    className="absolute right-0 top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center rounded-r-lg hover:bg-accent/20 active:bg-accent/30"
                    aria-hidden="true"
                  >
                    <span className="w-1 h-5 rounded-full bg-accent/70" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="px-3 pb-2 text-[11px] text-text-secondary/80">
        Drag a block to move it — edges snap to the playhead · drag the ruler to scrub · tap the filmstrip to jump.
      </p>
    </div>
  );
}
