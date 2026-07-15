export interface Tool {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: "pdf" | "image" | "text" | "developer" | "utility";
  icon: string;
}

export const categories = [
  { id: "pdf", label: "PDF Tools", icon: "FileText", color: "#be185d" },
  { id: "image", label: "Image Tools", icon: "Image", color: "#b45309" },
  { id: "text", label: "Text Tools", icon: "AlignLeft", color: "#1d4ed8" },
  { id: "developer", label: "Developer Tools", icon: "Code", color: "#6d28d9" },
  { id: "utility", label: "Utility Tools", icon: "Wrench", color: "#047857" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export const tools: Tool[] = [
  // PDF Tools
  { id: 1, name: "Merge PDF", slug: "merge-pdf", description: "Combine multiple PDF files into one document", category: "pdf", icon: "FilePlus" },
  { id: 2, name: "Split PDF", slug: "split-pdf", description: "Split a PDF into separate pages", category: "pdf", icon: "FileMinus" },
  { id: 3, name: "Compress PDF", slug: "compress-pdf", description: "Reduce PDF file size", category: "pdf", icon: "FileDown" },
  { id: 4, name: "PDF to Images", slug: "pdf-to-images", description: "Convert PDF pages to JPG or PNG images", category: "pdf", icon: "FileImage" },
  { id: 5, name: "Images to PDF", slug: "images-to-pdf", description: "Combine images into a single PDF", category: "pdf", icon: "Images" },
  { id: 6, name: "Rotate PDF", slug: "rotate-pdf", description: "Rotate individual PDF pages", category: "pdf", icon: "RotateCw" },
  { id: 7, name: "Reorder PDF", slug: "reorder-pdf", description: "Reorder or delete pages in a PDF", category: "pdf", icon: "Shuffle" },
  { id: 8, name: "Add Watermark", slug: "add-watermark", description: "Add text or image watermark to PDF pages", category: "pdf", icon: "Droplets" },
  { id: 9, name: "Add Page Numbers", slug: "add-page-numbers", description: "Add page numbers to your PDF", category: "pdf", icon: "Hash" },
  { id: 10, name: "Extract Text", slug: "extract-text", description: "Extract text content from PDF files", category: "pdf", icon: "FileText" },

  // Image Tools
  { id: 11, name: "Image Compressor", slug: "image-compressor", description: "Compress images without losing quality", category: "image", icon: "ImageDown" },
  { id: 12, name: "Image Resizer", slug: "image-resizer", description: "Resize images to exact dimensions", category: "image", icon: "Maximize" },
  { id: 13, name: "Image Converter", slug: "image-converter", description: "Convert between PNG, JPG, WebP, and AVIF", category: "image", icon: "Repeat" },
  { id: 14, name: "Image Cropper", slug: "image-cropper", description: "Crop images to any aspect ratio", category: "image", icon: "Crop" },
  { id: 15, name: "Image Rotator", slug: "image-rotator", description: "Rotate or flip images", category: "image", icon: "RotateCcw" },
  { id: 16, name: "Image to Base64", slug: "image-to-base64", description: "Convert images to Base64 data URI", category: "image", icon: "FileCode" },
  { id: 17, name: "Base64 to Image", slug: "base64-to-image", description: "Convert Base64 string back to an image", category: "image", icon: "FileImage" },
  { id: 18, name: "Watermark Adder", slug: "watermark-adder", description: "Add text or logo watermark to images", category: "image", icon: "Droplets" },
  { id: 19, name: "EXIF Viewer", slug: "exif-viewer", description: "View and remove image metadata (EXIF)", category: "image", icon: "Info" },
  { id: 20, name: "Color Picker", slug: "color-picker", description: "Pick colors from an image with eyedropper", category: "image", icon: "Eye" },
  { id: 21, name: "Collage Maker", slug: "collage-maker", description: "Create photo collages from multiple images", category: "image", icon: "LayoutGrid" },
  { id: 22, name: "Favicon Generator", slug: "favicon-generator", description: "Generate favicons in multiple sizes", category: "image", icon: "Globe" },
  { id: 23, name: "Image to PDF", slug: "image-to-pdf", description: "Convert images to PDF documents", category: "image", icon: "FileImage" },

  // Text Tools
  { id: 24, name: "Word Counter", slug: "word-counter", description: "Count words, characters, sentences, and paragraphs", category: "text", icon: "Sigma" },
  { id: 25, name: "Case Converter", slug: "case-converter", description: "Convert text between upper, lower, title, and sentence case", category: "text", icon: "Text" },
  { id: 26, name: "Text Diff Checker", slug: "text-diff-checker", description: "Compare two texts and highlight differences", category: "text", icon: "GitCompare" },
  { id: 27, name: "Lorem Ipsum", slug: "lorem-ipsum", description: "Generate placeholder text in various lengths", category: "text", icon: "Type" },
  { id: 28, name: "Find & Replace", slug: "find-replace", description: "Find and replace text with regex support", category: "text", icon: "Search" },
  { id: 29, name: "Slug Generator", slug: "slug-generator", description: "Convert text to URL-friendly slugs", category: "text", icon: "Link" },
  { id: 30, name: "Remove Duplicates", slug: "remove-duplicates", description: "Remove duplicate lines from text", category: "text", icon: "Delete" },
  { id: 31, name: "Text Reverser", slug: "text-reverser", description: "Reverse text, words, or lines", category: "text", icon: "ArrowLeftRight" },
  { id: 32, name: "Markdown to HTML", slug: "markdown-to-html", description: "Convert Markdown to HTML", category: "text", icon: "FileCode" },
  { id: 33, name: "HTML to Markdown", slug: "html-to-markdown", description: "Convert HTML to Markdown", category: "text", icon: "FileText" },
  { id: 34, name: "Line Sorter", slug: "line-sorter", description: "Sort lines A-Z, Z-A, or randomly", category: "text", icon: "ArrowUpDown" },

  // Developer Tools
  { id: 35, name: "JSON Formatter", slug: "json-formatter", description: "Format, validate, and minify JSON", category: "developer", icon: "Braces" },
  { id: 36, name: "JSON to CSV", slug: "json-to-csv", description: "Convert between JSON and CSV formats", category: "developer", icon: "Table" },
  { id: 37, name: "Base64 Encode/Decode", slug: "base64-encoder", description: "Encode or decode Base64 strings", category: "developer", icon: "FileCode" },
  { id: 38, name: "URL Encode/Decode", slug: "url-encoder", description: "Encode or decode URL strings", category: "developer", icon: "Link" },
  { id: 39, name: "Hash Generator", slug: "hash-generator", description: "Generate MD5, SHA-1, SHA-256 hashes", category: "developer", icon: "Fingerprint" },
  { id: 40, name: "UUID Generator", slug: "uuid-generator", description: "Generate random UUIDs (v4)", category: "developer", icon: "Key" },
  { id: 41, name: "QR Code Generator", slug: "qr-code-generator", description: "Generate QR codes from text or URLs", category: "developer", icon: "QrCode" },
  { id: 42, name: "Barcode Generator", slug: "barcode-generator", description: "Generate barcodes for any data", category: "developer", icon: "Barcode" },
  { id: 43, name: "Color Converter", slug: "color-converter", description: "Convert between HEX, RGB, and HSL", category: "developer", icon: "Palette" },
  { id: 44, name: "Regex Tester", slug: "regex-tester", description: "Test regular expressions in real-time", category: "developer", icon: "Regex" },
  { id: 45, name: "Code Minifier", slug: "code-minifier", description: "Minify or beautify HTML, CSS, and JS", category: "developer", icon: "Compress" },

  // Utility Tools
  { id: 46, name: "Password Generator", slug: "password-generator", description: "Generate strong random passwords", category: "utility", icon: "Lock" },
  { id: 47, name: "Random Number Gen", slug: "random-number-generator", description: "Generate random numbers within a range", category: "utility", icon: "Dice1" },
  { id: 48, name: "Unit Converter", slug: "unit-converter", description: "Convert between length, weight, temperature, and more", category: "utility", icon: "Ruler" },
  { id: 49, name: "Age Calculator", slug: "age-calculator", description: "Calculate exact age from birth date", category: "utility", icon: "Calendar" },
  { id: 50, name: "BMI Calculator", slug: "bmi-calculator", description: "Calculate Body Mass Index", category: "utility", icon: "Activity" },
];

export function getToolsByCategory(category: CategoryId) {
  return tools.filter((t) => t.category === category);
}

export function getToolBySlug(slug: string) {
  return tools.find((t) => t.slug === slug);
}
