"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Upload, Camera, ImagePlus, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropZone({
  onFiles,
  accept,
  multiple = false,
  label,
  enableCamera = false,
  cameraLabel,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  enableCamera?: boolean;
  cameraLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isImagePicker = accept?.includes("image") || false;

  useEffect(() => {
    const handlePasteFiles = (e: Event) => {
      const customEvent = e as CustomEvent<{ files: File[] }>;
      if (customEvent.detail?.files?.length) {
        onFiles(customEvent.detail.files);
      }
    };
    window.addEventListener("tool-paste-files", handlePasteFiles);
    return () => window.removeEventListener("tool-paste-files", handlePasteFiles);
  }, [onFiles]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFiles(files);
      e.target.value = "";
    },
    [onFiles]
  );

  const icon = isImagePicker ? ImagePlus : FileUp;
  const IconGlyph = icon;

  return (
    <>
      {/* Mobile-Native Upload Card (hidden on md+) */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="md:hidden w-full active:scale-[0.98] transition-transform cursor-pointer"
        aria-label="Tap to upload files from device"
      >
        <div className="border-2 border-dashed border-accent/30 rounded-2xl bg-surface p-6 flex flex-col items-center justify-center text-center min-h-[140px] hover:border-accent/60">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2.5">
            <IconGlyph className="w-6 h-6 text-accent" />
          </div>
          <p className="font-semibold text-text-primary text-base">
            Tap to upload {accept?.includes("pdf") ? "PDF" : accept?.includes("image") ? "image" : multiple ? "files" : "file"}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {accept ? `Accepts ${accept.replace(/,/g, ", ")}` : "Select from your device"}
          </p>
        </div>
      </button>

      {enableCamera && (
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary hover:bg-surface-hover active:scale-[0.97] transition-all min-h-[44px]"
          aria-label={cameraLabel || "Take a photo"}
        >
          <Camera className="w-4 h-4 text-accent" />
          {cameraLabel || "Take a photo instead"}
        </button>
      )}

      {/* Desktop Drag & Drop Zone (hidden on mobile) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "hidden md:flex flex-col items-center justify-center gap-1 border border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 min-h-[220px]",
          dragging
            ? "border-accent bg-accent/5 scale-[1.01] shadow-sm"
            : "border-border hover:border-accent/50 hover:bg-surface/80"
        )}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-colors",
            dragging ? "bg-accent/15" : "bg-surface-hover"
          )}
        >
          <Upload className={cn("w-6 h-6", dragging ? "text-accent" : "text-text-secondary")} />
        </div>
        <p className="text-sm font-medium text-text-primary">{label || "Drop files here or click to browse"}</p>
        <div className="flex items-center gap-2 mt-1">
          {accept && (
            <span className="text-xs text-text-secondary/60">Accepts {accept.replace(/,/g, ", ")}</span>
          )}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-secondary/75">
            or Ctrl+V
          </span>
        </div>
      </div>

      {/* Standard file input (shared on desktop + mobile) */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {/* Camera capture input (mobile only) */}
      {enableCamera && (
        <input
          ref={cameraRef}
          type="file"
          accept={accept || "image/*"}
          capture="environment"
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      )}
    </>
  );
}
