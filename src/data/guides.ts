export interface Guide {
  slug: string;
  title: string;
  description: string;
  toolSlug: string;
  steps: string[];
  faqs: { q: string; a: string }[];
}

export const guides: Guide[] = [
  {
    slug: "how-to-merge-pdf",
    title: "How to Merge PDF Files Online (Free, No Upload)",
    description: "Combine multiple PDFs into one document in your browser.",
    toolSlug: "merge-pdf",
    steps: ["Open the Merge PDF tool", "Drop 2+ PDF files and reorder them", "Click Merge PDFs and download the result"],
    faqs: [
      { q: "Is merging free?", a: "Yes, unlimited and private — files never leave your device." },
      { q: "What next?", a: "Compress the result or reorder pages with Send to…." },
    ],
  },
  {
    slug: "how-to-compress-pdf",
    title: "How to Compress a PDF Under 100KB",
    description: "Shrink PDFs for email, forms, and uploads.",
    toolSlug: "compress-pdf",
    steps: ["Open Compress PDF", "Upload your file and pick Standard or Maximum mode", "Compare sizes and download"],
    faqs: [
      { q: "Will quality suffer?", a: "Standard mode keeps text selectable; Maximum re-renders for smallest size." },
      { q: "Still too big?", a: "Chain to PDF to Images, then Images to PDF at lower quality." },
    ],
  },
  {
    slug: "how-to-format-json",
    title: "How to Format and Validate JSON",
    description: "Pretty-print, minify, and validate JSON instantly.",
    toolSlug: "json-formatter",
    steps: ["Open JSON Formatter", "Paste your JSON", "Fix errors highlighted, then copy or convert to CSV/YAML"],
    faqs: [{ q: "Is my data uploaded?", a: "No — validation runs entirely in your browser." }],
  },
  {
    slug: "how-to-make-qr-code",
    title: "How to Make a QR Code (With Shareable Link)",
    description: "Generate QR codes for URLs and text, then share the preset.",
    toolSlug: "qr-code-generator",
    steps: ["Open QR Code Generator", "Enter text or URL", "Download PNG or copy the Share link (?text=…)"],
    faqs: [{ q: "Can I reuse the settings?", a: "Yes — the Share button copies a URL that regenerates the same code." }],
  },
  {
    slug: "how-to-strong-password",
    title: "How to Generate a Strong Password",
    description: "Create and share password presets securely.",
    toolSlug: "password-generator",
    steps: ["Open Password Generator", "Pick length and character sets", "Copy the password or Share Preset link"],
    faqs: [{ q: "Is it safe?", a: "Generation happens locally; share links only carry settings, never the password itself." }],
  },
  {
    slug: "how-to-compress-image",
    title: "How to Compress Images Without Losing Quality",
    description: "Shrink PNG/JPG/WebP photos for the web.",
    toolSlug: "image-compressor",
    steps: ["Open Image Compressor", "Drop images", "Download compressed versions or convert format next"],
    faqs: [{ q: "Which format is smallest?", a: "Usually WebP or AVIF — use Image Converter after compressing." }],
  },
];

export function getGuide(slug: string) {
  return guides.find((g) => g.slug === slug);
}
