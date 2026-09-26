"use client";

import { useRef, useState, useCallback } from "react";
import { sampleZoomAt, clampZoomCenter, type ZoomKeyframe } from "./zoomTypes";

export interface ZoomExportResult {
  blob: Blob;
  url: string;
  mimeType: string;
}

interface ExportOptions {
  videoUrl: string;
  duration: number;
  keyframes: ZoomKeyframe[];
  onProgress?: (ratio: number) => void;
}

function pickMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
}

/**
 * Re-encodes a video with zoom keyframes applied, entirely in-browser:
 * hidden <video> playback -> canvas draw of the zoomed crop every frame ->
 * canvas.captureStream -> MediaRecorder. Audio is captured silently through
 * WebAudio (element source -> stream destination, never connected to speakers)
 * so exporting doesn't blast sound. Falls back to silent video if audio
 * capture isn't available.
 */
export function useZoomExport() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const runExport = useCallback(
    async ({ videoUrl, duration, keyframes, onProgress }: ExportOptions): Promise<ZoomExportResult> => {
      cancelRef.current = false;
      setExporting(true);
      setProgress(0);

      const cleanup: Array<() => void> = [];
      try {
        // --- Source video element ---
        const video = document.createElement("video");
        video.src = videoUrl;
        video.preload = "auto";
        video.playsInline = true;
        // Must NOT be muted: element capture / media-source audio needs signal.
        // Audible output is avoided via the WebAudio graph below.
        await new Promise<void>((resolve, reject) => {
          const to = window.setTimeout(() => reject(new Error("Timed out loading video for export.")), 15000);
          video.onloadedmetadata = () => {
            window.clearTimeout(to);
            resolve();
          };
          video.onerror = () => {
            window.clearTimeout(to);
            reject(new Error("Could not load the recording for export."));
          };
        });

        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        const scaleCap = Math.min(1, 1920 / vw);
        const W = Math.round(vw * scaleCap);
        const H = Math.round(vh * scaleCap);

        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D is not available in this browser.");

        const canvasStream: MediaStream =
          typeof (canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream }).captureStream ===
          "function"
            ? (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30)
            : ((canvas as unknown as { mozCaptureStream: (fps: number) => MediaStream }).mozCaptureStream(30));
        cleanup.push(() => canvasStream.getTracks().forEach((t) => t.stop()));

        // --- Silent audio capture via WebAudio ---
        let audioCtx: AudioContext | null = null;
        try {
          const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AC) {
            audioCtx = new AC();
            if (audioCtx.state === "suspended") await audioCtx.resume().catch(() => {});
            const src = audioCtx.createMediaElementSource(video);
            const dest = audioCtx.createMediaStreamDestination();
            src.connect(dest);
            // NOTE: intentionally NOT connected to audioCtx.destination => silent.
            dest.stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
            cleanup.push(() => {
              try {
                src.disconnect();
              } catch {}
              audioCtx?.close().catch(() => {});
            });
          }
        } catch {
          // Audio capture unavailable -> export continues video-only.
        }

        const mimeType = pickMime();
        const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 8_000_000 });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        const stopped = new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
        });
        const onError = new Promise<never>((_, reject) => {
          recorder.onerror = () => reject(new Error("Recording the export failed."));
        });

        // Pause both video + recorder when the tab hides (rAF stops in
        // background tabs, which would otherwise desync / freeze frames).
        const onVisibility = () => {
          if (document.hidden) {
            try {
              video.pause();
            } catch {}
            try {
              if (recorder.state === "recording") recorder.pause();
            } catch {}
          } else {
            video.play().catch(() => {});
            try {
              if (recorder.state === "paused") recorder.resume();
            } catch {}
          }
        };
        document.addEventListener("visibilitychange", onVisibility);
        cleanup.push(() => document.removeEventListener("visibilitychange", onVisibility));

        // --- Render loop ---
        let raf = 0;
        let finished = false;
        const draw = () => {
          if (cancelRef.current || finished) return;
          const t = video.currentTime;
          const z = sampleZoomAt(keyframes, t);
          if (!z) {
            ctx.drawImage(video, 0, 0, W, H);
          } else {
            const c = clampZoomCenter(z.x, z.y, z.scale);
            const sw = W / z.scale;
            const sh = H / z.scale;
            const sx = Math.min(W - sw, Math.max(0, c.x * W - sw / 2));
            const sy = Math.min(H - sh, Math.max(0, c.y * H - sh / 2));
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
          }
          const ratio = duration > 0 ? Math.min(1, t / duration) : 0;
          setProgress(ratio);
          onProgress?.(ratio);
          if (t >= duration - 0.05) {
            finished = true;
            try {
              if (recorder.state !== "inactive") recorder.stop();
            } catch {}
            return;
          }
          raf = requestAnimationFrame(draw);
        };

        video.currentTime = 0;
        await video.play().catch(() => {
          throw new Error("Could not play the recording for export. Keep this tab visible.");
        });
        recorder.start(500);
        raf = requestAnimationFrame(draw);

        // Safety timeout: duration + 30s headroom
        const timeoutMs = Math.max(30_000, (duration + 30) * 1000);
        const timeout = new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("Export timed out. Try a shorter recording.")), timeoutMs)
        );

        await Promise.race([Promise.all([stopped, onError.then(() => {})]), timeout]);
        cancelAnimationFrame(raf);

        if (cancelRef.current) throw new Error("Export cancelled.");

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) throw new Error("Export produced an empty file. Please try again.");
        const url = URL.createObjectURL(blob);
        setProgress(1);
        onProgress?.(1);
        return { blob, url, mimeType };
      } finally {
        setExporting(false);
        cleanup.forEach((fn) => {
          try {
            fn();
          } catch {}
        });
      }
    },
    []
  );

  return { exporting, progress, runExport, cancel };
}
