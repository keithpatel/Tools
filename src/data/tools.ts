export interface Tool {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: "pdf" | "image" | "text" | "developer" | "utility" | "video" | "audio" | "file";
  icon: string;
}

export const categories = [
  { id: "pdf", label: "PDF Tools", icon: "FileText", color: "#be185d" },
  { id: "image", label: "Image Tools", icon: "Image", color: "#b45309" },
  { id: "text", label: "Text Tools", icon: "AlignLeft", color: "#1d4ed8" },
  { id: "developer", label: "Developer Tools", icon: "Code", color: "#6d28d9" },
  { id: "utility", label: "Utility Tools", icon: "Wrench", color: "#047857" },
  { id: "video", label: "Video Tools", icon: "Film", color: "#0d9488" },
  { id: "audio", label: "Audio Tools", icon: "Music", color: "#7c3aed" },
  { id: "file", label: "File Tools", icon: "FolderOpen", color: "#475569" },
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
  { id: 55, name: "Protect PDF", slug: "protect-pdf", description: "Encrypt and password protect your PDF files", category: "pdf", icon: "Lock" },
  { id: 56, name: "Unlock PDF", slug: "unlock-pdf", description: "Remove passwords and permission restrictions from PDFs", category: "pdf", icon: "Unlock" },
  { id: 57, name: "Fill and Sign PDF", slug: "fill-and-sign-pdf", description: "Draw, type, or upload signatures and fill out PDF forms", category: "pdf", icon: "PenTool" },
  { id: 58, name: "Extract Pages", slug: "extract-pages", description: "Extract selected pages into a new PDF document", category: "pdf", icon: "FileCheck" },
  { id: 59, name: "Remove Pages", slug: "remove-pages", description: "Delete unwanted pages or auto-detect blank pages", category: "pdf", icon: "FileX" },
  { id: 60, name: "Crop PDF", slug: "crop-pdf", description: "Trim margins and adjust visible area of PDF pages", category: "pdf", icon: "Crop" },
  { id: 61, name: "Extract Images", slug: "extract-images", description: "Extract embedded photos and images from PDF in high quality", category: "pdf", icon: "Image" },
  { id: 62, name: "PDF Metadata Editor", slug: "pdf-metadata", description: "View, edit, or strip metadata (title, author, tags) from PDF", category: "pdf", icon: "Tags" },

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
  { id: 63, name: "Background Remover", slug: "background-remover", description: "Remove photo backgrounds with in-browser AI", category: "image", icon: "Eraser" },
  { id: 64, name: "Image Filters", slug: "image-filters", description: "Apply brightness, contrast and photo effects", category: "image", icon: "SlidersHorizontal" },
  { id: 65, name: "Passport Photo Maker", slug: "passport-photo", description: "Make passport and ID photos for 5 countries", category: "image", icon: "IdCard" },
  { id: 66, name: "Meme Generator", slug: "meme-generator", description: "Add classic caption text to any image", category: "image", icon: "Laugh" },
  { id: 67, name: "Image Splitter", slug: "image-splitter", description: "Split one image into an N x M tile grid", category: "image", icon: "Grid2x2" },
  { id: 68, name: "Sticker Maker", slug: "sticker-maker", description: "Cut out subjects with sticker borders", category: "image", icon: "Sticker" },
  { id: 69, name: "Compare Slider", slug: "compare-slider", description: "Draggable before and after image comparison", category: "image", icon: "SplitSquareHorizontal" },
  { id: 70, name: "Palette Extractor", slug: "palette-extractor", description: "Extract dominant colors with export options", category: "image", icon: "SwatchBook" },
  { id: 71, name: "Border & Frame", slug: "border-frame", description: "Add solid, gradient or polaroid frames", category: "image", icon: "Frame" },
  { id: 72, name: "Image to GIF", slug: "image-to-gif", description: "Combine images into an animated GIF", category: "image", icon: "Film" },
  { id: 73, name: "SVG PNG Converter", slug: "svg-png-converter", description: "Rasterize SVG or vectorize raster images", category: "image", icon: "Shapes" },
  { id: 74, name: "Batch Renamer", slug: "batch-renamer", description: "Rename many files by pattern into a ZIP", category: "image", icon: "FileSignature" },

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

  // Video Tools
  { id: 51, name: "Video to Frames", slug: "video-to-frames", description: "Extract frames from video files as downloadable images", category: "video", icon: "Clapperboard" },
  { id: 52, name: "Screen & Webcam Recorder", slug: "screen-recorder", description: "Record screen, webcam, or picture-in-picture with audio directly in browser", category: "video", icon: "Video" },
  { id: 53, name: "Video Trimmer", slug: "video-trimmer", description: "Cut and trim videos to exact timestamps without uploading", category: "video", icon: "Scissors" },
  { id: 54, name: "Extract Audio", slug: "extract-audio", description: "Extract audio track from video files into studio-quality WAV format", category: "video", icon: "Volume2" },

  // Developer Tools — batch 2
  { id: 75, name: "JWT Decoder", slug: "jwt-decoder", description: "Decode JWT header and payload instantly in your browser", category: "developer", icon: "KeyRound" },
  { id: 76, name: "Timestamp Converter", slug: "timestamp-converter", description: "Convert Unix timestamps to dates and back", category: "developer", icon: "Clock" },
  { id: 77, name: "Cron Explainer", slug: "cron-explainer", description: "Explain cron expressions in plain English with next runs", category: "developer", icon: "Timer" },
  { id: 78, name: "YAML to JSON", slug: "yaml-converter", description: "Convert between YAML and JSON formats", category: "developer", icon: "FileCode2" },
  { id: 79, name: "XML Formatter", slug: "xml-formatter", description: "Format, validate, and minify XML documents", category: "developer", icon: "Braces" },
  { id: 87, name: "CSS Gradient Generator", slug: "css-gradient-generator", description: "Create CSS gradients and box-shadows visually", category: "developer", icon: "Palette" },

  // Text Tools — batch 2
  { id: 80, name: "Readability Analyzer", slug: "readability-analyzer", description: "Check reading level, grade, and reading time", category: "text", icon: "BookOpen" },
  { id: 81, name: "CSV Viewer", slug: "csv-viewer", description: "View, search, and sort CSV files as a table", category: "text", icon: "Table" },
  { id: 82, name: "Text to Speech", slug: "text-to-speech", description: "Read text aloud with natural voices", category: "text", icon: "Volume2" },

  // Utility Tools — batch 2
  { id: 83, name: "Pomodoro Timer", slug: "pomodoro-timer", description: "Focus timer with stopwatch and countdown modes", category: "utility", icon: "AlarmClock" },
  { id: 84, name: "Date Calculator", slug: "date-calculator", description: "Date difference, business days, and timezone converter", category: "utility", icon: "CalendarDays" },
  { id: 85, name: "Loan Calculator", slug: "loan-calculator", description: "EMI, interest, tip, and percentage calculators", category: "utility", icon: "Calculator" },
  { id: 86, name: "Invoice Generator", slug: "invoice-generator", description: "Create and print professional invoices as PDF", category: "utility", icon: "Receipt" },

  // Image Tools — batch 2
  { id: 88, name: "QR Scanner", slug: "qr-scanner", description: "Scan and decode QR codes from images", category: "image", icon: "ScanLine" },
  { id: 89, name: "HEIC Converter", slug: "heic-converter", description: "Convert iPhone HEIC photos to JPG, PNG, or WebP", category: "image", icon: "Repeat" },
  { id: 90, name: "GIF Splitter", slug: "gif-splitter", description: "Split animated GIFs into individual frames", category: "image", icon: "Images" },
  { id: 91, name: "SVG Optimizer", slug: "svg-optimizer", description: "Minify and optimize SVG files", category: "image", icon: "Shapes" },
  { id: 92, name: "Blur Image", slug: "blur-image", description: "Blur or pixelate parts of an image for privacy", category: "image", icon: "Sparkles" },

  // PDF Tools — batch 2
  { id: 93, name: "Redact PDF", slug: "redact-pdf", description: "Black out sensitive text in PDFs permanently", category: "pdf", icon: "Eraser" },
  { id: 98, name: "PDF Editor", slug: "pdf-editor", description: "Edit PDF text, draw, highlight, add images, rotate and delete pages", category: "pdf", icon: "PenTool" },

  // File Tools (new)
  { id: 94, name: "ZIP Creator", slug: "zip-creator", description: "Create and extract ZIP archives in your browser", category: "file", icon: "Archive" },

  // Audio Tools (new)
  { id: 95, name: "Audio Trimmer", slug: "audio-trimmer", description: "Trim audio files to exact timestamps", category: "audio", icon: "Scissors" },
  { id: 96, name: "Voice Recorder", slug: "voice-recorder", description: "Record voice notes with your microphone", category: "audio", icon: "Mic" },
  { id: 97, name: "Audio Converter", slug: "audio-converter", description: "Convert audio files to WAV format", category: "audio", icon: "Repeat" },
];

export function getToolsByCategory(category: CategoryId) {
  return tools.filter((t) => t.category === category);
}

export function getToolBySlug(slug: string) {
  return tools.find((t) => t.slug === slug);
}
