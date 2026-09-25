"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Chip } from "@/components/ui/Chip";
import { TrimRange } from "@/components/ui/TrimRange";
import {
  Download,
  Film,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  Clock,
  Ruler,
  Camera,
  Layers,
} from "lucide-react";
import JSZip from "jszip";

type OutputFormat = "image/jpeg" | "image/png";
type ExtractMode = "fps" | "interval";

interface ExtractedFrame {
  blob: Blob;
  timestamp: number;
  index: number;
  url: string;
}

interface SizePreset {
  label: string;
  w: number;
  h: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { label: "Original", w: 0, h: 0 },
  { label: "1920×1080", w: 1920, h: 1080 },
  { label: "1280×720", w: 1280, h: 720 },
  { label: "854×480", w: 854, h: 480 },
  { label: "640×360", w: 640, h: 360 },
];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTime(str: string): number {
  const parts = str.split(":");
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  return parseFloat(str) || 0;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function safeDuration(d: number): number {
  return isFinite(d) && d > 0 ? d : 0;
}

function extractFrames(
  videoFile: File,
  timestamps: number[],
  format: OutputFormat,
  quality: number,
  targetW: number,
  targetH: number,
  srcW: number,
  srcH: number,
  onProgress: (current: number, total: number) => void
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    let cancelled = false;

    const blobUrl = URL.createObjectURL(videoFile);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const frames: ExtractedFrame[] = [];
    let currentIndex = 0;
    let ready = false;

    const outW = targetW > 0 ? targetW : srcW;
    const outH = targetH > 0 ? targetH : srcH;

    const seekHandler = () => {
      if (cancelled || !ready) return;

      ctx.drawImage(video, 0, 0, outW, outH);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0) {
            const url = URL.createObjectURL(blob);
            frames.push({
              blob,
              timestamp: timestamps[currentIndex],
              index: currentIndex,
              url,
            });
          }
          currentIndex++;
          onProgress(currentIndex, timestamps.length);
          setTimeout(processNext, 0);
        },
        format,
        format === "image/jpeg" ? quality : undefined
      );
    };

    function processNext() {
      if (cancelled || currentIndex >= timestamps.length) {
        video.remove();
        URL.revokeObjectURL(blobUrl);
        resolve(frames);
        return;
      }
      video.addEventListener("seeked", seekHandler, { once: true });
      video.currentTime = timestamps[currentIndex];
    }

    function start() {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        video.remove();
        URL.revokeObjectURL(blobUrl);
        reject(new Error("Could not determine video dimensions. The file may be unsupported."));
        return;
      }
      canvas.width = outW;
      canvas.height = outH;
      ready = true;
      processNext();
    }

    video.onloadedmetadata = () => {
      console.log("[extractFrames] loadedmetadata: duration=", video.duration, "dimensions=", video.videoWidth, "x", video.videoHeight, "readyState=", video.readyState);
    };

    video.onloadeddata = () => {
      console.log("[extractFrames] loadeddata: duration=", video.duration, "dimensions=", video.videoWidth, "x", video.videoHeight, "readyState=", video.readyState);
      start();
    };

    video.onerror = () => {
      console.warn("[extractFrames] error event, networkState=", video.networkState, "error=", video.error?.message);
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load video. The file may be unsupported or corrupted."));
    };

    console.log("[extractFrames] Setting src:", blobUrl);
    video.src = blobUrl;

    return () => {
      cancelled = true;
      video.remove();
      URL.revokeObjectURL(blobUrl);
    };
  });
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: () => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </div>
  );
}

