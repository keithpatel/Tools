/** Central file-size guardrails shown in DropZone + enforced before processing. */

export const FILE_LIMITS_MB = {
  pdf: 50,
  image: 25,
  video: 500,
  audio: 100,
  default: 50,
} as const;

export function limitForFile(file: File): number {
  const t = file.type || "";
  const n = file.name.toLowerCase();
  if (t === "application/pdf" || n.endsWith(".pdf")) return FILE_LIMITS_MB.pdf;
  if (t.startsWith("image/")) return FILE_LIMITS_MB.image;
  if (t.startsWith("video/")) return FILE_LIMITS_MB.video;
  if (t.startsWith("audio/")) return FILE_LIMITS_MB.audio;
  return FILE_LIMITS_MB.default;
}

export function checkFiles(files: File[]): string | null {
  for (const f of files) {
    const mb = f.size / (1024 * 1024);
    const lim = limitForFile(f);
    if (mb > lim) return `"${f.name}" is ${mb.toFixed(1)} MB — limit is ${lim} MB for this file type. Try a smaller file or compress it first.`;
  }
  return null;
}
