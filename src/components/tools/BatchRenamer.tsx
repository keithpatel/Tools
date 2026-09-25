"use client";

import { useState, useCallback, useMemo } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";
import JSZip from "jszip";
import { Download, ArrowRight, FileArchive, Type, Hash, CalendarDays } from "lucide-react";

function dateToken(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}${m}${day}`;
}

function sanitizeStem(s: string): string {
  return s.replace(/[\\/:"*?<>|]/g, "").trim();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function BatchRenamer() {
  const [files, setFiles] = useState<File[]>([]);
  const [prefix, setPrefix] = useState("");
  const [startNum, setStartNum] = useState(1);
  const [digits, setDigits] = useState(3);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");
  const [zipUrl, setZipUrl] = useState("");
  const [zipSize, setZipSize] = useState(0);

  const handleFiles = useCallback((incoming: File[]) => {
    if (incoming.length === 0) return;
    setError("");
    setZipUrl("");
    setFiles((prev) => [...prev, ...incoming]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setZipUrl("");
  }, []);

  const clearAll = useCallback(() => {
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    setFiles([]);
    setZipUrl("");
    setZipSize(0);
    setError("");
  }, [zipUrl]);

  const newNames = useMemo(() => {
    const date = dateToken();
    const used = new Set<string>();
    return files.map((f, i) => {
      const dot = f.name.lastIndexOf(".");
      const ext = dot > 0 ? f.name.slice(dot) : "";
      const base = dot > 0 ? f.name.slice(0, dot) : f.name;
      const seq = String(Math.max(0, Math.floor(startNum) + i)).padStart(Math.max(1, Math.min(6, digits)), "0");
      const resolvedPrefix = sanitizeStem(prefix.split("{date}").join(date));
      let stem = keepOriginal ? `${resolvedPrefix}${base}_${seq}` : `${resolvedPrefix}${seq}`;
      if (!stem) stem = seq;
      let candidate = stem + ext;
      let k = 2;
      while (used.has(candidate.toLowerCase())) {
        candidate = `${stem} (${k++})${ext}`;
      }
      used.add(candidate.toLowerCase());
      return candidate;
    });
  }, [files, prefix, startNum, digits, keepOriginal]);

  const insertDateToken = useCallback(() => {
    setPrefix((p) => (p.includes("{date}") ? p : `${p}{date}`));
  }, []);

  const handleZip = useCallback(async () => {
    if (files.length === 0 || zipping) return;
    setZipping(true);
    setError("");
    try {
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        zip.file(newNames[i], files[i]);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      if (zipUrl) URL.revokeObjectURL(zipUrl);
      setZipUrl(url);
      setZipSize(blob.size);
      const a = document.createElement("a");
      a.href = url;
      a.download = "renamed-files.zip";
      a.click();
    } catch {
      setError("Failed to build ZIP. Try fewer files.");
    } finally {
      setZipping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, newNames, zipping]);

  const downloadAgain = useCallback(() => {
    if (!zipUrl) return;
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = "renamed-files.zip";
    a.click();
  }, [zipUrl]);

  return (
    <ToolLayout title="" description="">
      {files.length === 0 ? (
        <DropZone onFiles={handleFiles} accept="*" multiple label="Drop files here or click to browse" />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <p className="text-sm font-medium flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-accent" />
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </p>

          <div className="bg-surface rounded-2xl border border-border-soft p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <Type className="w-3.5 h-3.5 text-text-secondary" /> Prefix (supports {"{date}"} token)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. photo-{date}-"
                  maxLength={60}
                  className="flex-1 px-3 py-2.5 sm:py-2 text-sm rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent/40 min-h-[44px] sm:min-h-0"
                />
                <Button variant="secondary" onClick={insertDateToken} className="w-full sm:w-auto">
                  <CalendarDays className="w-4 h-4" />
                  Insert {"{date}"}
                </Button>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {"{date}"} becomes {dateToken()} (YYYYMMDD). Original extensions are always preserved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <Hash className="w-3.5 h-3.5 text-text-secondary" /> Start number
                </label>
                <input
                  type="number"
                  min={0}
                  max={999999}
                  value={startNum}
                  onChange={(e) => setStartNum(Number(e.target.value))}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm font-mono rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Digits padding</label>
                <select
                  value={digits}
                  onChange={(e) => setDigits(Number(e.target.value))}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm font-mono rounded-xl border border-border-soft bg-surface-hover focus:outline-none focus:ring-2 focus:ring-accent/25 min-h-[44px] sm:min-h-0"
                >
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d} digit{d !== 1 ? "s" : ""} (e.g. {String(7).padStart(d, "0")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Keep original name</p>
                <p className="text-xs text-text-secondary">Append the number after the original filename</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={keepOriginal}
                onClick={() => {
                  setKeepOriginal(!keepOriginal);
                  setZipUrl("");
                }}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${keepOriginal ? "bg-accent" : "bg-border"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm transition-transform ${keepOriginal ? "translate-x-[18px]" : "translate-x-[2px]"}`}
                />
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Live preview</p>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${f.size}-${i}`}
                  className="flex items-center gap-2 text-xs sm:text-sm bg-surface rounded-xl border border-border-soft px-3 py-2"
                >
                  <span className="flex-1 min-w-0 truncate text-text-secondary">{f.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-accent" />
                  <span className="flex-1 min-w-0 truncate font-medium">{newNames[i]}</span>
                  <span className="hidden sm:inline text-[11px] text-text-secondary shrink-0">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${f.name}`}
                    className="text-xs text-error-text hover:underline shrink-0 min-w-[44px] min-h-[32px]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <DropZone onFiles={handleFiles} accept="*" multiple label="Drop more files here to add" />

          <div className="sticky bottom-20 md:static">
            <Button onClick={handleZip} disabled={zipping || files.length === 0} className="w-full sm:w-auto">
              <Download className="w-4 h-4" />
              {zipping ? "Building ZIP..." : `Download ZIP (${files.length} files)`}
            </Button>
          </div>
        </div>
      )}

      <ResultPanel
        loading={zipping}
        loadingLabel="Building ZIP..."
        error={error}
        onDownload={zipUrl ? downloadAgain : undefined}
        downloadLabel="Download ZIP"
        onReset={files.length > 0 ? clearAll : undefined}
        resetLabel="Start Over"
        sourceToolSlug="batch-renamer"
      >
        {zipUrl && (
          <div className="text-sm text-text-secondary space-y-1">
            <p className="font-medium text-text-primary flex items-center gap-2">
              <FileArchive className="w-4 h-4 text-accent" />
              renamed-files.zip ready
            </p>
            <p>
              {files.length} file{files.length !== 1 ? "s" : ""} renamed · {formatSize(zipSize)} · contents unchanged
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
