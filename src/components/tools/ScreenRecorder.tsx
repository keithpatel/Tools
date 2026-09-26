"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { ZoomEditor } from "./screen-recorder/ZoomEditor";
import type { ZoomKeyframe } from "./screen-recorder/zoomTypes";
import {
  Video,
  Monitor,
  Camera,
  Layers,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Sparkles,
  ZoomIn,
  AlertCircle,
} from "lucide-react";

type RecordMode = "screen" | "webcam" | "pip";
type AudioMode = "mic" | "system" | "both" | "none";

export default function ScreenRecorder() {
  const [mode, setMode] = useState<RecordMode>("screen");
  const [audioMode, setAudioMode] = useState<AudioMode>("mic");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [showZoomEditor, setShowZoomEditor] = useState(false);
  const [zoomKeyframes, setZoomKeyframes] = useState<ZoomKeyframe[]>([]);
  const [zoomedBlob, setZoomedBlob] = useState<Blob | null>(null);
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { sendOutput } = useWorkflowStore();

  // Clean up all streams and resources
  const stopAllStreams = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    if (compositeStreamRef.current) {
      compositeStreamRef.current.getTracks().forEach((t) => t.stop());
      compositeStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllStreams();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (zoomedUrl) URL.revokeObjectURL(zoomedUrl);
    };
  }, [stopAllStreams, recordedUrl, zoomedUrl]);

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(remainingSecs)}`;
    }
    return `${pad(mins)}:${pad(remainingSecs)}`;
  };

  const startRecording = async () => {
    setError(null);
    recordedChunksRef.current = [];
    setRecordedBlob(null);
    setShowZoomEditor(false);
    setZoomKeyframes([]);
    setZoomedBlob(null);
    if (zoomedUrl) {
      URL.revokeObjectURL(zoomedUrl);
      setZoomedUrl(null);
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }

    try {
      let finalStream: MediaStream;
      const audioTracks: MediaStreamTrack[] = [];

      // 1. Capture Video Sources
      if (mode === "screen") {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30, max: 60 } },
          audio: audioMode === "system" || audioMode === "both",
        });
        screenStreamRef.current = screenStream;

        // If user stops sharing screen via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };

        if (audioMode === "system" || audioMode === "both") {
          const sysAudio = screenStream.getAudioTracks();
          if (sysAudio.length) audioTracks.push(sysAudio[0]);
        }

        // Add mic audio if requested
        if (audioMode === "mic" || audioMode === "both") {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const micTrack = micStream.getAudioTracks()[0];
            if (micTrack) audioTracks.push(micTrack);
          } catch {
            // Mic permission denied or unavailable, proceed with system audio
          }
        }

        finalStream = new MediaStream([
          screenStream.getVideoTracks()[0],
          ...audioTracks,
        ]);
      } else if (mode === "webcam") {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: audioMode !== "none",
        });
        webcamStreamRef.current = webcamStream;
        finalStream = webcamStream;
      } else {
        // Picture-in-Picture (Canvas composite)
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: { ideal: 30 } },
          audio: audioMode === "system" || audioMode === "both",
        });
        screenStreamRef.current = screenStream;

        screenStream.getVideoTracks()[0].onended = () => {
          stopRecording();
        };

        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: audioMode === "mic" || audioMode === "both",
        });
        webcamStreamRef.current = webcamStream;

        // Create Canvas Compositor
        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d")!;

        const screenVideo = document.createElement("video");
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        await screenVideo.play();

        const camVideo = document.createElement("video");
        camVideo.srcObject = webcamStream;
        camVideo.muted = true;
        await camVideo.play();

        const drawComposite = () => {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          // Draw PiP webcam in bottom-right corner
          const pipW = 380;
          const pipH = 285;
          const pipX = canvas.width - pipW - 32;
          const pipY = canvas.height - pipH - 32;

          ctx.save();
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(pipX, pipY, pipW, pipH, 16);
          } else {
            ctx.rect(pipX, pipY, pipW, pipH);
          }
          ctx.clip();
          ctx.drawImage(camVideo, pipX, pipY, pipW, pipH);
          ctx.restore();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(pipX, pipY, pipW, pipH, 16);
          } else {
            ctx.rect(pipX, pipY, pipW, pipH);
          }
          ctx.stroke();

          animationFrameRef.current = requestAnimationFrame(drawComposite);
        };
        drawComposite();

        const canvasAny = canvas as any;
        const canvasStream: MediaStream =
          typeof canvasAny.captureStream === "function"
            ? canvasAny.captureStream(30)
            : canvasAny.mozCaptureStream(30);

        const allAudioTracks: MediaStreamTrack[] = [
          ...screenStream.getAudioTracks(),
          ...webcamStream.getAudioTracks(),
        ];

        finalStream = new MediaStream([
          canvasStream.getVideoTracks()[0],
          ...allAudioTracks,
        ]);
        compositeStreamRef.current = canvasStream;
      }

      // Display live stream in preview
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = finalStream;
        liveVideoRef.current.play().catch(() => {});
      }

      // Determine best supported mimeType
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

      const recorder = new MediaRecorder(finalStream, {
        mimeType: selectedMime,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: selectedMime });
        const url = URL.createObjectURL(fullBlob);
        setRecordedBlob(fullBlob);
        setRecordedUrl(url);
        setIsRecording(false);
        setIsPaused(false);
        stopAllStreams();

        // Feed into workflow store
        sendOutput({
          type: "video",
          data: fullBlob,
          filename: `recording-${Date.now()}.${selectedMime.includes("mp4") ? "mp4" : "webm"}`,
          sourceToolSlug: "screen-recorder",
          createdAt: Date.now(),
        });
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      stopAllStreams();
      if (err.name !== "NotAllowedError") {
        setError(err.message || "Failed to start recording. Please check browser permissions.");
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownload = () => {
    if (!recordedUrl || !recordedBlob) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    a.download = `recording-${Date.now()}.${recordedBlob.type.includes("mp4") ? "mp4" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetRecording = () => {
    stopAllStreams();
    setRecordedBlob(null);
    setShowZoomEditor(false);
    setZoomKeyframes([]);
    setZoomedBlob(null);
    if (zoomedUrl) {
      URL.revokeObjectURL(zoomedUrl);
      setZoomedUrl(null);
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordTime(0);
    setError(null);
  };

  const handleZoomExported = (result: { blob: Blob; url: string; mimeType: string }) => {
    if (zoomedUrl) URL.revokeObjectURL(zoomedUrl);
    setZoomedBlob(result.blob);
    setZoomedUrl(result.url);
    setShowZoomEditor(false);

    // Feed zoomed output into workflow store (trim it, extract frames, ...)
    sendOutput({
      type: "video",
      data: result.blob,
      filename: `recording-zoomed-${Date.now()}.${result.mimeType.includes("mp4") ? "mp4" : "webm"}`,
      sourceToolSlug: "screen-recorder",
      createdAt: Date.now(),
    });
  };

  const handleZoomedDownload = () => {
    if (!zoomedUrl || !zoomedBlob) return;
    const a = document.createElement("a");
    a.href = zoomedUrl;
    a.download = `recording-zoomed-${Date.now()}.${zoomedBlob.type.includes("mp4") ? "mp4" : "webm"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ToolLayout title="" description="">
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-error-soft border border-error-border text-error-text text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Configuration Panel */}
        {!isRecording && !recordedBlob && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3">Recording Source</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("screen")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    mode === "screen"
                      ? "border-accent bg-accent/5 text-accent shadow-xs"
                      : "border-border hover:bg-surface-hover text-text-secondary"
                  }`}
                >
                  <Monitor className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium text-text-primary">Screen / Tab</span>
                  <span className="text-xs opacity-75 mt-0.5">Desktop, Window or Browser Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("webcam")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    mode === "webcam"
                      ? "border-accent bg-accent/5 text-accent shadow-xs"
                      : "border-border hover:bg-surface-hover text-text-secondary"
                  }`}
                >
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium text-text-primary">Webcam Only</span>
                  <span className="text-xs opacity-75 mt-0.5">Front camera video feed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("pip")}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    mode === "pip"
                      ? "border-accent bg-accent/5 text-accent shadow-xs"
                      : "border-border hover:bg-surface-hover text-text-secondary"
                  }`}
                >
                  <Layers className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium text-text-primary">Picture-in-Picture</span>
                  <span className="text-xs opacity-75 mt-0.5">Screen + Webcam Overlay</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">Audio Source</label>
              <Segmented
                value={audioMode}
                onChange={(val) => setAudioMode(val as AudioMode)}
                options={[
                  { value: "mic", label: "Microphone" },
                  { value: "system", label: "System Audio" },
                  { value: "both", label: "Mic + System" },
                  { value: "none", label: "Mute" },
                ]}
              />
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={startRecording}
                className="w-full flex items-center justify-center gap-2 py-4 text-base"
              >
                <Video className="w-5 h-5" />
                Start Recording
              </Button>
            </div>
          </div>
        )}

        {/* Live Recording In-Progress */}
        {isRecording && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-error-soft0"></span>
                </span>
                <span className="text-sm font-semibold uppercase tracking-wider text-error-text">
                  {isPaused ? "Recording Paused" : "Recording Live"}
                </span>
              </div>
              <div className="font-mono text-xl font-bold px-3 py-1 bg-surface-raised border border-border rounded-lg">
                {formatTime(recordTime)}
              </div>
            </div>

            {/* Live feed monitor */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              {isPaused && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-medium text-lg">
                  Paused
                </div>
              )}
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {isPaused ? (
                <Button variant="secondary" onClick={resumeRecording} className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  Resume
                </Button>
              ) : (
                <Button variant="secondary" onClick={pauseRecording} className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              <Button variant="danger" onClick={stopRecording} className="flex items-center gap-2">
                <Square className="w-4 h-4 fill-current" />
                Finish Recording
              </Button>
            </div>
          </div>
        )}

        {/* Recording Finished Preview & Export */}
        {recordedBlob && recordedUrl && !showZoomEditor && (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Recording Preview
                </h3>
                <div className="text-xs text-text-secondary bg-surface-raised px-2.5 py-1 rounded-full border border-border">
                  {(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB &bull; {formatTime(recordTime)}
                </div>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                <video
                  src={recordedUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => setShowZoomEditor(true)}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ZoomIn className="w-4 h-4" />
                  Edit Zoom
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Video
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetRecording}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Record Another
                </Button>
              </div>
            </div>

            {/* Workflow chaining panel */}
            <ResultPanel
              onDownload={handleDownload}
              downloadLabel="Download Video"
              onReset={resetRecording}
              resetLabel="Record Another"
              sourceToolSlug="screen-recorder"
              outputType="video"
            />
          </div>
        )}

        {/* Auto-zoom editor stage */}
        {recordedBlob && recordedUrl && showZoomEditor && (
          <ZoomEditor
            videoUrl={recordedUrl}
            keyframes={zoomKeyframes}
            onKeyframesChange={setZoomKeyframes}
            onExported={handleZoomExported}
            onBack={() => setShowZoomEditor(false)}
          />
        )}

        {/* Zoomed export result */}
        {zoomedBlob && zoomedUrl && !showZoomEditor && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
                <ZoomIn className="w-5 h-5 text-accent" />
                Zoomed Video
              </h3>
              <div className="text-xs text-text-secondary bg-surface-raised px-2.5 py-1 rounded-full border border-border">
                {(zoomedBlob.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
              <video
                src={zoomedUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleZoomedDownload}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Zoomed Video
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowZoomEditor(true)}
                className="flex items-center gap-2"
              >
                <ZoomIn className="w-4 h-4" />
                Adjust Zooms
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
