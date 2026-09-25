# Mahant Tools

A free, fast, and powerful collection of 50+ browser-based developer and productivity tools. No uploads required — everything runs locally in your browser.

🌐 **Live Site:** [https://mahant-tools.vercel.app/](https://mahant-tools.vercel.app/)

## Features

- 🔒 **100% Private** — All processing happens in your browser. No files are uploaded to any server.
- ⚡ **No Installation** — Works directly in your browser, no downloads needed.
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile devices.
- 🌙 **Dark Mode** — Easy on the eyes with built-in dark theme support.
- 🔍 **Search & Command Palette** — Quickly find tools using the search bar or `Ctrl+K`.
- ⭐ **Favorites** — Mark your most-used tools for quick access.
- 📜 **History** — Keep track of your recent tool usage.

## Tool Categories

### 📄 PDF Tools (10)
- Merge PDF — Combine multiple PDFs into one
- Split PDF — Split a PDF into separate pages
- Compress PDF — Reduce PDF file size
- PDF to Images — Convert PDF pages to JPG/PNG
- Images to PDF — Combine images into a single PDF
- Rotate PDF — Rotate individual pages
- Reorder PDF — Reorder or delete pages
- Add Watermark — Add text or image watermark
- Add Page Numbers — Add page numbers to PDFs
- Extract Text — Extract text from PDFs

### 🖼️ Image Tools (13)
- Image Compressor — Compress without losing quality
- Image Resizer — Resize to exact dimensions
- Image Converter — Convert between PNG, JPG, WebP, AVIF
- Image Cropper — Crop to any aspect ratio
- Image Rotator — Rotate or flip images
- Image to Base64 — Convert to Base64 data URI
- Base64 to Image — Convert Base64 back to image
- Watermark Adder — Add text/logo watermark to images
- EXIF Viewer — View and remove image metadata
- Color Picker — Pick colors from an image
- Collage Maker — Create photo collages
- Favicon Generator — Generate favicons in multiple sizes
- Image to PDF — Convert images to PDF

### ✍️ Text Tools (11)
- Word Counter — Count words, characters, sentences
- Case Converter — Upper, lower, title, sentence case
- Text Diff Checker — Compare two texts
- Lorem Ipsum — Generate placeholder text
- Find & Replace — With regex support
- Slug Generator — URL-friendly slugs
- Remove Duplicates — Remove duplicate lines
- Text Reverser — Reverse text, words, or lines
- Markdown to HTML — Convert Markdown to HTML
- HTML to Markdown — Convert HTML to Markdown
- Line Sorter — Sort lines A-Z, Z-A, or randomly

### 💻 Developer Tools (11)
- JSON Formatter — Format, validate, and minify
- JSON to CSV — Convert between JSON and CSV
- Base64 Encode/Decode — Encode or decode strings
- URL Encode/Decode — Encode or decode URLs
- Hash Generator — MD5, SHA-1, SHA-256
- UUID Generator — Generate random UUIDs (v4)
- QR Code Generator — Generate QR codes
- Barcode Generator — Generate barcodes
- Color Converter — HEX, RGB, HSL conversion
- Regex Tester — Test regular expressions
- Code Minifier — Minify or beautify HTML/CSS/JS

### 🔧 Utility Tools (5)
- Password Generator — Strong random passwords (with shareable preset links)
- Random Number Generator — Numbers within a range
- Unit Converter — Length, weight, temperature
- Age Calculator — Calculate exact age
- BMI Calculator — Calculate Body Mass Index

### 🎬 Video Tools (4)
- Screen & Webcam Recorder — Record screen, webcam, or PiP with audio
- Video Trimmer — Cut and trim videos to exact timestamps
- Extract Audio — Extract audio track from video files into studio-quality WAV
- Video to Frames — Extract frames from video files as downloadable images

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **PDF Processing:** pdf-lib, pdfjs-dist
- **Image Processing:** Canvas API, browser-image-compression
- **Audio Processing:** Web Audio API (PCM 16-bit WAV encoder)
- **Video Processing:** MediaStream & MediaRecorder APIs
- **PWA / Offline:** Service Worker cache
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm, yarn, pnpm, or bun

### Installation

```bash
git clone https://github.com/keithpatel/Tools.git
cd Tools
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Production Build

```bash
npm run build
npm run start
```

## Deployment

This project is deployed on [Vercel](https://vercel.app). To deploy your own instance:

```bash
npx vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
