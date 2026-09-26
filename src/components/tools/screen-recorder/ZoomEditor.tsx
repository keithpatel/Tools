"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Segmented } from "@/components/ui/Segmented";
import { ZoomTimeline } from "./ZoomTimeline";
import { useZoomExport } from "./useZoomExport";
import {
  sampleZoomAt,
  addKeyframe,
  clampZoomCenter,
  formatTimeShort,
  followView,
  fullView,
  ratioToViewTime,
  MIN_SCALE,
  MAX_SCALE,
  type ZoomKeyframe,
  type ZoomMode,
  type TimelineView,
} from "./zoomTypes";
import {
  ArrowLeft,
  Play,
  Pause,
  MousePointerClick,
  Trash2,
  Download,
  ZoomIn,
  GripVertical,
  AlertCircle,
} from "lucide-react";

interface ZoomEditorProps {
  videoUrl: string;
  keyframes: ZoomKeyframe[];
  onKeyframesChange: (keyframes: ZoomKeyframe[]) => void;
  onExported: (result: { blob: Blob; url: string; mimeType: string }) => void;
  onBack: () => void;
}

const WRAPPER_ASPECT = 16 / 9;

export function ZoomEditor({ videoUrl, keyframes, onKeyframesChange, onExported, onBack }: ZoomEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  /** Visible timeline window (zoomable). Reset whenever a new video loads. */
  const [view, setView] = useState<TimelineView>({ start: 0, span: 1 });
  /** Active preset-chip drag: ghost position + hovered drop time */
  const [presetDrag, setPresetDrag] = useState<{
    scale: number;
    x: number;
    y: number;
    time: number | null;
  } | null>(null);
  /** Overlay box (percentages of the 16:9 wrapper) matching the letterboxed video content */
  const [contentBox, setContentBox] = useState({ left: 0, top: 0, width: 100, height: 100 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const trackElRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>(0);
  const markerDragRef = useRef<string | null>(null);
  const overlayDownRef = useRef<{ x: number; y: number } | null>(null);
  const presetDragRef = useRef<{ scale: number; time: number | null } | null>(null);
  const justDroppedRef = useRef(false);
  /** Remembers where the last zoom was placed so "+ Zoom here" lands sensibly */
  const lastCenterRef = useRef({ x: 0.5, y: 0.5 });

  const { exporting, progress, runExport, cancel } = useZoomExport();

  const selected = keyframes.find((k) => k.id === selectedId) ?? null;
  // Step 1 until the first zoom exists, then step 2. Export section is step 3.
  const step = keyframes.length === 0 ? 1 : 2;

  const applyPreviewTransform = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const z = sampleZoomAt(keyframes, video.currentTime);
    if (!z) {
      video.style.transform = "";
    } else {
      // translate % resolves against element size; combined with scale(s)
      // this keeps point (x,y) centered: offset = s * (center - p)
      video.style.transform = `scale(${z.scale}) translate(${(0.5 - z.x) * 100}%, ${(0.5 - z.y) * 100}%)`;
    }
  }, [keyframes]);

  // Drive the CSS preview transform every frame while playing
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const loop = () => {
      applyPreviewTransform();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, applyPreviewTransform]);

  // Re-apply transform whenever keyframes change while paused
  useEffect(() => {
    if (!playing) applyPreviewTransform();
  }, [keyframes, playing, applyPreviewTransform]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    setDuration(video.duration);
    setView(fullView(video.duration));
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw > 0 && vh > 0) {
      const va = vw / vh;
      if (va >= WRAPPER_ASPECT) {
        const h = (100 * WRAPPER_ASPECT) / va;
        setContentBox({ left: 0, top: (100 - h) / 2, width: 100, height: h });
      } else {
        const w = (100 * va) / WRAPPER_ASPECT;
        setContentBox({ left: (100 - w) / 2, top: 0, width: w, height: 100 });
      }
    }
  };

  const onTimeUpdate = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime;
      setCurrentTime(t);
      // Keep the playhead visible in zoomed timeline views (not while
      // dragging a preset chip — that would fight the user's aim)
      if (!presetDragRef.current && duration > 0) {
        setView((prev) => followView(duration, prev, t));
      }
      if (!playing) applyPreviewTransform();
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      // Restart from beginning when pressing play at the very end
      if (duration > 0 && video.currentTime >= duration - 0.1) video.currentTime = 0;
      video.play().catch(() => {});
      setPlaying(true);
    }
  };

  const seek = useCallback(
    (t: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.min(Math.max(0, t), duration || 0);
    },
    [duration]
  );

  const placeZoom = useCallback(
    (at: number, x: number, y: number, scale?: number) => {
      lastCenterRef.current = { x, y };
      const { keyframes: next, created } = addKeyframe(keyframes, at, x, y, duration || at + 2, scale !== undefined ? { scale } : undefined);
      onKeyframesChange(next);
      setSelectedId(created.id);
    },
    [keyframes, duration, onKeyframesChange]
  );

  /**
   * Tap the video background to add a zoom there (pauses for precision).
   * Implemented with pointer down/up + target check so taps that start on a
   * zoom dot never create a duplicate zoom underneath it.
   */
  const handleOverlayDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    overlayDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleOverlayUp = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const down = overlayDownRef.current;
    overlayDownRef.current = null;
    if (!down || exporting) return;
    // Ignore swipes — only plain taps add a zoom
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved > 12) return;
    const ov = overlayRef.current;
    const video = videoRef.current;
    if (!ov || !video) return;
    const rect = ov.getBoundingClientRect();
    if (rect.width === 0) return;
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    video.pause();
    setPlaying(false);
    placeZoom(video.currentTime, nx, ny);
  };

  /** Big friendly button: adds a zoom right now, no aiming needed */
  const handleAddZoomHere = () => {
    const video = videoRef.current;
    if (!video || exporting) return;
    placeZoom(video.currentTime, lastCenterRef.current.x, lastCenterRef.current.y);
  };

  // ─── Draggable zoom presets: drop a chip on the timeline ───
  const trackTimeAt = useCallback(
    (clientX: number, clientY: number): number | null => {
      const el = trackElRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return null;
      if (clientX < rect.left - 8 || clientX > rect.right + 8 || clientY < rect.top - 16 || clientY > rect.bottom + 16) {
        return null;
      }
      const ratio = (clientX - rect.left) / rect.width;
      return Math.min(duration, Math.max(0, ratioToViewTime(ratio, view)));
    },
    [view, duration]
  );

  const onPresetDown = (e: React.PointerEvent, scale: number) => {
    if (exporting) return;
    e.preventDefault();
    presetDragRef.current = { scale, time: trackTimeAt(e.clientX, e.clientY) };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setPresetDrag({ scale, x: e.clientX, y: e.clientY, time: presetDragRef.current.time });
  };

  const onPresetMove = (e: React.PointerEvent) => {
    if (!presetDragRef.current) return;
    const time = trackTimeAt(e.clientX, e.clientY);
    presetDragRef.current = { ...presetDragRef.current, time };
    setPresetDrag((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY, time } : prev));
  };

  const onPresetUp = () => {
    const dropped = presetDragRef.current;
    presetDragRef.current = null;
    setPresetDrag(null);
    if (dropped && dropped.time !== null) {
      justDroppedRef.current = true;
      placeZoom(dropped.time, lastCenterRef.current.x, lastCenterRef.current.y, dropped.scale);
    }
  };

  /** Keyboard / tap fallback: Enter or tap adds the preset at the playhead */
  const onPresetActivate = (scale: number) => {
    if (justDroppedRef.current) {
      justDroppedRef.current = false;
      return;
    }
    const video = videoRef.current;
    if (!video || exporting) return;
    placeZoom(video.currentTime, lastCenterRef.current.x, lastCenterRef.current.y, scale);
  };

  /** Drag a dot on the video to move that zoom's focus point */
  const onMarkerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    markerDragRef.current = id;
    setSelectedId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMarkerMove = (e: React.PointerEvent) => {
    const id = markerDragRef.current;
    const ov = overlayRef.current;
    if (!id || !ov) return;
    const rect = ov.getBoundingClientRect();
    if (rect.width === 0) return;
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    const target = keyframes.find((k) => k.id === id);
    if (!target) return;
    const c = clampZoomCenter(nx, ny, target.scale);
    lastCenterRef.current = c;
    onKeyframesChange(keyframes.map((k) => (k.id === id ? { ...k, x: c.x, y: c.y } : k)));
  };

  const onMarkerUp = () => {
    markerDragRef.current = null;
  };

  const updateSelected = (patch: Partial<ZoomKeyframe>) => {
    if (!selectedId) return;
    onKeyframesChange(
      keyframes.map((k) => {
        if (k.id !== selectedId) return k;
        const next = { ...k, ...patch };
        if (patch.scale !== undefined || patch.x !== undefined || patch.y !== undefined) {
          const c = clampZoomCenter(next.x, next.y, next.scale);
          next.x = c.x;
          next.y = c.y;
          next.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
          lastCenterRef.current = { x: next.x, y: next.y };
        }
        return next;
      })
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    onKeyframesChange(keyframes.filter((k) => k.id !== selectedId));
    setSelectedId(null);
  };

  const handleExport = async () => {
    setExportError(null);
    try {
      const result = await runExport({ videoUrl, duration, keyframes });
      onExported(result);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed. Please try again.");
    }
  };

  const longVideo = duration > 300;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all"
          aria-label="Back to recording preview"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-accent" />
            Auto-Zoom Editor
          </h3>
        </div>
      </div>

      {/* 3-step progress */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Steps">
        {["Add zooms", "Adjust", "Export"].map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li
              key={label}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-semibold ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : done
                    ? "border-border bg-surface text-text-secondary"
                    : "border-border text-text-secondary/60"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold shrink-0 ${
                  active ? "bg-accent text-white" : "bg-border-soft text-text-secondary"
                }`}
              >
                {n}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {exportError && (
        <div className="p-4 rounded-xl bg-error-soft border border-error-border text-error-text text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Step 1+2: preview + timeline */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden select-none">
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            preload="metadata"
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onEnded={() => setPlaying(false)}
            className="absolute inset-0 w-full h-full object-contain will-change-transform pointer-events-none"
          />
          {/* Click / dot layer, aligned exactly with the video picture */}
          <div
            ref={overlayRef}
            onPointerDown={handleOverlayDown}
            onPointerUp={handleOverlayUp}
            onPointerCancel={() => (overlayDownRef.current = null)}
            className="absolute cursor-crosshair touch-none"
            style={{
              left: `${contentBox.left}%`,
              top: `${contentBox.top}%`,
              width: `${contentBox.width}%`,
              height: `${contentBox.height}%`,
            }}
            title="Tap to add a zoom here"
          >
            {keyframes.map((k) => (
              <span
                key={k.id}
                onPointerDown={(e) => onMarkerDown(e, k.id)}
                onPointerMove={onMarkerMove}
                onPointerUp={onMarkerUp}
                onPointerCancel={onMarkerUp}
                title="Drag to move this zoom"
                className={`absolute -ml-4 -mt-4 w-8 h-8 rounded-full border-[3px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none ${
                  k.id === selectedId
                    ? "border-accent bg-accent/40 shadow-lg scale-110"
                    : "border-white/90 bg-accent/50 shadow"
                }`}
                style={{ left: `${k.x * 100}%`, top: `${k.y * 100}%` }}
              >
                <span className="text-[10px] font-bold text-white drop-shadow">{k.scale.toFixed(1)}x</span>
              </span>
            ))}
          </div>

          {keyframes.length === 0 && (
            <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none px-4">
              <div className="animate-bounce px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold shadow-lg flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" />
                Tap the video where you want to zoom in
              </div>
            </div>
          )}
        </div>

        {/* Transport + one-tap add */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button variant="secondary" onClick={togglePlay} className="flex items-center gap-2 min-w-[100px] justify-center">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            {playing ? "Pause" : "Play"}
          </Button>
          <Button variant="primary" onClick={handleAddZoomHere} className="flex-1 flex items-center justify-center gap-2 min-h-[44px]">
            <ZoomIn className="w-4 h-4" />
            + Zoom here
          </Button>
          <div className="font-mono text-sm font-semibold px-3 py-1.5 bg-surface-raised border border-border rounded-lg whitespace-nowrap">
            {formatTimeShort(currentTime)} / {formatTimeShort(duration)}
          </div>
        </div>

        <ZoomTimeline
          duration={duration}
          sourceVideoUrl={videoUrl}
          keyframes={keyframes}
          selectedId={selectedId}
          currentTime={currentTime}
          view={view}
          onViewChange={setView}
          dropActive={presetDrag !== null && presetDrag.time !== null}
          onTrackElement={(el) => {
            trackElRef.current = el;
          }}
          onSeek={seek}
          onSelect={setSelectedId}
          onChange={onKeyframesChange}
        />

        {/* Draggable zoom presets */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-secondary">
            Drag a zoom onto the timeline <span className="font-normal">(or tap one to add it now)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[1.5, 1.8, 2.5].map((scale) => (
              <button
                key={scale}
                type="button"
                onPointerDown={(e) => onPresetDown(e, scale)}
                onPointerMove={onPresetMove}
                onPointerUp={onPresetUp}
                onPointerCancel={onPresetUp}
                onClick={() => onPresetActivate(scale)}
                className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-accent/50 bg-accent/5 px-2 py-3 text-sm font-bold text-accent touch-none select-none cursor-grab active:cursor-grabbing hover:bg-accent/10 active:bg-accent/15 transition-colors min-h-[52px]"
                aria-label={`Add ${scale}x zoom. Drag onto the timeline or activate to add at the current moment.`}
                title="Drag onto the timeline, or tap to add at the current moment"
              >
                <GripVertical className="w-4 h-4 shrink-0 opacity-70" />
                {scale}x
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-text-secondary">
          Tip: drag the numbered dots on the video to move a zoom. Tap a timeline block to edit it below.
        </p>
      </div>

      {/* Selected zoom controls */}
      {selected && (
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              Zoom {selected.scale.toFixed(1)}x · {formatTimeShort(selected.start)} – {formatTimeShort(selected.end)}
            </h4>
            <button
              type="button"
              onClick={deleteSelected}
              className="flex items-center gap-1.5 text-xs font-semibold text-error-text hover:opacity-80 px-3 py-2 rounded-lg min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-text-secondary">
              How strong: {selected.scale.toFixed(1)}x
            </label>
            <RangeSlider
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              value={selected.scale}
              onChange={(v) => updateSelected({ scale: v })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2 text-text-secondary">Direction</label>
            <Segmented
              value={selected.mode}
              onChange={(v) => updateSelected({ mode: v as ZoomMode })}
              options={[
                { value: "in", label: "Zoom in" },
                { value: "out", label: "Zoom out" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Floating ghost that follows the finger while dragging a preset */}
      {presetDrag && (
        <div
          className="fixed z-[80] pointer-events-none -translate-x-1/2 -translate-y-[130%] max-w-[90vw]"
          style={{ left: presetDrag.x, top: presetDrag.y }}
          aria-hidden="true"
        >
          <div
            className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold shadow-xl whitespace-nowrap ${
              presetDrag.time !== null
                ? "bg-accent border-accent text-white"
                : "bg-surface-raised border-border text-text-secondary"
            }`}
          >
            <ZoomIn className="w-4 h-4" />
            {presetDrag.scale}x
            {presetDrag.time !== null && <span className="font-mono">· {formatTimeShort(presetDrag.time)}</span>}
          </div>
          {presetDrag.time === null && (
            <p className="mt-1 text-center text-[11px] font-semibold text-text-secondary bg-surface-raised/90 rounded-full px-2 py-0.5">
              Drop on the timeline
            </p>
          )}
        </div>
      )}

      {/* Step 3: export */}
      <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        {longVideo && (
          <p className="text-xs text-warning-text bg-warning-soft border border-warning-border rounded-xl px-3 py-2">
            This recording is over 5 minutes — export runs in real time and needs this tab to stay visible.
          </p>
        )}
        {exporting ? (
          <div className="space-y-3">
            <div className="h-2.5 rounded-full bg-border-soft overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-[width] duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium">
                Making your video… {Math.round(progress * 100)}%
              </span>
              <Button variant="secondary" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={keyframes.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 text-base"
          >
            <Download className="w-5 h-5" />
            Export My Video
          </Button>
        )}
        {keyframes.length === 0 && !exporting && (
          <p className="text-xs text-text-secondary text-center">
            Press <strong>+ Zoom here</strong> or tap the video to add your first zoom.
          </p>
        )}
      </div>
    </div>
  );
}
