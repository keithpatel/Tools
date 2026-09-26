"use client";

import { useEffect, useState } from "react";

export interface FilmThumb {
  /** center timestamp of the sampled slice, seconds */
  time: number;
  dataUrl: string;
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    // Safety net: some browsers stall on rapid seeks
    window.setTimeout(finish, 800);
    try {
      video.currentTime = t;
    } catch {
      finish();
    }
  });
}

/**
 * Samples JPEG thumbnails across a video for a filmstrip lane.
 * Sequential seeks on a throwaway element — cheap (~1 thumb per 3s, capped).
 * Safe to call during editing; cancelled automatically on unmount / new video.
 */
export function useFilmstrip(videoUrl: string, duration: number, maxThumbs = 24) {
  const [thumbs, setThumbs] = useState<FilmThumb[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Invalid inputs: initial useState values ([], false) already apply,
    // so there is nothing to reset — just skip the sampling run.
    if (!videoUrl || !(duration > 0)) return;
    let cancelled = false;
    // Fetch-in-effect: the standard data-loading pattern; cleanup cancels it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setThumbs([]);

    const count = Math.max(4, Math.min(maxThumbs, Math.max(4, Math.round(duration / 3))));
    const video = document.createElement("video");
    video.src = videoUrl;
    video.muted = true;
    video.preload = "auto";
    video.playsInline = true;
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 54;
    const ctx = canvas.getContext("2d");

    (async () => {
      try {
        if (!ctx) return;
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error("filmstrip load failed"));
        });
        const out: FilmThumb[] = [];
        for (let i = 0; i < count && !cancelled; i++) {
          const t = Math.min(((i + 0.5) / count) * duration, Math.max(0, duration - 0.15));
          await seekTo(video, t);
          if (cancelled) return;
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            out.push({ time: t, dataUrl: canvas.toDataURL("image/jpeg", 0.55) });
          } catch {
            // A single bad frame shouldn't kill the strip
          }
          // Stream results in batches so the lane fills progressively
          if (out.length % 4 === 0 || i === count - 1) {
            setThumbs([...out]);
            await new Promise((r) => window.setTimeout(r, 0));
          }
        }
      } catch {
        // Filmstrip is decorative — editing works fine without it
      } finally {
        try {
          video.removeAttribute("src");
          video.load();
        } catch {}
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoUrl, duration, maxThumbs]);

  return { thumbs, loading };
}
