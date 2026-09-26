"use client";

export type ZoomMode = "in" | "out";

export interface ZoomKeyframe {
  id: string;
  /** seconds: when the zoom transition starts */
  start: number;
  /** seconds: when the zoom starts easing back out */
  end: number;
  /** zoom center, normalized 0–1 */
  x: number;
  y: number;
  /** peak magnification, e.g. 1.8 = 180% */
  scale: number;
  mode: ZoomMode;
}

export interface SampledZoom {
  scale: number;
  x: number;
  y: number;
}

export const MIN_SCALE = 1.2;
export const MAX_SCALE = 3;
export const DEFAULT_SCALE = 1.8;
export const DEFAULT_HOLD = 1.2;
export const MIN_ZOOM_DURATION = 0.4;
/** seconds spent easing in and out of each zoom */
export const ZOOM_TRANSITION = 0.45;

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `zoom-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

/**
 * Clamp a zoom center so the cropped frame never shows outside the video.
 * scale 1 => center forced to 0.5,0.5. Larger scales allow more travel.
 */
export function clampZoomCenter(x: number, y: number, scale: number): { x: number; y: number } {
  const s = Math.max(1, scale);
  const half = 0.5 / s;
  return {
    x: Math.min(1 - half, Math.max(half, x)),
    y: Math.min(1 - half, Math.max(half, y)),
  };
}

/**
 * Sample the effective zoom at time t (seconds).
 * Returns null when the frame should be shown unzoomed.
 * When keyframes overlap, the one with the latest start wins.
 */
export function sampleZoomAt(keyframes: ZoomKeyframe[], t: number): SampledZoom | null {
  let active: ZoomKeyframe | null = null;
  for (const k of keyframes) {
    if (t >= k.start && t <= k.end + ZOOM_TRANSITION) {
      if (!active || k.start >= active.start) active = k;
    }
  }
  if (!active) return null;

  const { start, end, scale, mode } = active;
  const center = clampZoomCenter(active.x, active.y, scale);

  let progress: number; // 0 = full frame, 1 = fully zoomed
  if (t < start + ZOOM_TRANSITION && start + ZOOM_TRANSITION > start) {
    progress = easeInOut((t - start) / ZOOM_TRANSITION);
  } else if (t <= end) {
    progress = 1;
  } else {
    progress = 1 - easeInOut((t - end) / ZOOM_TRANSITION);
  }

  // "out" mode inverts the envelope: starts zoomed, dips to full frame, returns
  const p = mode === "in" ? progress : 1 - progress;
  if (p <= 0.001) return null;

  const s = 1 + (scale - 1) * p;
  // Pan travels with the same envelope so motion feels locked together
  return {
    scale: s,
    x: 0.5 + (center.x - 0.5) * p,
    y: 0.5 + (center.y - 0.5) * p,
  };
}

/**
 * Build a new keyframe at time `at`, removing any existing keyframes that
 * overlap its range so the timeline stays deterministic. Returns the new list.
 */
export function addKeyframe(
  keyframes: ZoomKeyframe[],
  at: number,
  x: number,
  y: number,
  duration: number,
  opts?: { scale?: number; hold?: number; mode?: ZoomMode }
): { keyframes: ZoomKeyframe[]; created: ZoomKeyframe } {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, opts?.scale ?? DEFAULT_SCALE));
  const hold = Math.max(MIN_ZOOM_DURATION, opts?.hold ?? DEFAULT_HOLD);
  const center = clampZoomCenter(x, y, scale);
  const start = Math.max(0, at);
  const end = Math.min(Math.max(start + MIN_ZOOM_DURATION, duration), start + hold);

  const created: ZoomKeyframe = {
    id: makeId(),
    start,
    end,
    x: center.x,
    y: center.y,
    scale,
    mode: opts?.mode ?? "in",
  };

  const kept = keyframes.filter((k) => k.end <= start || k.start >= end);
  return { keyframes: [...kept, created].sort((a, b) => a.start - b.start), created };
}

/** Clamp a moved/resized keyframe against its timeline neighbors. */
export function clampToNeighbors(
  keyframes: ZoomKeyframe[],
  id: string,
  start: number,
  end: number,
  duration: number
): { start: number; end: number } {
  const sorted = [...keyframes].sort((a, b) => a.start - b.start);
  const idx = sorted.findIndex((k) => k.id === id);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;

  let s = Math.max(0, start);
  let e = Math.min(duration, end);
  if (prev) s = Math.max(s, prev.end);
  if (next) e = Math.min(e, next.start);
  if (e - s < MIN_ZOOM_DURATION) {
    // Keep original position if the move doesn't fit
    const orig = sorted[idx];
    return { start: orig.start, end: orig.end };
  }
  return { start: s, end: e };
}

export function formatTimeShort(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Timeline viewport (zoomable / pannable ruler) ───

/** Tightest timeline view in seconds — full precision for placing zooms */
export const VIEW_MIN_SPAN = 5;

export interface TimelineView {
  /** visible window start, seconds */
  start: number;
  /** visible window length, seconds */
  span: number;
}

/** Full-video view (used on load and by the Fit button) */
export function fullView(duration: number): TimelineView {
  const d = Math.max(0.5, duration);
  return { start: 0, span: d };
}

function clampView(duration: number, start: number, span: number): TimelineView {
  const d = Math.max(0.5, duration);
  const s = Math.min(d, Math.max(Math.min(VIEW_MIN_SPAN, d), span));
  return { start: Math.min(Math.max(0, d - s), Math.max(0, start)), span: s };
}

/** Zoom the timeline view. factor > 1 zooms in (window shrinks). */
export function zoomView(duration: number, view: TimelineView, factor: number, anchor?: number): TimelineView {
  const a = anchor ?? view.start + view.span / 2;
  const span = view.span / factor;
  const start = a - (a - view.start) / factor;
  return clampView(duration, start, span);
}

/** Pan the view so `time` stays visible (with a small margin), for playhead follow */
export function followView(duration: number, view: TimelineView, time: number): TimelineView {
  const margin = view.span * 0.08;
  if (time < view.start + margin) return clampView(duration, time - margin, view.span);
  if (time > view.start + view.span - margin) return clampView(duration, time - view.span + margin, view.span);
  return view;
}

/** Track ratio 0–1 → seconds within the current view */
export function ratioToViewTime(ratio: number, view: TimelineView): number {
  return view.start + Math.min(1, Math.max(0, ratio)) * view.span;
}

/** Seconds → track ratio 0–1 within the current view */
export function viewTimeToRatio(t: number, view: TimelineView): number {
  if (view.span <= 0) return 0;
  return Math.min(1, Math.max(0, (t - view.start) / view.span));
}

/** Step between ruler tick labels for a given visible span */
export function viewTickStep(span: number): number {
  if (span <= 8) return 1;
  if (span <= 20) return 2;
  if (span <= 45) return 5;
  if (span <= 120) return 10;
  if (span <= 300) return 30;
  return 60;
}
