"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Camera, ImagePlus, FileUp } from "lucide-react";

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

  return (
    <>
      {/* Mobile-Native Upload Card (hidden on md+) */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full active:scale-[0.98] transition-transform"
          aria-label={label || "Tap to choose files"}
        >
          <div className="border-2 border-dashed border-accent/40 bg-accent/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[160px]">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
              {isImagePicker ? (
                <ImagePlus className="w-7 h-7 text-accent" />
              ) : (
                <FileUp className="w-7 h-7 text-accent" />
              )}
            </div>
            <p className="font-medium text-text-primary text-sm">
              {label || (isImagePicker ? "Tap to choose photos" : "Tap to choose files")}
            </p>
            <p className="text-xs text-text-secondary/70 mt-1">
              {accept ? `Accepts ${accept.replace(/,/g, ", ")}` : "From your device"}
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
      </div>

      {/* Desktop Drag & Drop Zone (hidden on mobile) */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`hidden md:block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? "border-accent bg-accent/5 shadow-sm"
            : "border-border-soft hover:border-accent/40 hover:bg-surface-hover"
        }`}
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-hover flex items-center justify-center">
          <Upload className="w-6 h-6 text-text-secondary" />
        </div>
        <p className="text-sm text-text-secondary">
          {label || "Drop files here or click to browse"}
        </p>
        {accept && (
          <p className="text-xs text-text-secondary/50 mt-1">Accepts {accept.replace(/,/g, ", ")}</p>
        )}
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
