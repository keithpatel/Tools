import { tools, categories, getToolBySlug, type Tool } from "@/data/tools";

export const SITE_URL = "https://mahant-tools.vercel.app";

export const SITE_NAME = "MultiTool";

export const TITLE_TEMPLATE = "%s | MultiTool — Free Online Tools";

export function toolUrl(slug: string) {
  return `${SITE_URL}/tools/${slug}`;
}

export function categoryUrl(id: string) {
  return `${SITE_URL}/category/${id}`;
}

const CATEGORY_BLURB: Record<string, string> = {
  pdf: "Merge, split, compress, rotate, protect and convert PDF files online.",
  image: "Compress, resize, convert, crop and edit images online.",
  text: "Count, convert, compare and transform text online.",
  developer: "Format JSON, encode data, generate QR codes and test regex online.",
  utility: "Generate passwords, convert units, calculate age and BMI online.",
  video: "Trim video, extract frames and audio, and record your screen online.",
};

export function categoryMeta(id: string) {
  const cat = categories.find((c) => c.id === id);
  if (!cat) return null;
  const count = tools.filter((t) => t.category === id).length;
  return {
    title: `${cat.label} — Free Online Tools`,
    description: `${CATEGORY_BLURB[id] ?? cat.label} ${count} free tools that run 100% in your browser — no upload, no signup.`,
    label: cat.label,
  };
}

/** Adjacent categories used to fill related-tool slots after same-category siblings. */
const ADJACENT: Record<string, string[]> = {
  pdf: ["image", "text"],
  image: ["pdf", "video"],
  text: ["developer", "utility"],
  developer: ["text", "utility"],
  utility: ["text", "developer"],
  video: ["image", "utility"],
};

/**
 * Deterministic related-tools picker: same-category siblings first,
 * then adjacent categories. Excludes the tool itself.
 */
export function getRelatedTools(slug: string, count = 4): Tool[] {
  const tool = getToolBySlug(slug);
  if (!tool) return [];
  const same = tools.filter((t) => t.category === tool.category && t.slug !== slug);
  const out: Tool[] = [...same];
  if (out.length < count) {
    const adj = ADJACENT[tool.category] ?? [];
    for (const cat of adj) {
      for (const t of tools) {
        if (t.category === cat && t.slug !== slug && !out.some((o) => o.slug === t.slug)) {
          out.push(t);
          if (out.length >= count) break;
        }
      }
      if (out.length >= count) break;
    }
  }
  return out.slice(0, count);
}

export const POPULAR_SLUGS = [
  "merge-pdf",
  "compress-pdf",
  "image-compressor",
  "json-formatter",
  "qr-code-generator",
  "password-generator",
  "word-counter",
  "pdf-to-images",
];

export function getPopularTools(): Tool[] {
  return POPULAR_SLUGS.map((s) => getToolBySlug(s)).filter((t): t is Tool => Boolean(t));
}
