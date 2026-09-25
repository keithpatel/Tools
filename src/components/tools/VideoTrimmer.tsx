"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { TrimRange } from "@/components/ui/TrimRange";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { useChainInput } from "@/components/ToolPageLayout";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Download,
  Film,
  Sparkles,
  AlertCircle,
} from "lucide-react";

function formatSeconds(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

export default function VideoTrimmer() {
  const [videoFile, setVideoFile] = useState<File | Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoopingSelection, setIsLoopingSelection] = useState(false);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chainInput = useChainInput();
  const { sendOutput } = useWorkflowStore();

  // Load incoming chain input if available
  useEffect(() => {
    if (chainInput && chainInput.data) {
      if (chainInput.data instanceof Blob || chainInput.data instanceof File) {
        handleLoadVideo(chainInput.data);
      }
    }
  }, [chainInput]);

  const handleLoadVideo = (file: File | Blob) => {
    setError(null);
    setTrimmedBlob(null);
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    setTrimmedUrl(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setIsLoopingSelection(false);
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    };
  }, [videoUrl, trimmedUrl]);

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      if (isFinite(d) && d > 0) {
        setDuration(d);
        setStartTime(0);
        setEndTime(d);
        setCurrentTime(0);
      }
    }
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // If previewing selection loop
    if (isLoopingSelection) {
      if (curr >= endTime || curr < startTime) {
        videoRef.current.currentTime = startTime;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsLoopingSelection(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const playSelection = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = startTime;
    setIsLoopingSelection(true);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Perform client-side video trimming using captureStream + MediaRecorder
  const trimVideo = async () => {
    if (!videoFile || !duration) return;
    if (endTime <= startTime) {
      setError("End time must be greater than start time.");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);

    const trimDuration = endTime - startTime;
    const hiddenVideo = document.createElement("video");
    hiddenVideo.src = URL.createObjectURL(videoFile);
    hiddenVideo.muted = false;
    hiddenVideo.playsInline = true;

    try {
      await new Promise<void>((resolve, reject) => {
        hiddenVideo.onloadedmetadata = () => resolve();
        hiddenVideo.onerror = () => reject(new Error("Unable to load video data for trimming."));
      });

      hiddenVideo.currentTime = startTime;
      await new Promise<void>((resolve) => {
        hiddenVideo.onseeked = () => resolve();
      });

      // Capture stream from video
      let stream: MediaStream;
      const anyVideo = hiddenVideo as any;
      if (typeof anyVideo.captureStream === "function") {
        stream = anyVideo.captureStream();
      } else if (typeof anyVideo.mozCaptureStream === "function") {
        stream = anyVideo.mozCaptureStream();
      } else {
        throw new Error("Your browser does not support client-side stream capture.");
      }

      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: selectedMime });
          resolve(blob);
        };
      });

      recorder.start(250);
      await hiddenVideo.play();

      const checkInterval = setInterval(() => {
        if (hiddenVideo.currentTime >= endTime || hiddenVideo.ended) {
          clearInterval(checkInterval);
          hiddenVideo.pause();
          recorder.stop();
        } else {
          const elapsed = hiddenVideo.currentTime - startTime;
          const pct = Math.min(99, Math.max(0, Math.round((elapsed / trimDuration) * 100)));
          setProgress(pct);
        }
      }, 50);

      const resultBlob = await recordPromise;
      setProgress(100);

      const resUrl = URL.createObjectURL(resultBlob);
      setTrimmedBlob(resultBlob);
      setTrimmedUrl(resUrl);
      setProcessing(false);

      sendOutput({
        type: "video",
        data: resultBlob,
        filename: `trimmed-${Date.now()}.${selectedMime.includes("mp4") ? "mp4" : "webm"}`,
        sourceToolSlug: "video-trimmer",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setProcessing(false);
      setError(err.message || "Failed to trim video.");
    } finally {
      hiddenVideo.pause();
      hiddenVideo.src = "";
      hiddenVideo.remove();
    }
  };

  const handleDownload = () => {
    if (!trimmedUrl || !trimmedBlob) return;
    const a = document.createElement("a");
    a.href = trimmedUrl;
    a.download = `trimmed-video-${Date.now()}.${trimmedBlob.type.includes("mp4") ? "mp4" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setTrimmedBlob(null);
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    setTrimmedUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setStartTime(0);
    setEndTime(0);
    setIsPlaying(false);
    setIsLoopingSelection(false);
    setProgress(0);
    setProcessing(false);
    setError(null);
  };

  return (
    <ToolLayout>
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!videoUrl ? (
          <DropZone
            onFiles={(files) => files[0] && handleLoadVideo(files[0])}
            accept="video/*,.mp4,.webm,.mov,.mkv"
            label="Drop a video file here to trim (or click to browse)"
          />
        ) : (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={onTimeUpdate}
                  onEnded={() => {
                    setIsPlaying(false);
                    setIsLoopingSelection(false);
                  }}
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Time & Playback Controls */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                  <span>Current: {formatSeconds(currentTime)}</span>
                  <span className="text-accent font-semibold">
                    Trimmed Segment: {formatSeconds(Math.max(0, endTime - startTime))}
                  </span>
                  <span>Total: {formatSeconds(duration)}</span>
                </div>

                {/* Range Slider for Trimming */}
                {duration > 0 && (
                  <div className="px-2">
                    <TrimRange
                      min={0}
                      max={duration}
                      start={startTime}
                      end={endTime}
                      onChange={(s, e) => {
                        setStartTime(s);
                        setEndTime(e);
                        handleSeek(s);
                      }}
                      disabled={processing}
                    />
                  </div>
                )}

                {/* Precise Timestamp Inputs & Set Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-surface-raised border border-border p-3 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-text-secondary block">Start Marker</span>
                      <span className="font-mono text-sm font-semibold">{formatSeconds(startTime)}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setStartTime(Math.min(currentTime, endTime - 0.1))}
                      disabled={processing}
                      className="text-xs"
                    >
                      Set to Current
                    </Button>
                  </div>

                  <div className="bg-surface-raised border border-border p-3 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-text-secondary block">End Marker</span>
                      <span className="font-mono text-sm font-semibold">{formatSeconds(endTime)}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEndTime(Math.max(currentTime, startTime + 0.1))}
                      disabled={processing}
                      className="text-xs"
                    >
                      Set to Current
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={togglePlay} disabled={processing}>
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button variant="secondary" onClick={playSelection} disabled={processing}>
                      <Film className="w-4 h-4" />
                      Loop Selection
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleReset} disabled={processing}>
                      <RotateCcw className="w-4 h-4" />
                      Choose Another Video
                    </Button>
                    <Button
                      variant="primary"
                      onClick={trimVideo}
                      disabled={processing || endTime <= startTime}
                      className="flex items-center gap-2"
                    >
                      <Scissors className="w-4 h-4" />
                      {processing ? `Trimming (${progress}%)...` : "Trim & Export"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trimmed Result Preview */}
            {trimmedBlob && trimmedUrl && (
              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" />
                      Trimmed Video Result
                    </h3>
                    <div className="text-xs text-text-secondary bg-surface-raised px-2.5 py-1 rounded-full border border-border">
                      {(trimmedBlob.size / (1024 * 1024)).toFixed(2)} MB &bull; {formatSeconds(endTime - startTime)}
                    </div>
                  </div>

                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                    <video src={trimmedUrl} controls playsInline className="w-full h-full object-contain" />
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 py-3.5"
                    >
                      <Download className="w-4 h-4" />
                      Download Trimmed Clip
                    </Button>
                  </div>
                </div>

                <ResultPanel
                  onDownload={handleDownload}
                  downloadLabel="Download Trimmed Clip"
                  onReset={handleReset}
                  resetLabel="Trim Another Video"
                  sourceToolSlug="video-trimmer"
                  outputType="video"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
