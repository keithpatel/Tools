export type WorkflowOutputType = "image" | "pdf" | "text" | "json" | "csv" | "file-batch" | "video-frames" | "video" | "audio";

export interface WorkflowOutput {
  type: WorkflowOutputType;
  data: Blob | File | string;
  filename: string;
  sourceToolSlug: string;
  createdAt: number;
}

export interface WorkflowOutputBatch {
  type: "file-batch";
  items: { data: Blob | File; filename: string }[];
  sourceToolSlug: string;
  createdAt: number;
}

export type PendingOutput = WorkflowOutput | WorkflowOutputBatch;

const chains: Record<WorkflowOutputType, string[]> = {
  image: [
    "images-to-pdf",
    "image-converter",
    "collage-maker",
    "watermark-adder",
    "favicon-generator",
    "image-to-base64",
    "image-to-pdf",
  ],
  pdf: [
    "pdf-to-images",
    "split-pdf",
    "compress-pdf",
    "add-watermark",
    "add-page-numbers",
    "rotate-pdf",
    "extract-text",
    "reorder-pdf",
  ],
  text: [
    "word-counter",
    "case-converter",
    "markdown-to-html",
    "text-diff-checker",
    "find-replace",
    "slug-generator",
    "remove-duplicates",
    "text-reverser",
    "line-sorter",
    "hash-generator",
    "base64-encoder",
    "url-encoder",
  ],
  json: ["json-to-csv", "json-formatter"],
  csv: ["json-to-csv"],
  "file-batch": [
    "images-to-pdf",
    "collage-maker",
    "merge-pdf",
  ],
  "video-frames": [
    "collage-maker",
    "images-to-pdf",
  ],
  video: [
    "video-trimmer",
    "extract-audio",
    "video-to-frames",
  ],
  audio: [
    "extract-audio",
  ],
};

export function getCompatibleTargets(type: WorkflowOutputType): string[] {
  return chains[type] || [];
}

export function getToolSuggestions(sourceSlug: string, type: WorkflowOutputType, count: number = 3): string[] {
  const targets = getCompatibleTargets(type).filter((s) => s !== sourceSlug);
  return targets.slice(0, count);
}
