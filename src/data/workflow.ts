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
    "image-compressor",
    "image-resizer",
    "image-cropper",
    "collage-maker",
    "watermark-adder",
    "favicon-generator",
    "image-to-base64",
    "qr-scanner",
    "blur-image",
    "background-remover",
    "image-filters",
    "image-splitter",
    "sticker-maker",
    "image-to-gif",
    "svg-png-converter",
  ],
  pdf: [
    "protect-pdf",
    "unlock-pdf",
    "extract-pages",
    "remove-pages",
    "crop-pdf",
    "pdf-metadata",
    "extract-images",
    "fill-and-sign-pdf",
    "pdf-to-images",
    "split-pdf",
    "compress-pdf",
    "add-watermark",
    "add-page-numbers",
    "rotate-pdf",
    "extract-text",
    "reorder-pdf",
    "redact-pdf",
    "pdf-editor",
    "merge-pdf",
  ],
  text: [
    "word-counter",
    "case-converter",
    "markdown-to-html",
    "html-to-markdown",
    "text-diff-checker",
    "find-replace",
    "slug-generator",
    "remove-duplicates",
    "text-reverser",
    "line-sorter",
    "hash-generator",
    "base64-encoder",
    "url-encoder",
    "readability-analyzer",
    "text-to-speech",
    "jwt-decoder",
    "timestamp-converter",
    "csv-viewer",
    "yaml-converter",
    "xml-formatter",
  ],
  json: ["json-to-csv", "json-formatter", "yaml-converter", "csv-viewer"],
  csv: ["json-to-csv", "csv-viewer", "json-formatter"],
  "file-batch": [
    "images-to-pdf",
    "collage-maker",
    "merge-pdf",
    "zip-creator",
    "gif-splitter",
    "image-to-gif",
  ],
  "video-frames": [
    "collage-maker",
    "images-to-pdf",
    "image-to-gif",
  ],
  video: [
    "video-trimmer",
    "extract-audio",
    "video-to-frames",
    "screen-recorder",
  ],
  audio: [
    "extract-audio",
    "audio-trimmer",
    "audio-converter",
    "voice-recorder",
  ],
};

export function getCompatibleTargets(type: WorkflowOutputType): string[] {
  return chains[type] || [];
}

export function getToolSuggestions(sourceSlug: string, type: WorkflowOutputType, count: number = 3): string[] {
  const targets = getCompatibleTargets(type).filter((s) => s !== sourceSlug);
  return targets.slice(0, count);
}

/** Infer a workflow output type from a dropped/pasted file. */
export function inferTypeFromFile(file: File): WorkflowOutputType {
  const t = file.type || "";
  const name = file.name.toLowerCase();
  if (t === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (t.startsWith("image/") || /\.(png|jpe?g|webp|avif|gif|svg|heic|heif|bmp|ico)$/.test(name)) return "image";
  if (t.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/.test(name)) return "video";
  if (t.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac)$/.test(name)) return "audio";
  if (/\.(json)$/.test(name) || t === "application/json") return "json";
  if (/\.(csv)$/.test(name) || t === "text/csv") return "csv";
  return "text";
}

/** Curated tool collections for homepage discovery + SEO. */
export interface ToolCollection {
  slug: string;
  title: string;
  description: string;
  tools: string[];
}

export const collections: ToolCollection[] = [
  {
    slug: "compress-under-100kb",
    title: "Compress PDF under 100KB",
    description: "Shrink PDFs and images for email, forms, and uploads.",
    tools: ["compress-pdf", "image-compressor", "pdf-to-images", "image-converter"],
  },
  {
    slug: "passport-photo-bundle",
    title: "Passport photo bundle",
    description: "Make, clean up, and print ID photos at home.",
    tools: ["passport-photo", "background-remover", "image-resizer", "images-to-pdf"],
  },
  {
    slug: "dev-starter-pack",
    title: "Dev starter pack",
    description: "Format, encode, and ship faster.",
    tools: ["json-formatter", "yaml-converter", "regex-tester", "qr-code-generator"],
  },
];
