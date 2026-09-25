"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import { useWorkflowStore } from "@/lib/useWorkflowStore";
import { useChainInput } from "@/components/ToolPageLayout";
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertCircle,
  FileAudio,
} from "lucide-react";

function formatSeconds(secs: number): string {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF identifier
  writeString(0, "RIFF");
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(8, "WAVE");
  // format chunk identifier
  writeString(12, "fmt ");
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(36, "data");
  // data chunk length
  view.setUint32(40, dataLength, true);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default function ExtractAudio() {
  const [videoFile, setVideoFile] = useState<File | Blob | null>(null);
  const [fileName, setFileName] = useState("video");
  const [extracting, setExtracting] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [wavBlob, setWavBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chainInput = useChainInput();
  const { sendOutput } = useWorkflowStore();

  useEffect(() => {
    if (chainInput && chainInput.data) {
      if (chainInput.data instanceof Blob || chainInput.data instanceof File) {
        handleFile(chainInput.data);
      }
    }
  }, [chainInput]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFile = async (file: File | Blob) => {
    setError(null);
    setAudioBuffer(null);
    setWavBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackTime(0);

    const name = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, "") : "audio-extracted";
    setFileName(name);
    setVideoFile(file);
    setExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close().catch(() => {});

      if (decodedBuffer.length === 0 || decodedBuffer.numberOfChannels === 0) {
        throw new Error("No audio track was found inside this video file.");
      }

      const wav = audioBufferToWav(decodedBuffer);
      const url = URL.createObjectURL(wav);

      setAudioBuffer(decodedBuffer);
      setWavBlob(wav);
      setAudioUrl(url);
      setExtracting(false);

      // Workflow output chaining
      sendOutput({
        type: "audio",
        data: wav,
        filename: `${name}.wav`,
        sourceToolSlug: "extract-audio",
        createdAt: Date.now(),
      });
    } catch (err: any) {
      setExtracting(false);
      setError(err.message || "Failed to decode audio track from this video.");
    }
  };

  // Draw Audio Waveform on Canvas
  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = "rgba(13, 148, 136, 0.25)";
    ctx.strokeStyle = "rgb(13, 148, 136)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, amp);

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      ctx.fillRect(i, yMin, 1, Math.max(1, yMax - yMin));
    }
  }, [audioBuffer]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setPlaybackTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleDownload = () => {
    if (!audioUrl || !wavBlob) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${fileName}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setVideoFile(null);
    setAudioBuffer(null);
    setWavBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    setPlaybackTime(0);
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

        {!audioBuffer ? (
          <DropZone
            onFiles={(files) => files[0] && handleFile(files[0])}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            label="Drop a video file here to extract audio (or click to browse)"
          />
        ) : (
          <div className="space-y-6">
            {/* Audio Waveform & Player Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base">{fileName}.wav</h3>
                    <p className="text-xs text-text-secondary">
                      Lossless 16-bit PCM &bull; {audioBuffer.sampleRate / 1000} kHz &bull;{" "}
                      {audioBuffer.numberOfChannels === 1 ? "Mono" : "Stereo"}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono bg-surface-raised px-3 py-1.5 rounded-full border border-border">
                  {formatSeconds(playbackTime)} / {formatSeconds(audioBuffer.duration)}
                </div>
              </div>

              {/* Waveform Canvas */}
              <div className="relative bg-surface-raised border border-border-soft rounded-xl p-4 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={120}
                  className="w-full h-28 object-contain rounded-lg"
                />
                {/* Seekbar thumb overlay */}
                <input
                  type="range"
                  min={0}
                  max={audioBuffer.duration}
                  step={0.1}
                  value={playbackTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Audio element */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={() => {
                    if (audioRef.current) setPlaybackTime(audioRef.current.currentTime);
                  }}
                  onEnded={() => setIsPlaying(false)}
                />
              )}

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Button variant="primary" onClick={togglePlayback} className="flex items-center gap-2">
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    {isPlaying ? "Pause" : "Play Preview"}
                  </Button>

                  <Button variant="secondary" onClick={handleReset} className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Extract Another
                  </Button>
                </div>

                <Button
                  variant="primary"
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Download className="w-4 h-4" />
                  Download WAV ({wavBlob ? (wavBlob.size / (1024 * 1024)).toFixed(2) : 0} MB)
                </Button>
              </div>
            </div>

            <ResultPanel
              onDownload={handleDownload}
              downloadLabel="Download WAV Audio"
              onReset={handleReset}
              resetLabel="Extract from Another Video"
              sourceToolSlug="extract-audio"
              outputType="audio"
            />
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
