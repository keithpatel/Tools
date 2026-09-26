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
  const [accepted, setAccepted] = useState(false);

  const isImagePicker = accept?.includes("image") || false;

  useEffect(() => {
    const handlePasteFiles = (e: Event) => {
      const customEvent = e as CustomEvent<{ files: File[] }>;
      if (customEvent.detail?.files?.length) {
        onFiles(customEvent.detail.files);
      }
    };
    const handleDropQueue = () => {
      // GlobalDropHandler staged files via useDropQueue; tools consume through
      // the same paste channel is not possible (File objects can't go through
      // CustomEvent detail reliably across routes), so DropZone also checks
      // session queue through a lightweight window hook set by the provider.
      try {
        const q = (window as unknown as { __dropQueue?: File[] }).__dropQueue;
        if (q?.length) {
          onFiles([...q]);
          (window as unknown as { __dropQueue?: File[] }).__dropQueue = [];
        }
      } catch {}
    };
    window.addEventListener("tool-paste-files", handlePasteFiles);
    window.addEventListener("tool-drop-queue", handleDropQueue);
    // consume immediately on mount (arrived via router.push after global drop)
    handleDropQueue();
    return () => {
      window.removeEventListener("tool-paste-files", handlePasteFiles);
      window.removeEventListener("tool-drop-queue", handleDropQueue);
    };
  }, [onFiles]);

  const flashAccepted = useCallback(() => {
    setAccepted(true);
    window.setTimeout(() => setAccepted(false), 550);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) {
        flashAccepted();
        onFiles(files);
      }
    },
    [flashAccepted, onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) {
        flashAccepted();
        onFiles(files);
      }
      e.target.value = "";
    },
    [flashAccepted, onFiles]
  );

  const icon = isImagePicker ? ImagePlus : FileUp;
  const IconGlyph = icon;

  return (
    <>
      {/* Mobile-Native Upload Card (hidden on md+) */}
      <button
        type="button"
        data-dropzone="true"
        onClick={() => inputRef.current?.click()}
        className="md:hidden w-full active:scale-[0.98] transition-all duration-200 ease-out cursor-pointer"
        aria-label="Tap to upload files from device"
      >
        <div className={cn(
          "border-2 border-dashed rounded-[18px] bg-surface p-6 flex flex-col items-center justify-center text-center min-h-[140px] transition-all duration-200 ease-out",
          accepted ? "animate-accept border-accent bg-brand-50 dark:bg-brand-950" : "border-accent/30 hover:border-accent/60 hover:bg-brand-50/50 dark:hover:bg-brand-950/40"
        )}>
          <div className="w-12 h-12 rounded-[14px] bg-brand-50 dark:bg-brand-950 border border-brand-200/50 dark:border-brand-800/50 flex items-center justify-center mb-2.5">
            <IconGlyph className="w-6 h-6 text-accent" aria-hidden="true" />
          </div>
          <p className="font-semibold tracking-tight text-text-primary text-base">
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
        role="button"
        tabIndex={0}
        data-dropzone="true"
        aria-label={label || "Drop files here or click to browse"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "hidden md:flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-[18px] p-12 text-center cursor-pointer transition-all duration-200 ease-out min-h-[220px]",
          dragging
            ? "border-accent bg-brand-50 dark:bg-brand-950 scale-[1.01] shadow-hover"
            : accepted
              ? "animate-accept border-accent bg-brand-50 dark:bg-brand-950"
              : "border-border-soft hover:border-accent/50 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 hover:shadow-resting"
        )}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-[16px] flex items-center justify-center mb-2 transition-all duration-200 ease-out border",
            dragging ? "bg-accent/15 border-accent/30 scale-105" : "bg-surface-hover border-transparent"
          )}
        >
          <Upload className={cn("w-6 h-6", dragging ? "text-accent" : "text-text-secondary")} aria-hidden="true" />
        </div>
        <p className="text-[15px] font-semibold tracking-tight text-text-primary">{label || "Drop files here or click to browse"}</p>
        <p className="text-xs text-text-secondary">Your files stay on this device — nothing is uploaded</p>
        <div className="flex items-center gap-2 mt-1.5">
          {accept && (
            <span className="text-xs text-text-secondary/70">Accepts {accept.replace(/,/g, ", ")}</span>
          )}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-hover border border-border-soft text-text-secondary">
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
