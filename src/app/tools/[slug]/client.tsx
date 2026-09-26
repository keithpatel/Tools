"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { getToolBySlug } from "@/data/tools";
import { ToolPageLayout } from "@/components/ToolPageLayout";
import { ToolSkeleton } from "@/components/ToolSkeleton";

const toolComponents: Record<string, any> = {
  "merge-pdf": dynamic(() => import("@/components/tools/MergePDF"), { ssr: false }),
  "split-pdf": dynamic(() => import("@/components/tools/SplitPDF"), { ssr: false }),
  "compress-pdf": dynamic(() => import("@/components/tools/CompressPDF"), { ssr: false }),
  "pdf-to-images": dynamic(() => import("@/components/tools/PDFToImages"), { ssr: false }),
  "images-to-pdf": dynamic(() => import("@/components/tools/ImagesToPDF"), { ssr: false }),
  "rotate-pdf": dynamic(() => import("@/components/tools/RotatePDF"), { ssr: false }),
  "reorder-pdf": dynamic(() => import("@/components/tools/ReorderPDF"), { ssr: false }),
  "add-watermark": dynamic(() => import("@/components/tools/AddWatermark"), { ssr: false }),
  "add-page-numbers": dynamic(() => import("@/components/tools/AddPageNumbers"), { ssr: false }),
  "extract-text": dynamic(() => import("@/components/tools/ExtractText"), { ssr: false }),
  "protect-pdf": dynamic(() => import("@/components/tools/ProtectPDF"), { ssr: false }),
  "unlock-pdf": dynamic(() => import("@/components/tools/UnlockPDF"), { ssr: false }),
  "fill-and-sign-pdf": dynamic(() => import("@/components/tools/FillAndSignPDF"), { ssr: false }),
  "extract-pages": dynamic(() => import("@/components/tools/ExtractPages"), { ssr: false }),
  "remove-pages": dynamic(() => import("@/components/tools/RemovePages"), { ssr: false }),
  "crop-pdf": dynamic(() => import("@/components/tools/CropPDF"), { ssr: false }),
  "extract-images": dynamic(() => import("@/components/tools/ExtractImages"), { ssr: false }),
  "pdf-metadata": dynamic(() => import("@/components/tools/PDFMetadata"), { ssr: false }),
  "image-compressor": dynamic(() => import("@/components/tools/ImageCompressor"), { ssr: false }),
  "image-resizer": dynamic(() => import("@/components/tools/ImageResizer"), { ssr: false }),
  "image-converter": dynamic(() => import("@/components/tools/ImageConverter"), { ssr: false }),
  "image-cropper": dynamic(() => import("@/components/tools/ImageCropper"), { ssr: false }),
  "image-rotator": dynamic(() => import("@/components/tools/ImageRotator"), { ssr: false }),
  "image-to-base64": dynamic(() => import("@/components/tools/ImageToBase64"), { ssr: false }),
  "base64-to-image": dynamic(() => import("@/components/tools/Base64ToImage"), { ssr: false }),
  "watermark-adder": dynamic(() => import("@/components/tools/WatermarkAdder"), { ssr: false }),
  "exif-viewer": dynamic(() => import("@/components/tools/ExifViewer"), { ssr: false }),
  "color-picker": dynamic(() => import("@/components/tools/ColorPicker"), { ssr: false }),
  "collage-maker": dynamic(() => import("@/components/tools/CollageMaker"), { ssr: false }),
  "favicon-generator": dynamic(() => import("@/components/tools/FaviconGenerator"), { ssr: false }),
  "background-remover": dynamic(() => import("@/components/tools/BackgroundRemover"), { ssr: false }),
  "image-filters": dynamic(() => import("@/components/tools/ImageFilters"), { ssr: false }),
  "passport-photo": dynamic(() => import("@/components/tools/PassportPhoto"), { ssr: false }),
  "meme-generator": dynamic(() => import("@/components/tools/MemeGenerator"), { ssr: false }),
  "image-splitter": dynamic(() => import("@/components/tools/ImageSplitter"), { ssr: false }),
  "sticker-maker": dynamic(() => import("@/components/tools/StickerMaker"), { ssr: false }),
  "compare-slider": dynamic(() => import("@/components/tools/CompareSlider"), { ssr: false }),
  "palette-extractor": dynamic(() => import("@/components/tools/PaletteExtractor"), { ssr: false }),
  "border-frame": dynamic(() => import("@/components/tools/BorderFrame"), { ssr: false }),
  "image-to-gif": dynamic(() => import("@/components/tools/ImageToGIF"), { ssr: false }),
  "svg-png-converter": dynamic(() => import("@/components/tools/SvgPngConverter"), { ssr: false }),
  "batch-renamer": dynamic(() => import("@/components/tools/BatchRenamer"), { ssr: false }),
  "word-counter": dynamic(() => import("@/components/tools/WordCounter"), { ssr: false }),
  "case-converter": dynamic(() => import("@/components/tools/CaseConverter"), { ssr: false }),
  "text-diff-checker": dynamic(() => import("@/components/tools/TextDiffChecker"), { ssr: false }),
  "lorem-ipsum": dynamic(() => import("@/components/tools/LoremIpsum"), { ssr: false }),
  "find-replace": dynamic(() => import("@/components/tools/FindReplace"), { ssr: false }),
  "slug-generator": dynamic(() => import("@/components/tools/SlugGenerator"), { ssr: false }),
  "remove-duplicates": dynamic(() => import("@/components/tools/RemoveDuplicates"), { ssr: false }),
  "text-reverser": dynamic(() => import("@/components/tools/TextReverser"), { ssr: false }),
  "markdown-to-html": dynamic(() => import("@/components/tools/MarkdownToHTML"), { ssr: false }),
  "html-to-markdown": dynamic(() => import("@/components/tools/HTMLToMarkdown"), { ssr: false }),
  "line-sorter": dynamic(() => import("@/components/tools/LineSorter"), { ssr: false }),
  "json-formatter": dynamic(() => import("@/components/tools/JSONFormatter"), { ssr: false }),
  "json-to-csv": dynamic(() => import("@/components/tools/JSONToCSV"), { ssr: false }),
  "base64-encoder": dynamic(() => import("@/components/tools/Base64Encoder"), { ssr: false }),
  "url-encoder": dynamic(() => import("@/components/tools/URLEncoder"), { ssr: false }),
  "hash-generator": dynamic(() => import("@/components/tools/HashGenerator"), { ssr: false }),
  "uuid-generator": dynamic(() => import("@/components/tools/UUIDGenerator"), { ssr: false }),
  "qr-code-generator": dynamic(() => import("@/components/tools/QRCodeGenerator"), { ssr: false }),
  "barcode-generator": dynamic(() => import("@/components/tools/BarcodeGenerator"), { ssr: false }),
  "color-converter": dynamic(() => import("@/components/tools/ColorConverter"), { ssr: false }),
  "regex-tester": dynamic(() => import("@/components/tools/RegexTester"), { ssr: false }),
  "code-minifier": dynamic(() => import("@/components/tools/CodeMinifier"), { ssr: false }),
  "password-generator": dynamic(() => import("@/components/tools/PasswordGenerator"), { ssr: false }),
  "random-number-generator": dynamic(() => import("@/components/tools/RandomNumberGenerator"), { ssr: false }),
  "unit-converter": dynamic(() => import("@/components/tools/UnitConverter"), { ssr: false }),
  "age-calculator": dynamic(() => import("@/components/tools/AgeCalculator"), { ssr: false }),
  "bmi-calculator": dynamic(() => import("@/components/tools/BMICalculator"), { ssr: false }),
  "video-to-frames": dynamic(() => import("@/components/tools/VideoToFrames"), { ssr: false }),
  "screen-recorder": dynamic(() => import("@/components/tools/ScreenRecorder"), { ssr: false }),
  "video-trimmer": dynamic(() => import("@/components/tools/VideoTrimmer"), { ssr: false }),
  "extract-audio": dynamic(() => import("@/components/tools/ExtractAudio"), { ssr: false }),
  "jwt-decoder": dynamic(() => import("@/components/tools/JwtDecoder"), { ssr: false }),
  "timestamp-converter": dynamic(() => import("@/components/tools/TimestampConverter"), { ssr: false }),
  "cron-explainer": dynamic(() => import("@/components/tools/CronExplainer"), { ssr: false }),
  "yaml-converter": dynamic(() => import("@/components/tools/YamlConverter"), { ssr: false }),
  "xml-formatter": dynamic(() => import("@/components/tools/XmlFormatter"), { ssr: false }),
  "css-gradient-generator": dynamic(() => import("@/components/tools/CssGradientGenerator"), { ssr: false }),
  "readability-analyzer": dynamic(() => import("@/components/tools/ReadabilityAnalyzer"), { ssr: false }),
  "csv-viewer": dynamic(() => import("@/components/tools/CsvViewer"), { ssr: false }),
  "text-to-speech": dynamic(() => import("@/components/tools/TextToSpeech"), { ssr: false }),
  "pomodoro-timer": dynamic(() => import("@/components/tools/PomodoroTimer"), { ssr: false }),
  "date-calculator": dynamic(() => import("@/components/tools/DateCalculator"), { ssr: false }),
  "loan-calculator": dynamic(() => import("@/components/tools/LoanCalculator"), { ssr: false }),
  "invoice-generator": dynamic(() => import("@/components/tools/InvoiceGenerator"), { ssr: false }),
  "qr-scanner": dynamic(() => import("@/components/tools/QrScanner"), { ssr: false }),
  "heic-converter": dynamic(() => import("@/components/tools/HeicConverter"), { ssr: false }),
  "gif-splitter": dynamic(() => import("@/components/tools/GifSplitter"), { ssr: false }),
  "svg-optimizer": dynamic(() => import("@/components/tools/SvgOptimizer"), { ssr: false }),
  "blur-image": dynamic(() => import("@/components/tools/BlurImage"), { ssr: false }),
  "redact-pdf": dynamic(() => import("@/components/tools/RedactPdf"), { ssr: false }),
  "zip-creator": dynamic(() => import("@/components/tools/ZipCreator"), { ssr: false }),
  "audio-trimmer": dynamic(() => import("@/components/tools/AudioTrimmer"), { ssr: false }),
  "voice-recorder": dynamic(() => import("@/components/tools/VoiceRecorder"), { ssr: false }),
  "audio-converter": dynamic(() => import("@/components/tools/AudioConverter"), { ssr: false }),
  "pdf-editor": dynamic(() => import("@/components/tools/PdfEditor"), { ssr: false }),
};

export function ToolPageClient({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const Component = toolComponents[slug];
  if (!Component) return <div className="text-center py-12 text-text-secondary">Tool not found</div>;

  return (
    <ToolPageLayout slug={slug}>
      <Suspense fallback={<ToolSkeleton />}>
        <Component />
      </Suspense>
    </ToolPageLayout>
  );
}
