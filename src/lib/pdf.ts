/** Shared lazy loaders for heavy PDF libs — keeps per-tool chunks small and cacheable. */

let pdfLibPromise: Promise<typeof import("pdf-lib")> | null = null;
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfLib() {
  if (!pdfLibPromise) pdfLibPromise = import("pdf-lib");
  return pdfLibPromise;
}

export async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const mod = await import("pdfjs-dist");
      try {
        const m = mod as unknown as { GlobalWorkerOptions?: { workerSrc?: string }; version?: string };
        if (m.GlobalWorkerOptions && !m.GlobalWorkerOptions.workerSrc) {
          // Match existing per-tool pattern: CDN worker (works with static export).
          m.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(m as { version?: string }).version ?? "6.1.200"}/pdf.worker.min.mjs`;
        }
      } catch {}
      return mod;
    })();
  }
  return pdfjsPromise;
}
