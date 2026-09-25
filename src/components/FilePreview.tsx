"use client";

import { useState, useCallback } from "react";
import { Trash2, GripVertical, FileText, Image as ImageIcon, ChevronUp, ChevronDown } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({
  file,
  preview,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  file: File;
  preview?: string;
  index: number;
  total: number;
  onMoveUp?: (i: number) => void;
  onMoveDown?: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `file-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isImage = file.type.startsWith("image/");
  const sizeStr =
    file.size < 1024 * 1024
      ? (file.size / 1024).toFixed(0) + " KB"
      : (file.size / 1024 / 1024).toFixed(1) + " MB";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex items-center gap-2 sm:gap-3 bg-surface-hover rounded-xl px-2 sm:px-3 py-2 transition-all ${
        isDragging ? "opacity-50 shadow-md ring-2 ring-accent" : ""
      }`}
    >
      {/* Touch-Friendly Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab active:cursor-grabbing p-2 min-w-[40px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Up/Down tap buttons for mobile where drag-and-drop is tricky */}
      {(onMoveUp || onMoveDown) && total > 1 && (
        <div className="flex flex-col gap-0.5 sm:hidden shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp?.(index)}
            className="p-1 min-w-[28px] min-h-[20px] flex items-center justify-center rounded hover:bg-surface disabled:opacity-20 text-text-secondary"
            aria-label="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => onMoveDown?.(index)}
            className="p-1 min-w-[28px] min-h-[20px] flex items-center justify-center rounded hover:bg-surface disabled:opacity-20 text-text-secondary"
            aria-label="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* File thumbnail / icon */}
      <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-border/50 flex items-center justify-center">
        {isImage && preview ? (
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-5 h-5 text-text-secondary" />
        )}
      </div>

      {/* File details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{file.name}</div>
        <div className="text-xs text-text-secondary">{sizeStr}</div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-border rounded-xl text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
        aria-label={`Remove ${file.name}`}
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );
}

export function FilePreview({
  files,
  previews,
  onReorder,
  onRemove,
  maxFiles,
  maxSizeMB,
  acceptLabel,
}: {
  files: File[];
  previews: string[];
  onReorder: (files: File[], previews: string[]) => void;
  onRemove: (i: number) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptLabel?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = parseInt(String(active.id).replace("file-", ""));
      const newIndex = parseInt(String(over.id).replace("file-", ""));

      const newFiles = [...files];
      const newPreviews = [...previews];
      const [movedFile] = newFiles.splice(oldIndex, 1);
      const [movedPreview] = newPreviews.splice(oldIndex, 1);
      newFiles.splice(newIndex, 0, movedFile);
      newPreviews.splice(newIndex, 0, movedPreview);
      onReorder(newFiles, newPreviews);
    },
    [files, previews, onReorder]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newFiles = [...files];
      const newPreviews = [...previews];
      const [movedFile] = newFiles.splice(index, 1);
      const [movedPreview] = newPreviews.splice(index, 1);
      newFiles.splice(index - 1, 0, movedFile);
      newPreviews.splice(index - 1, 0, movedPreview);
      onReorder(newFiles, newPreviews);
    },
    [files, previews, onReorder]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= files.length - 1) return;
      const newFiles = [...files];
      const newPreviews = [...previews];
      const [movedFile] = newFiles.splice(index, 1);
      const [movedPreview] = newPreviews.splice(index, 1);
      newFiles.splice(index + 1, 0, movedFile);
      newPreviews.splice(index + 1, 0, movedPreview);
      onReorder(newFiles, newPreviews);
    },
    [files, previews, onReorder]
  );

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalSizeStr =
    totalSize < 1024 * 1024
      ? (totalSize / 1024).toFixed(0) + " KB"
      : (totalSize / 1024 / 1024).toFixed(1) + " MB";

  const overMaxFiles = maxFiles !== undefined && files.length > maxFiles;
  const overMaxSize = maxSizeMB !== undefined && totalSize > maxSizeMB * 1024 * 1024;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-text-primary">
          {files.length} file{files.length !== 1 ? "s" : ""} selected
        </span>
        <span className="text-text-secondary text-xs">{totalSizeStr}</span>
      </div>

      {acceptLabel && (
        <p className="text-xs text-text-secondary">
          {acceptLabel}
          {maxFiles ? ` · Up to ${maxFiles} files` : ""}
          {maxSizeMB ? `, ${maxSizeMB}MB each` : ""}
        </p>
      )}

      {(overMaxFiles || overMaxSize) && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg">
          {overMaxFiles && `Maximum ${maxFiles} files allowed. Remove some to continue.`}
          {overMaxSize && `Total size exceeds ${maxSizeMB}MB limit.`}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={files.map((_, i) => `file-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {files.map((file, i) => (
              <SortableItem
                key={`file-${i}`}
                file={file}
                preview={previews[i]}
                index={i}
                total={files.length}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