export default function VideoToFrames() {
  const [phase, setPhase] = useState<"input" | "settings" | "extracting" | "results">("input");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const [mode, setMode] = useState<ExtractMode>("fps");
  const [fpsValue, setFpsValue] = useState(5);
  const [intervalSec, setIntervalSec] = useState(2);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [jpgQuality, setJpgQuality] = useState(92);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [sizePreset, setSizePreset] = useState(0);
  const [customW, setCustomW] = useState(0);
  const [customH, setCustomH] = useState(0);
  const [zipOnly, setZipOnly] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState(0);

  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const frameUrlsRef = useRef<string[]>([]);
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("[VideoToFrames] effect running, videoUrl:", videoUrl);
    mountedRef.current = true;
    const el = playerRef.current;

    const onMeta = () => {
      if (!mountedRef.current || !el) return;
      const dur = el.duration;
      console.log("[VideoToFrames] loadedmetadata (DOM listener), duration:", dur, "readyState:", el.readyState, "dimensions:", el.videoWidth, "x", el.videoHeight);
      if (safeDuration(dur) > 0) {
        setVideoDuration(dur);
        setEndTime(dur);
      }
      if (el.videoWidth > 0) setVideoWidth(el.videoWidth);
      if (el.videoHeight > 0) setVideoHeight(el.videoHeight);
      setMetaLoaded(true);
    };

    if (el) {
      el.addEventListener("loadedmetadata", onMeta);
      if (el.readyState >= 1) {
        console.log("[VideoToFrames] metadata already available (readyState >= 1), reading duration:", el.duration);
        onMeta();
      }
    }

    return () => {
      if (el) el.removeEventListener("loadedmetadata", onMeta);
      console.log("[VideoToFrames] effect cleanup, videoUrl:", videoUrl);
      mountedRef.current = false;
      frameUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFiles = useCallback((files: File[]) => {
    const file = files.find(
      (f) => f.type.startsWith("video/") || f.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)
    );
    if (!file) {
      setError("Please select a valid video file (MP4, MOV, or WebM).");
      return;
    }
    const url = URL.createObjectURL(file);
    console.log("[VideoToFrames] handleFiles: name=", file.name, "size=", file.size, "type=", file.type);
    setVideoFile(file);
    setVideoUrl(url);
    setError("");
    setFrames([]);
    setMetaLoaded(false);
    setPhase("settings");
  }, []);

  const onPlayerMetaLoad = useCallback(() => {
    const el = playerRef.current;
    if (!el || !mountedRef.current) {
      console.warn("[VideoToFrames] onLoadedMetadata skipped: el=", !!el, "mounted=", mountedRef.current);
      return;
    }
    const dur = el.duration;
    console.log("[VideoToFrames] onLoadedMetadata (React prop): duration=", dur, "readyState=", el.readyState, "dimensions=", el.videoWidth, "x", el.videoHeight);
    if (safeDuration(dur) > 0) {
      setVideoDuration(dur);
      setEndTime(dur);
    }
    if (el.videoWidth > 0) setVideoWidth(el.videoWidth);
    if (el.videoHeight > 0) setVideoHeight(el.videoHeight);
    setMetaLoaded(true);
    if (safeDuration(dur) === 0) {
      console.warn("[VideoToFrames] onLoadedMetadata fired but safeDuration returned 0 for duration:", dur);
    }
  }, []);

  const dur = safeDuration(videoDuration);
  const srcW = videoWidth;
  const srcH = videoHeight;

  const preset = SIZE_PRESETS[sizePreset];
  const targetW = preset ? (preset.w > 0 ? preset.w : srcW) : customW;
  const targetH = preset ? (preset.h > 0 ? preset.h : srcH) : customH;

  const effectiveStart = Math.max(0, Math.min(startTime, dur));
  const effectiveEnd = Math.max(effectiveStart, Math.min(endTime, dur));
  const rangeDur = effectiveEnd - effectiveStart;

  const recalcEstimate = useCallback(() => {
    if (dur === 0 || rangeDur <= 0) { setEstimatedCount(0); return; }
    let count = 0;
    if (mode === "fps") {
      count = Math.ceil(rangeDur * fpsValue);
    } else {
      count = Math.ceil(rangeDur / intervalSec);
    }
    setEstimatedCount(Number.isFinite(count) ? count : 0);
  }, [dur, rangeDur, mode, fpsValue, intervalSec]);

  useEffect(() => { recalcEstimate(); }, [recalcEstimate]);

  const buildTimestamps = useCallback((): number[] => {
    if (dur === 0 || rangeDur <= 0) return [];
    const timestamps: number[] = [];
    if (mode === "fps") {
      const step = 1 / fpsValue;
      for (let t = effectiveStart; t < effectiveEnd; t += step) {
        timestamps.push(Math.min(t, effectiveEnd - 0.01));
      }
    } else {
      for (let t = effectiveStart; t < effectiveEnd; t += intervalSec) {
        timestamps.push(Math.min(t, effectiveEnd - 0.01));
      }
    }
    return timestamps;
  }, [dur, mode, fpsValue, intervalSec, effectiveStart, effectiveEnd, rangeDur]);

  const startExtraction = async () => {
    if (!videoFile) return;
    console.log("[VideoToFrames] startExtraction: dur=", dur, "metaLoaded=", metaLoaded, "videoDuration state=", videoDuration, "playerRef.current?.duration=", playerRef.current?.duration);
    if (dur === 0) {
      console.warn("[VideoToFrames] Aborting extraction — dur is 0. playerRef.current?.duration=", playerRef.current?.duration, "readyState=", playerRef.current?.readyState);
      setError("Video duration could not be determined.");
      return;
    }
    if (rangeDur <= 0) { setError("Start time must be before end time."); return; }

    mountedRef.current = true;
    setPhase("extracting");
    setError("");

    const timestamps = buildTimestamps();
    if (timestamps.length === 0) timestamps.push(effectiveStart);

    setProgress({ current: 0, total: timestamps.length });

    try {
      const quality = jpgQuality / 100;
      const result = await extractFrames(
        videoFile,
        timestamps,
        format,
        quality,
        targetW,
        targetH,
        srcW,
        srcH,
        (current, total) => { if (mountedRef.current) setProgress({ current, total }); }
      );

      if (!mountedRef.current) return;

      if (result.length === 0) {
        setError("No frames were extracted. The video may be too short or unreadable.");
        setPhase("settings");
        return;
      }

      frameUrlsRef.current = result.map((f) => f.url);
      setFrames(result);
      setPhase("results");
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e.message || "Failed to extract frames.");
        setPhase("settings");
      }
    }
  };

  const downloadFrame = (frame: ExtractedFrame) => {
    const ext = format === "image/jpeg" ? "jpg" : "png";
    const a = document.createElement("a");
    a.href = frame.url;
    a.download = `frame-${String(frame.index + 1).padStart(4, "0")}.${ext}`;
    a.click();
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    const ext = format === "image/jpeg" ? "jpg" : "png";
    for (const frame of frames) {
      const buf = await frame.blob.arrayBuffer();
      zip.file(`frame-${String(frame.index + 1).padStart(4, "0")}.${ext}`, buf);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = `${(videoFile?.name || "video").replace(/\.[^.]+$/, "")}-frames.zip`;
    a.click();
    URL.revokeObjectURL(zipUrl);
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setPhase("input");
    setVideoFile(null);
    setVideoUrl("");
    setVideoDuration(0);
    setEndTime(0);
    setFrames([]);
    setError("");
    setProgress({ current: 0, total: 0 });
    setMetaLoaded(false);
  };

  const tooLarge = videoFile && videoFile.size > 200 * 1024 * 1024;
  const tooLong = dur > 300;
  const hugeExtraction = estimatedCount > 500;
  const extractingPct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <ToolLayout title="" description="">
      {phase === "input" && (
        <div>
          <DropZone
            onFiles={handleFiles}
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska"
            label="Drop a video here or click to browse"
          />
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <Chip>MP4</Chip>
            <Chip>MOV</Chip>
            <Chip>WebM</Chip>
            <Chip tone="accent">100% private — never uploaded</Chip>
          </div>
        </div>
      )}

      {phase === "settings" && videoFile && videoUrl && (
        <div className="space-y-5">
          <div className="bg-surface rounded-2xl border border-border-soft shadow-xs overflow-hidden">
            <video
              ref={playerRef}
              src={videoUrl}
              controls
              preload="auto"
              className="w-full max-h-[400px] object-contain bg-black"
              onLoadedMetadata={onPlayerMetaLoad}
              onLoadedData={onPlayerMetaLoad}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{videoFile.name}</p>
              <p className="text-xs text-text-secondary">{formatSize(videoFile.size)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              Change
            </Button>
          </div>

          {metaLoaded && dur > 0 && (
            <div className="flex flex-wrap gap-2">
              <Chip icon={<Clock />}>{formatTime(dur)}</Chip>
              <Chip icon={<Ruler />}>{srcW > 0 ? `${srcW}×${srcH}` : "—"}</Chip>
              <Chip icon={<Layers />}>~{estimatedCount.toLocaleString()} frames</Chip>
              <Chip icon={<Film />}>{format === "image/jpeg" ? "JPG" : "PNG"}</Chip>
              {(targetW > 0 && targetH > 0 && (preset.w > 0 || customW > 0)) && (
                <Chip tone="accent" icon={<Camera />}>Output {targetW}×{targetH}</Chip>
              )}
            </div>
          )}

          <div className="bg-surface rounded-2xl border border-border-soft shadow-xs overflow-hidden divide-y divide-border-soft">
            {/* Time range */}
            <section className="px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-heading font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-secondary" /> Time Range
                </h2>
                {metaLoaded && (
                  <span className="text-xs text-text-secondary font-mono">
                    {formatTime(effectiveStart)} – {formatTime(effectiveEnd)}
                  </span>
                )}
              </div>
              <TrimRange
                min={0}
                max={dur}
                start={effectiveStart}
                end={effectiveEnd}
                disabled={!metaLoaded || dur === 0}
                onChange={(s, e) => {
                  setStartTime(s);
                  setEndTime(e);
                }}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">Start time</label>
                  <input
                    type="text"
                    value={formatTime(startTime)}
                    onChange={(e) => setStartTime(parseTime(e.target.value))}
                    placeholder="0:00"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-border-soft bg-surface-hover text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">End time</label>
                  <input
                    type="text"
                    value={formatTime(endTime)}
                    onChange={(e) => setEndTime(parseTime(e.target.value))}
                    placeholder={metaLoaded ? formatTime(dur) : "0:00"}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-border-soft bg-surface-hover text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Output size */}
            <section className="px-5 py-5">
              <h2 className="text-sm font-heading font-semibold flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4 text-text-secondary" /> Output Size
              </h2>
              <Segmented
                value={String(sizePreset)}
                onChange={(v) => setSizePreset(Number(v))}
                options={SIZE_PRESETS.map((p, i) => ({ value: String(i), label: p.label }))}
              />
              {metaLoaded && sizePreset === 0 && (
                <p className="text-[11px] text-text-secondary/70 mt-2">
                  Output at original video resolution ({srcW}x{srcH})
                </p>
              )}
            </section>

            {/* Extraction */}
            <section className="px-5 py-5">
              <h2 className="text-sm font-heading font-semibold flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-text-secondary" /> Extraction
              </h2>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: "fps" as const, label: "Frames per second" },
                  { value: "interval" as const, label: "Every N seconds" },
                ]}
              />
              <div className="mt-5">
                {mode === "fps" ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-text-secondary">Frame rate</label>
                      <span className="text-sm font-semibold text-text-primary font-mono">
                        {fpsValue} fps
                      </span>
                    </div>
                    <RangeSlider
                      min={0.1}
                      max={60}
                      step={0.1}
                      value={fpsValue}
                      onChange={setFpsValue}
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary/60 mt-1">
                      <span>0.1</span>
                      <span>60</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-text-secondary">Interval</label>
                      <span className="text-sm font-semibold text-text-primary font-mono">
                        {intervalSec}s
                      </span>
                    </div>
                    <RangeSlider
                      min={0.5}
                      max={60}
                      step={0.5}
                      value={intervalSec}
                      onChange={setIntervalSec}
                    />
                    <div className="flex justify-between text-[10px] text-text-secondary/60 mt-1">
                      <span>0.5s</span>
                      <span>60s</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Output format */}
            <section className="px-5 py-5">
              <h2 className="text-sm font-heading font-semibold flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-text-secondary" /> Output Format
              </h2>
              <Segmented
                value={format}
                onChange={setFormat}
                options={[
                  { value: "image/jpeg" as const, label: "JPG", icon: <ImageIcon className="w-3.5 h-3.5" /> },
                  { value: "image/png" as const, label: "PNG", icon: <ImageIcon className="w-3.5 h-3.5" /> },
                ]}
              />
              {format === "image/jpeg" && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-text-secondary">Quality</label>
                    <span className="text-sm font-semibold text-text-primary font-mono">{jpgQuality}%</span>
                  </div>
                  <RangeSlider
                    min={10}
                    max={100}
                    step={1}
                    value={jpgQuality}
                    onChange={setJpgQuality}
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary/60 mt-1">
                    <span>10%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </section>

            {/* ZIP only */}
            <section className="px-5 py-5">
              <Toggle
                checked={zipOnly}
                onChange={() => setZipOnly(!zipOnly)}
                label="ZIP only"
                description="Skip the preview grid and go straight to download"
              />
            </section>
          </div>

          {(hugeExtraction || tooLarge || tooLong) && (
            <div className="flex items-start gap-2.5 text-xs text-warning-text bg-warning-soft px-4 py-3 rounded-2xl border border-warning-border">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {hugeExtraction && `This will extract ~${estimatedCount.toLocaleString()} frames. `}
                {tooLarge && "This video is larger than 200MB. "}
                {tooLong && "This video is longer than 5 minutes. "}
                Processing may be slow — consider lowering the frame rate or narrowing the time range.
              </span>
            </div>
          )}

          {error && (
            <div className="text-sm text-error-text bg-error-soft/80 dark:bg-error-soft px-4 py-3 rounded-2xl border border-red-200/70 dark:border-red-900">
              {error}
            </div>
          )}

          <ResultPanel
            actionLabel="Extract Frames"
            onAction={startExtraction}
            onReset={reset}
            resetLabel="Start Over"
          />
        </div>
      )}

      {phase === "extracting" && (
        <div className="bg-surface rounded-2xl border border-border-soft shadow-xs p-8 text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <Loader2 className="w-14 h-14 animate-spin text-accent" />
          </div>
          <p className="text-base font-heading font-semibold text-text-primary">Extracting frames...</p>
          <p className="text-xs text-text-secondary mt-1">
            Frame {progress.current} of {progress.total}
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span>{extractingPct}%</span>
              <span className="font-mono">{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-border-soft rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-200 ease-out"
                style={{ width: `${extractingPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="space-y-4">
          {zipOnly ? (
            <div className="bg-surface rounded-2xl border border-border-soft shadow-xs p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <Film className="w-6 h-6 text-accent" />
              </div>
              <p className="text-base font-heading font-semibold text-text-primary">
                {frames.length} frame{frames.length !== 1 ? "s" : ""} extracted
              </p>
              {(targetW > 0 && targetH > 0) && (
                <p className="text-xs text-text-secondary">
                  Resolution: {targetW}×{targetH} &middot; Format: {format === "image/jpeg" ? "JPG" : "PNG"}
                </p>
              )}
              <div className="pt-2">
                <Button size="lg" onClick={downloadAllAsZip}>
                  <Download className="w-4 h-4" />
                  Download ZIP ({frames.length} frames)
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">
                  {frames.length} frame{frames.length !== 1 ? "s" : ""} extracted
                  {(targetW > 0 && targetH > 0) && (
                    <span className="text-xs text-text-secondary ml-2">
                      &middot; {targetW}×{targetH} &middot; {format === "image/jpeg" ? "JPG" : "PNG"}
                    </span>
                  )}
                </p>
                <Button onClick={downloadAllAsZip}>
                  <Download className="w-4 h-4" />
                  Download All as ZIP
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {frames.map((frame) => (
                  <div key={frame.index} className="group relative bg-surface rounded-2xl border border-border-soft shadow-xs overflow-hidden transition-shadow hover:shadow-md">
                    <div className="aspect-video bg-black/5 overflow-hidden">
                      <img
                        src={frame.url}
                        alt={`Frame ${frame.index + 1}`}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-text-secondary font-mono">#{frame.index + 1}</span>
                      <span className="text-[10px] text-text-secondary/50 font-mono">
                        {formatTime(frame.timestamp)}
                      </span>
                      <button
                        onClick={() => downloadFrame(frame)}
                        className="text-[10px] text-accent hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <ResultPanel
            onDownload={downloadAllAsZip}
            downloadLabel={zipOnly ? `Download ZIP (${frames.length} frames)` : "Download All as ZIP"}
            onReset={reset}
            resetLabel="Start Over"
            sourceToolSlug="video-to-frames"
            outputType="image"
          />
        </div>
      )}
    </ToolLayout>
  );
}
