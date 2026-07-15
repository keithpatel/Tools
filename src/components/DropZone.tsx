"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

export function DropZone({
  onFiles,
  accept,
  multiple = false,
  label,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border-soft hover:border-accent/40 hover:bg-surface-hover"
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
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
  );
}
