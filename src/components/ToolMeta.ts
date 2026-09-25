export interface ToolMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDesc: string;
  body: string[];
  howTo: string[];
  faq: { q: string; a: string }[];
}

function make(slug: string, overrides: Partial<ToolMeta>): ToolMeta {
  const defaults: ToolMeta = {
    title: `${slug} — Free Online Tool`,
    description: `Use our ${slug} tool online for free. All processing happens in your browser — files never leave your device.`,
    ogTitle: `${slug} — Free Online Tool`,
    ogDesc: `Free ${slug} tool. No upload, no server, 100% private.`,
    body: [`Use our ${slug} tool to get your work done quickly and privately.`],
    howTo: ["Follow the on-screen instructions to use this tool"],
    faq: [
      { q: "Is this tool free?", a: "Yes, completely free with no sign-up required." },
      { q: "Are my files uploaded to a server?", a: "No. Everything runs in your browser. Files never leave your device." },
    ],
  };
  return { ...defaults, ...overrides };
}

export const toolMeta: Record<string, ToolMeta> = {
  "merge-pdf": {
    title: "Merge PDF Online Free — Combine PDF Files in Browser",
    description: "Combine multiple PDF files into one document instantly in your browser. No upload, no server, 100% private.",
    ogTitle: "Merge PDF Files Online — Free & Private",
    ogDesc: "Combine multiple PDFs into one document. All processing happens in your browser — files never leave your device.",
    body: [
      "Merging PDFs is a common need when you have separate documents — invoices, contracts, scanned pages — that belong together as a single file. Our Merge PDF tool lets you combine up to dozens of PDF files into one document, all in your browser.",
      "Traditional PDF merging services require uploading your files to a server, which raises privacy concerns. This tool runs entirely on your device using the pdf-lib library. Drop your PDFs in, reorder them if needed, and download the merged result — nothing is ever uploaded.",
    ],
    howTo: ["Click the upload area or drag PDF files into it", "Add all the PDFs you want to merge (2 or more)", "Use the up/down buttons to reorder the files if needed", 'Click "Merge PDF" to combine them, then download the result'],
    faq: [
      { q: "Is there a limit on how many PDFs I can merge?", a: "There is no hard limit, but very large files or many files (20+) may cause slower performance since everything runs in your browser's memory." },
      { q: "Are my files uploaded to a server?", a: "No. All processing happens locally in your browser using WebAssembly. Your files never leave your device." },
      { q: "What happens to the original file order?", a: "You can reorder files before merging using the move buttons next to each file." },
    ],
  },
  "split-pdf": {
    title: "Split PDF Online Free — Extract Pages from PDF",
    description: "Split a PDF into separate pages or extract specific page ranges. All processing is client-side — your files stay private.",
    ogTitle: "Split PDF Files Online — Free & Private",
    ogDesc: "Extract pages from a PDF document in your browser. No upload needed.",
    body: [
      "Need only a few pages from a large PDF? Our Split PDF tool lets you extract specific page ranges or split every page into its own PDF. All processing happens locally using pdf-lib — your document never leaves your computer.",
      "Perfect for sharing only relevant sections of a contract, extracting receipts from a bank statement, or organizing scanned documents into separate files.",
    ],
    howTo: ["Upload the PDF file you want to split", "Enter page ranges (e.g. 1-3,5,7-9) or choose to split all pages individually", 'Click "Split" to extract the selected pages', "Download the resulting PDF file(s)"],
    faq: [
      { q: "Can I split a PDF into individual pages?", a: "Yes. Choose the 'Split all pages' option to create a separate PDF for each page." },
      { q: "Is this safe for confidential documents?", a: "Yes. All processing happens in your browser. Nothing is uploaded." },
    ],
  },
  "compress-pdf": {
    title: "Compress PDF Online Free — Reduce File Size Locally",
    description: "Reduce PDF file size in your browser. No upload needed. Privacy-first PDF compression using client-side processing.",
    ogTitle: "Compress PDF Files Online — Free & Private",
    ogDesc: "Shrink PDF file sizes instantly in your browser. No upload, no server — your documents stay private.",
    body: [
      "Large PDF files are hard to email, slow to upload, and eat up storage space. Compress PDF helps you reduce file size while keeping the content readable. Choose between a quick metadata cleanup or a more thorough re-render for maximum compression.",
      "All processing happens locally using pdf-lib and the Canvas API. Your documents never touch a server — perfect for sensitive contracts, personal records, or confidential business documents.",
    ],
    howTo: ["Upload your PDF file by clicking or dragging", "Choose a compression mode: standard (rewrite) or maximum (re-render as images)", "Click Compress and wait a moment while your browser processes the file", "Compare the before/after sizes, then download the compressed PDF"],
    faq: [
      { q: "How much can I compress a PDF?", a: "Results vary. Standard mode removes metadata and tightens the structure. Maximum mode re-renders pages as images, which can reduce size by 50-80% but may affect text selectability." },
      { q: "Is this safe for confidential documents?", a: "Yes. All processing is done in your browser using WebAssembly. No data is ever transmitted over the network." },
    ],
  },
  "pdf-to-images": make("PDF to Images", {
    title: "Convert PDF to Images Online Free — PDF to JPG/PNG",
    description: "Convert PDF pages to JPG or PNG images in your browser. No uploads, no servers — 100% private and free.",
    ogTitle: "Convert PDF to Images — Free Online Tool",
    ogDesc: "Turn PDF pages into high-quality JPG or PNG images. All processing happens in your browser.",
    body: [
      "Need to use PDF content in a presentation, a website, or a social media post? Our PDF to Images tool renders each page as a high-resolution image you can download individually. Uses the PDF.js library to render pages to canvas in your browser.",
      "This tool is ideal for extracting charts, diagrams, or signature blocks from PDFs. Since no upload is involved, it's safe for confidential documents.",
    ],
    howTo: ["Upload a PDF file", "Select the output format (JPG or PNG)", 'Click "Convert" to render each page as an image', "Preview the results and download each image individually"],
    faq: [
      { q: "What image formats are supported?", a: "You can export pages as JPG or PNG images." },
      { q: "What resolution are the images?", a: "Pages are rendered at a 2x scale for high-quality output." },
    ],
  }),
  "images-to-pdf": make("Images to PDF", {
    title: "Convert Images to PDF Online Free — JPG/PNG to PDF",
    description: "Combine images into a single PDF document. Works with JPG, PNG, and WebP. All processing is local and private.",
    ogTitle: "Convert Images to PDF — Free Online Tool",
    ogDesc: "Create a PDF from multiple images. No upload, no signup — runs entirely in your browser.",
    body: [
      "Turn a collection of images into a single PDF document in seconds. Whether you're combining scanned photos, creating a portfolio, or preparing a presentation, our Images to PDF tool handles JPG, PNG, and WebP formats.",
      "Each image becomes a separate page in the PDF, preserving your original order. All processing uses pdf-lib and the Canvas API, running entirely on your device.",
    ],
    howTo: ["Upload the images you want to include (drag multiple files or select them)", "Arrange them in the correct order", 'Click "Create PDF" to generate the document', "Download your new PDF file"],
    faq: [
      { q: "What image formats are supported?", a: "JPG, PNG, and WebP images are supported. Other formats are automatically converted." },
      { q: "Will my images be compressed?", a: "Images are embedded at their original resolution. No quality loss is introduced." },
    ],
  }),
  "rotate-pdf": make("Rotate PDF", {
    title: "Rotate PDF Pages Online Free — Rotate PDF in Browser",
    description: "Rotate individual PDF pages by 90, 180, or 270 degrees. All processing is client-side and private.",
    ogTitle: "Rotate PDF Pages — Free Online Tool",
    ogDesc: "Rotate pages in any PDF document. Works entirely in your browser — no upload needed.",
    body: [
      "Scanned a document upside down? Received a PDF with sideways pages? Our Rotate PDF tool lets you fix page orientation in seconds. Rotate pages by 90, 180, or 270 degrees, either individually or all at once.",
      "Built on pdf-lib, this tool runs fully in your browser. Your document stays on your device — perfect for correcting orientation on sensitive files.",
    ],
    howTo: ["Upload the PDF with pages that need rotating", "Click the rotate button on each page (90°, 180°, or 270°)", 'Click "Apply" to save your changes', "Download the corrected PDF"],
    faq: [
      { q: "Can I rotate all pages at once?", a: "Currently each page is rotated individually for precise control." },
      { q: "Does this re-encode the PDF?", a: "Rotation metadata is applied without re-encoding, preserving quality." },
    ],
  }),
  "reorder-pdf": make("Reorder PDF", {
    title: "Reorder & Delete PDF Pages Online Free",
    description: "Rearrange or delete pages in a PDF file. No upload needed — runs entirely in your browser.",
    ogTitle: "Reorder PDF Pages — Free Online Tool",
    ogDesc: "Change the order of pages in a PDF or delete unwanted pages. 100% client-side and private.",
    body: [
      "PDFs often arrive with pages in the wrong order or include extra pages that need removing. Our Reorder PDF tool gives you a visual page list where you can move pages up or down, delete unwanted pages, and download the cleaned-up result.",
      "Using pdf-lib under the hood, all operations happen on your device. No file ever leaves your computer.",
    ],
    howTo: ["Upload your PDF file", "Use the up/down buttons to reorder pages", "Use the delete button to remove unwanted pages", 'Click "Apply" then download the reorganized PDF'],
    faq: [
      { q: "Can I undo a deletion?", a: "Not directly. If you make a mistake, re-upload the original PDF and start over." },
      { q: "Is this safe for confidential files?", a: "Yes. All processing happens in your browser with no server upload." },
    ],
  }),
  "add-watermark": make("Add Watermark to PDF", {
    title: "Add Watermark to PDF Online Free — Text & Image Watermarks",
    description: "Add text or image watermarks to every page of a PDF. Runs in your browser — files stay private.",
    ogTitle: "Add Watermark to PDF — Free Online Tool",
    ogDesc: "Protect your PDF with a custom text watermark. All processing happens locally.",
    body: [
      "Protect your PDF documents from unauthorized use by adding visible watermarks. Our Add Watermark tool lets you add custom text with adjustable font size, opacity, rotation, and position — all without uploading your file anywhere.",
      "Uses pdf-lib to draw text directly onto each page programmatically. Perfect for drafts, client proofs, or internal documents that need a 'Confidential' or 'Draft' stamp.",
    ],
    howTo: ["Upload the PDF you want to watermark", "Enter your watermark text and adjust font size, opacity, and position", 'Click "Apply Watermark"', "Download the watermarked PDF"],
    faq: [
      { q: "Can I use an image as a watermark?", a: "Yes, you can upload an image logo to use as a watermark in addition to text." },
      { q: "Is the watermark editable after applying?", a: "No. Once applied, the watermark is embedded into the PDF as drawn text." },
    ],
  }),
  "add-page-numbers": make("Add Page Numbers to PDF", {
    title: "Add Page Numbers to PDF Online Free",
    description: "Add page numbers to any PDF document. Choose position, starting number, and format. No upload needed.",
    ogTitle: "Add Page Numbers to PDF — Free Online Tool",
    ogDesc: "Number the pages of your PDF document. Runs entirely in your browser — private and free.",
    body: [
      "Professional documents need page numbers. Our Add Page Numbers tool lets you insert page numbers at any position (bottom-center, bottom-right, top-right) with a choice of formats: simple numbers or 'Page X of Y'. All processing uses pdf-lib and stays on your device.",
    ],
    howTo: ["Upload your PDF file", "Choose the page number position (bottom-center, bottom-right, top-right)", "Set the starting number and format", 'Click "Add Numbers" then download the numbered PDF'],
    faq: [
      { q: "Can I skip the first page?", a: "Yes, you can set a starting number offset to skip title pages." },
      { q: "Is this permanent?", a: "Yes, page numbers are drawn onto the PDF and become part of the document." },
    ],
  }),
  "extract-text": make("Extract Text from PDF", {
    title: "Extract Text from PDF Online Free — PDF to Text",
    description: "Extract text content from PDF files. No upload needed. Uses PDF.js for accurate text extraction.",
    ogTitle: "Extract Text from PDF — Free Online Tool",
    ogDesc: "Get the text content of any PDF document. All processing is client-side and private.",
    body: [
      "Need to copy text from a scanned or text-based PDF? Our Extract Text tool uses PDF.js to parse the document and extract text content page by page. Great for pulling quotes, reusing content, or making PDF text searchable.",
    ],
    howTo: ["Upload your PDF file", "Wait for text extraction to complete", "View the extracted text or copy it all at once"],
    faq: [
      { q: "Does this work with scanned PDFs?", a: "It works best with text-based PDFs. Scanned documents (image-only PDFs) require OCR, which this tool does not include." },
      { q: "Is the text editable after extraction?", a: "Yes. The extracted text is displayed in a text area that you can edit, copy, or export." },
    ],
  }),

  // Image tools
  "image-resizer": make("Image Resizer", {
    title: "Resize Images Online Free — Change Image Dimensions",
    description: "Resize images to exact dimensions. Maintain aspect ratio or set custom width and height. All in your browser.",
    ogTitle: "Resize Images Free Online — Browser-Based Tool",
    ogDesc: "Change image dimensions instantly in your browser with aspect ratio lock support.",
    body: ["Resize images for websites, social media, or printing with our Image Resizer. The Canvas API handles resizing with optional aspect ratio lock so your images never get distorted."],
    howTo: ["Upload an image", "Enter desired width and height", "Toggle aspect ratio lock on/off", "Preview and download the resized image"],
    faq: [
      { q: "Does resizing reduce quality?", a: "The Canvas API uses bilinear interpolation, which preserves quality well for downscaling. Upscaling may result in softness." },
    ],
  }),
  "image-converter": make("Image Converter", {
    title: "Convert Images Online Free — PNG, JPG, WebP, AVIF Converter",
    description: "Convert images between PNG, JPG, WebP, and AVIF formats. All processing is local and private.",
    ogTitle: "Convert Image Formats — Free Online Tool",
    ogDesc: "Convert images to PNG, JPG, WebP, or AVIF in your browser. No upload needed.",
    body: ["Different use cases need different image formats. Our Image Converter lets you switch between PNG, JPG, WebP, and AVIF formats using the Canvas API. Perfect for optimizing web images or ensuring compatibility."],
    howTo: ["Upload an image", "Select the target format", 'Click "Convert"', "Download the converted image"],
    faq: [
      { q: "What formats are supported?", a: "PNG, JPG, WebP, and AVIF (AVIF may not be available in older browsers)." },
      { q: "Does conversion reduce quality?", a: "JPG and WebP use lossy compression. PNG is lossless. Choose accordingly." },
    ],
  }),
  "image-cropper": make("Image Cropper", {
    title: "Crop Images Online Free — Aspect Ratio Cropper",
    description: "Crop images with adjustable aspect ratios. Freeform, square, 4:3, 16:9, and more. Runs in your browser.",
    ogTitle: "Crop Images Free Online — Browser Cropping Tool",
    ogDesc: "Crop images to any aspect ratio. No upload, no server — your images stay private.",
    body: ["Our Image Cropper uses react-easy-crop for a smooth, touch-friendly cropping experience. Choose from common aspect ratios or crop freely. All image data stays on your device."],
    howTo: ["Upload an image", "Select an aspect ratio or choose freeform", "Adjust the crop area by dragging", "Download the cropped image"],
    faq: [
      { q: "What aspect ratios are available?", a: "Freeform, 1:1, 4:3, 16:9, 3:2, and custom." },
    ],
  }),
  "image-rotator": make("Image Rotator", {
    title: "Rotate & Flip Images Online Free",
    description: "Rotate images 90° clockwise or counter-clockwise, flip horizontally or vertically. All client-side.",
    ogTitle: "Rotate and Flip Images — Free Online Tool",
    ogDesc: "Fix image orientation with rotate and flip controls. Runs entirely in your browser.",
    body: ["Straighten crooked images or create mirrored effects with our Image Rotator. Uses Canvas API transforms for instant, high-quality rotation and flipping."],
    howTo: ["Upload an image", "Click Rotate CW or Rotate CCW to turn the image", "Click Flip H or Flip V to mirror", "Download the result"],
    faq: [
      { q: "Does rotating reduce quality?", a: "Rotation at 90° increments is lossless. Free rotation angles may introduce slight interpolation." },
    ],
  }),
  "image-to-base64": make("Image to Base64", {
    title: "Convert Image to Base64 Online Free",
    description: "Convert any image to a Base64 data URI. Perfect for embedding images in HTML, CSS, or JSON. All processing is local.",
    ogTitle: "Image to Base64 Converter — Free Online",
    ogDesc: "Turn images into Base64 data URIs. No upload needed — runs in your browser.",
    body: ["Base64 encoding lets you embed images directly in HTML, CSS, or JSON without separate file requests. Our Image to Base64 tool uses the FileReader API to convert your images instantly — nothing is uploaded."],
    howTo: ["Upload an image", "The Base64 string is generated automatically", "Click Copy to copy the data URI to your clipboard"],
    faq: [
      { q: "When would I use this?", a: "Base64 is useful for embedding small icons or images in HTML/CSS, reducing HTTP requests." },
      { q: "Are large images suitable for Base64?", a: "Large images generate very long strings that may slow page loading. Use for small images only." },
    ],
  }),
  "base64-to-image": make("Base64 to Image", {
    title: "Convert Base64 to Image Online Free",
    description: "Decode Base64 data URIs back into downloadable images. All client-side and private.",
    ogTitle: "Base64 to Image Converter — Free Online",
    ogDesc: "Turn Base64 strings back into viewable and downloadable images.",
    body: ["Paste a Base64 data URI to preview and download the original image. Useful for decoding embedded images from emails, databases, or code."],
    howTo: ["Paste a Base64 data URI into the text area", "The image preview appears automatically", "Click Download to save the decoded image"],
    faq: [
      { q: "What format will the output be?", a: "The output format matches whatever was encoded in the data URI (e.g., image/png, image/jpeg)." },
    ],
  }),
  "watermark-adder": make("Watermark Adder", {
    title: "Add Watermark to Images Online Free",
    description: "Protect your images with text or logo watermarks. Adjustable position, opacity, and size. All in your browser.",
    ogTitle: "Add Watermark to Images — Free Online Tool",
    ogDesc: "Add custom text or logo watermarks to your photos. All processing happens locally.",
    body: ["Protect your photography or creative work with visible watermarks. Add text with customizable font size and color, or upload a logo image. The Canvas API composites the watermark onto your original image — no uploads."],
    howTo: ["Upload an image to watermark", "Choose text or logo mode", "Adjust position, opacity, and size", "Download the watermarked image"],
    faq: [
      { q: "Can I adjust transparency?", a: "Yes. The opacity slider controls how visible the watermark is." },
    ],
  }),
  "exif-viewer": make("EXIF Viewer", {
    title: "View & Remove EXIF Metadata Online Free",
    description: "View and remove EXIF metadata from photos. Camera settings, GPS location, and more. All processing is local.",
    ogTitle: "EXIF Data Viewer — Free Online Tool",
    ogDesc: "Read and strip EXIF metadata from images. Runs entirely in your browser — no upload, no server.",
    body: ["Every photo taken with a digital camera or smartphone contains EXIF metadata: camera model, settings, date, and even GPS coordinates. Our EXIF Viewer lets you inspect this data and optionally remove it for privacy."],
    howTo: ["Upload an image", "EXIF data is displayed in a table automatically", 'Click "Remove EXIF" to strip metadata', "Download the clean image"],
    faq: [
      { q: "What EXIF fields are shown?", a: "Camera make/model, exposure settings, date, GPS coordinates, and more." },
      { q: "Is EXIF removal permanent?", a: "Yes. The tool re-encodes the image without metadata, which cannot be recovered." },
    ],
  }),
  "color-picker": make("Color Picker from Image", {
    title: "Pick Colors from Image Online Free — Eyedropper Tool",
    description: "Extract colors from any image by clicking. Get HEX, RGB, and HSL values. Runs in your browser.",
    ogTitle: "Color Picker from Images — Free Online",
    ogDesc: "Click any image to get its color values in HEX, RGB, and HSL. No upload needed.",
    body: ["Use our Color Picker to identify colors from any image. Click on a pixel to get its HEX, RGB, and HSL values. Perfect for designers matching colors from reference images."],
    howTo: ["Upload an image", "Click anywhere on the image to pick a color", "The HEX, RGB, and HSL values are shown", "Copy the values to your clipboard"],
    faq: [
      { q: "How accurate is the color picker?", a: "It reads raw pixel values from the canvas, giving you exact colors." },
    ],
  }),
  "collage-maker": make("Collage Maker", {
    title: "Create Photo Collages Online Free",
    description: "Combine multiple photos into a beautiful collage. Choose from grid layouts. All in your browser.",
    ogTitle: "Photo Collage Maker — Free Online Tool",
    ogDesc: "Create custom photo collages from your images. No upload, no signup — runs locally.",
    body: ["Our Collage Maker lets you combine multiple photos into a single composite image. Choose from grid layouts like 2x2, 1x2, 3x1, and adjust the gap between images."],
    howTo: ["Upload multiple images", "Choose a layout", "Adjust the gap size if desired", "Generate and download the collage"],
    faq: [
      { q: "How many images can I use?", a: "Up to 6 images depending on the layout you choose." },
    ],
  }),
  "favicon-generator": make("Favicon Generator", {
    title: "Generate Favicons Online Free — Multi-Size Favicon Set",
    description: "Generate favicon PNGs in multiple sizes from any image. 16x16 to 128x128. All client-side.",
    ogTitle: "Favicon Generator — Free Online Tool",
    ogDesc: "Create favicon images in all standard sizes. Runs entirely in your browser.",
    body: ["Generate a complete set of favicon images from a single source image. Includes standard sizes from 16x16 to 128x128. Uses Canvas API for high-quality downscaling."],
    howTo: ["Upload a square image", "Favicons are generated at all standard sizes", "Download each size or save them all"],
    faq: [
      { q: "What sizes are generated?", a: "16x16, 32x32, 48x48, 64x64, and 128x128 PNG files." },
    ],
  }),
  "image-to-pdf": make("Image to PDF", {
    title: "Convert Images to PDF Online Free",
    description: "Convert your images to PDF documents. Multiple images become multiple pages. All local and private.",
    ogTitle: "Image to PDF Converter — Free Online",
    ogDesc: "Turn images into PDF files. No upload needed — your files stay private.",
    body: ["Our Image to PDF tool embeds your images into a PDF document using pdf-lib. Each image becomes a full-size page. Supports JPG, PNG, and WebP formats with automatic conversion."],
    howTo: ["Upload one or more images", 'Click "Create PDF"', "Download your PDF"],
    faq: [
      { q: "What image formats work?", a: "JPG, PNG, SVG and WebP images are supported. Other formats are auto-converted via canvas." },
    ],
  }),

  // Text tools
  "word-counter": make("Word Counter", {
    title: "Word Counter Online Free — Count Words & Characters",
    description: "Count words, characters, sentences, and paragraphs in any text. Instant results in your browser.",
    ogTitle: "Word Counter — Free Online Tool",
    ogDesc: "Count words, characters, and more. All processing is instant and private.",
    body: ["Whether you're writing an essay, a tweet, or a blog post, knowing your word and character count is essential. Our Word Counter provides live counts for words, characters (with and without spaces), sentences, and paragraphs."],
    howTo: ["Type or paste your text into the text area", "Live counts update below as you type", "Use the results to meet length requirements"],
    faq: [
      { q: "Does this count characters with spaces?", a: "Yes. Both character counts — with and without spaces — are shown." },
    ],
  }),
  "case-converter": make("Case Converter", {
    title: "Case Converter Online Free — Upper, Lower, Title, Sentence Case",
    description: "Convert text between uppercase, lowercase, title case, sentence case, and camelCase. Instant browser tool.",
    ogTitle: "Text Case Converter — Free Online Tool",
    ogDesc: "Convert text case instantly in your browser. No upload, no server, 100% private.",
    body: ["Format text quickly with our Case Converter. Switch between UPPER CASE, lower case, Title Case, Sentence case, and camelCase with one click. All processing happens locally."],
    howTo: ["Paste your text into the input area", "Click the desired case format button", "Copy the converted result"],
    faq: [
      { q: "What case formats are supported?", a: "Uppercase, lowercase, title case, sentence case, and camelCase." },
    ],
  }),
  "text-diff-checker": make("Text Diff Checker", {
    title: "Text Diff Checker Online Free — Compare Text Side by Side",
    description: "Compare two texts and highlight the differences. Uses the diff library for accurate comparison. All client-side.",
    ogTitle: "Text Diff Checker — Free Online Tool",
    ogDesc: "Compare two versions of text and see differences highlighted. Runs locally in your browser.",
    body: ["Compare two versions of text to find exactly what changed. Our Diff Checker highlights added text in green and removed text in red, making edits easy to spot. Built on the diff library."],
    howTo: ["Paste the original text in the left box", "Paste the modified text in the right box", "Differences are highlighted automatically"],
    faq: [
      { q: "Is my text sent anywhere?", a: "No. All comparison happens in your browser using the diff library." },
    ],
  }),
  "lorem-ipsum": make("Lorem Ipsum Generator", {
    title: "Lorem Ipsum Generator Online Free — Placeholder Text",
    description: "Generate lorem ipsum placeholder text for your designs. Custom paragraphs and words. Runs in your browser.",
    ogTitle: "Lorem Ipsum Generator — Free Online",
    ogDesc: "Create placeholder text for mockups and designs. No server needed.",
    body: ["Need placeholder text for a design mockup or a website wireframe? Our Lorem Ipsum Generator lets you create custom amounts of dummy text with control over paragraph and word count."],
    howTo: ["Set the number of paragraphs", "Set words per paragraph", 'Click "Generate"', "Copy the generated text"],
    faq: [
      { q: "Can I customize the output?", a: "Yes. Adjust paragraphs and words per paragraph using the sliders." },
    ],
  }),
  "find-replace": make("Find & Replace", {
    title: "Find & Replace Text Online Free — With Regex Support",
    description: "Find and replace text in any document. Supports regular expressions for advanced search. All browser-based.",
    ogTitle: "Find and Replace — Free Online Tool",
    ogDesc: "Replace text with or without regex. All processing is local and private.",
    body: ["Our Find & Replace tool handles everything from simple text substitution to complex regex replacements. See the number of replacements made and preview results instantly."],
    howTo: ["Paste your text", "Enter the text to find", "Enter the replacement text", 'Click "Replace"'],
    faq: [
      { q: "Does this support regex?", a: "Yes. Toggle regex mode to use regular expressions in your search." },
    ],
  }),
  "slug-generator": make("Slug Generator", {
    title: "URL Slug Generator Online Free — Create SEO-Friendly Slugs",
    description: "Convert any text into a URL-friendly slug. Perfect for blog posts and pages. All in your browser.",
    ogTitle: "URL Slug Generator — Free Online Tool",
    ogDesc: "Create clean, SEO-friendly URL slugs from any text. No server, no upload.",
    body: ["URL slugs make your links clean and readable. Our Slug Generator converts any text into a lowercase, hyphenated, URL-friendly format. Essential for bloggers and content managers."],
    howTo: ["Type or paste your text", "The slug updates live as you type", "Copy the generated slug"],
    faq: [
      { q: "What characters are removed?", a: "Special characters are stripped. Spaces become hyphens. Everything is lowercased." },
    ],
  }),
  "remove-duplicates": make("Remove Duplicate Lines", {
    title: "Remove Duplicate Lines Online Free — Deduplicate Text",
    description: "Remove duplicate lines from any text. Shows original vs unique line count. All client-side.",
    ogTitle: "Remove Duplicate Lines — Free Online Tool",
    ogDesc: "Clean up text by removing repeated lines. Runs locally in your browser.",
    body: ["Clean up lists, CSV data, or any text with repeated lines. Our tool shows how many duplicates were found and lets you remove them with one click."],
    howTo: ["Paste your text with duplicate lines", "Check the duplicate count", 'Click "Remove Duplicates"', "Copy the cleaned result"],
    faq: [
      { q: "Are blank lines counted?", a: "Blank lines are included in the count but can be removed in a separate step." },
    ],
  }),
  "text-reverser": make("Text Reverser", {
    title: "Reverse Text Online Free — Reverse Words, Lines & Text",
    description: "Reverse entire text, words, or lines. Fun and useful for puzzles and formatting. All browser-based.",
    ogTitle: "Reverse Text — Free Online Tool",
    ogDesc: "Reverse text, words, or lines instantly in your browser.",
    body: ["Our Text Reverser offers three reversal modes: reverse the entire string, reverse word order, or reverse line order. Handy for creating puzzles, formatting, or just for fun."],
    howTo: ["Paste your text", "Choose Reverse Text, Reverse Words, or Reverse Lines", "Copy the result"],
    faq: [
      { q: "What's the difference between the modes?", a: "Reverse Text reverses character order. Reverse Words keeps words intact but reverses their order. Reverse Lines reverses line order." },
    ],
  }),
  "markdown-to-html": make("Markdown to HTML", {
    title: "Markdown to HTML Converter Online Free",
    description: "Convert Markdown to HTML instantly. See both rendered and raw HTML output. Uses the marked library.",
    ogTitle: "Markdown to HTML Converter — Free Online",
    ogDesc: "Turn your Markdown into clean HTML. All processing is local and private.",
    body: ["Our Markdown to HTML converter uses the marked library to parse Markdown and generate clean HTML. See a live preview of the rendered output alongside the raw HTML code."],
    howTo: ["Type or paste Markdown in the input area", "The rendered HTML preview appears", "Copy the raw HTML output below"],
    faq: [
      { q: "What Markdown features are supported?", a: "Headings, lists, code blocks, tables, links, images, and more." },
    ],
  }),
  "html-to-markdown": make("HTML to Markdown", {
    title: "HTML to Markdown Converter Online Free",
    description: "Convert HTML to clean Markdown format. Uses Turndown for accurate conversion. All client-side.",
    ogTitle: "HTML to Markdown Converter — Free Online",
    ogDesc: "Turn HTML code into readable Markdown. No upload needed.",
    body: ["Need to convert HTML content to Markdown for a wiki, CMS, or documentation? Our HTML to Markdown converter uses Turndown to produce clean, readable Markdown output."],
    howTo: ["Paste your HTML code", "The Markdown output appears automatically", "Copy the result"],
    faq: [
      { q: "Does this handle all HTML tags?", a: "It handles common block-level and inline elements. Very complex or malformed HTML may not convert perfectly." },
    ],
  }),
  "line-sorter": make("Line Sorter", {
    title: "Sort Lines Online Free — A-Z, Z-A, Shuffle",
    description: "Sort text lines alphabetically (A-Z or Z-A) or randomly shuffle them. All in your browser.",
    ogTitle: "Line Sorter — Free Online Tool",
    ogDesc: "Sort lines of text instantly. No server, no upload — runs locally.",
    body: ["Organize lists, sort keywords, or randomize entries with our Line Sorter. Three modes: A-Z (ascending), Z-A (descending), and Shuffle (random)."],
    howTo: ["Paste your text with one item per line", "Click A-Z, Z-A, or Shuffle", "Copy the sorted result"],
    faq: [
      { q: "Does this handle numbers?", a: "Lines are sorted as strings by default. Numeric sorting is not supported." },
    ],
  }),

  // Developer tools
  "json-to-csv": make("JSON to CSV Converter", {
    title: "JSON to CSV Converter Online Free",
    description: "Convert between JSON and CSV formats. Uses PapaParse for accurate conversion. All client-side.",
    ogTitle: "JSON to CSV Converter — Free Online Tool",
    ogDesc: "Convert JSON data to CSV and back. Runs entirely in your browser.",
    body: ["Switch between JSON and CSV formats effortlessly. Our converter uses PapaParse to handle complex nested JSON and large datasets. Bidirectional — convert JSON to CSV or CSV to JSON."],
    howTo: ["Paste your data (JSON or CSV)", "Choose the conversion direction", 'Click "Convert"', "Copy the result"],
    faq: [
      { q: "Does this handle nested JSON?", a: "For JSON to CSV, nested objects are flattened. For CSV to JSON, all rows become an array of objects." },
    ],
  }),
  "base64-encoder": make("Base64 Encoder/Decoder", {
    title: "Base64 Encode Decode Online Free",
    description: "Encode or decode Base64 strings instantly in your browser. No server, no upload — 100% private.",
    ogTitle: "Base64 Encode/Decode — Free Online Tool",
    ogDesc: "Convert text to and from Base64. All processing is local and private.",
    body: ["Base64 encoding is used everywhere — from data URIs to API tokens. Our tool lets you encode and decode Base64 strings using the native btoa() and atob() functions built into every modern browser."],
    howTo: ["Paste your text or Base64 string", "Click Encode or Decode", "Copy the result"],
    faq: [
      { q: "Is this safe for sensitive data?", a: "Yes. All encoding/decoding happens in your browser with no network calls." },
    ],
  }),
  "url-encoder": make("URL Encoder/Decoder", {
    title: "URL Encode Decode Online Free",
    description: "Encode or decode URL strings instantly. Uses native encodeURIComponent and decodeURIComponent. All browser-based.",
    ogTitle: "URL Encode/Decode — Free Online Tool",
    ogDesc: "Convert text for safe URL inclusion. All processing is in your browser.",
    body: ["URL encoding ensures special characters in URLs are transmitted correctly. Our tool encodes and decodes URL strings using standard JavaScript functions."],
    howTo: ["Paste your text or encoded URL", "Click Encode or Decode", "Copy the result"],
    faq: [
      { q: "What characters are encoded?", a: "Characters like spaces, &, ?, #, and others that have special meaning in URLs." },
    ],
  }),
  "hash-generator": make("Hash Generator", {
    title: "Hash Generator Online Free — MD5, SHA-1, SHA-256, SHA-512",
    description: "Generate cryptographic hashes from text. Supports MD5, SHA-1, SHA-256, and SHA-512. All client-side.",
    ogTitle: "Hash Generator — Free Online Tool",
    ogDesc: "Create MD5, SHA-1, SHA-256, and SHA-512 hashes. Runs in your browser — no server.",
    body: ["Generate cryptographic hash digests from any text input. Our tool supports MD5, SHA-1, SHA-256, and SHA-512 algorithms using the crypto-js library. All hashing happens locally."],
    howTo: ["Paste your text", "Select the hash algorithm", "The hash is generated automatically", "Copy the result"],
    faq: [
      { q: "Are these hashes secure?", a: "MD5 and SHA-1 are considered cryptographically broken for security purposes. SHA-256 and SHA-512 are currently secure." },
    ],
  }),
  "uuid-generator": make("UUID Generator", {
    title: "UUID Generator Online Free — Generate UUIDs v4",
    description: "Generate random UUIDs (v4) in bulk. Uses crypto.randomUUID for cryptographically strong IDs. All browser-based.",
    ogTitle: "UUID Generator — Free Online Tool",
    ogDesc: "Create random UUIDs instantly in your browser. No server, no tracking.",
    body: ["UUIDs are universally unique identifiers used in databases, APIs, and distributed systems. Our generator creates v4 random UUIDs using the browser's crypto API — the same standard used by modern applications."],
    howTo: ["Set how many UUIDs to generate (1-100)", 'Click "Generate"', "Copy individual UUIDs or all of them"],
    faq: [
      { q: "Are these truly unique?", a: "UUID v4 uses 122 random bits, making collisions astronomically unlikely." },
    ],
  }),
  "barcode-generator": make("Barcode Generator", {
    title: "Barcode Generator Online Free — Create Barcodes in Browser",
    description: "Generate CODE128 barcodes from any text or number. Download as SVG. All client-side and private.",
    ogTitle: "Barcode Generator — Free Online Tool",
    ogDesc: "Create barcodes instantly in your browser. No upload, no server — your data stays private.",
    body: ["Generate CODE128 barcodes for products, labels, or inventory. Our tool uses JsBarcode to render high-quality SVG barcodes that you can download and print."],
    howTo: ["Enter the data to encode", "The barcode updates in real-time", "Download as SVG image"],
    faq: [
      { q: "What barcode format is used?", a: "CODE128, which supports alphanumeric characters and is widely used in logistics and retail." },
    ],
  }),
  "color-converter": make("Color Converter", {
    title: "Color Converter Online Free — HEX, RGB, HSL Converter",
    description: "Convert colors between HEX, RGB, and HSL formats. Live preview of the selected color. All browser-based.",
    ogTitle: "Color Converter — Free Online Tool",
    ogDesc: "Convert between color formats instantly with live preview.",
    body: ["Easily switch between HEX, RGB, and HSL color formats. Our converter updates all fields in real-time as you type, with a live preview swatch. Essential for designers and developers."],
    howTo: ["Type a color value in any format (HEX, RGB, or HSL)", "All other formats update automatically", "See a live preview of the color"],
    faq: [
      { q: "What color formats are supported?", a: "HEX (#ff0000), RGB (rgb(255,0,0)), and HSL (hsl(0,100%,50%))." },
    ],
  }),
  "regex-tester": make("Regex Tester", {
    title: "Regex Tester Online Free — Test Regular Expressions Live",
    description: "Test regular expressions against any text. See matches highlighted in real-time. All client-side.",
    ogTitle: "Regex Tester — Free Online Tool",
    ogDesc: "Test and debug regular expressions in your browser. No server, no upload.",
    body: ["Debug and test your regular expressions with our live Regex Tester. Type a pattern and test string, see all matches highlighted immediately. Includes support for global, case-insensitive, and multiline flags."],
    howTo: ["Enter your regex pattern", "Enter your test string", "Set any flags (g, i, m)", "See matches highlighted in the text"],
    faq: [
      { q: "What regex engine is used?", a: "JavaScript's built-in RegExp engine, compatible with most modern regex syntax." },
    ],
  }),
  "code-minifier": make("Code Minifier/Beautifier", {
    title: "Minify HTML, CSS, and JavaScript Online Free",
    description: "Minify or beautify HTML, CSS, and JavaScript code. Uses js-beautify for formatting. All in your browser.",
    ogTitle: "Code Minifier & Beautifier — Free Online Tool",
    ogDesc: "Format or compress HTML, CSS, and JavaScript code. No server, no upload — runs locally.",
    body: ["Clean up messy code or compress it for production. Our tool uses js-beautify to beautify HTML, CSS, and JavaScript, and provides simple minification by removing extra whitespace."],
    howTo: ["Paste your code", "Select the language (HTML, CSS, or JS)", 'Click "Beautify" or "Minify"', "Copy the result"],
    faq: [
      { q: "Does this handle JSX?", a: "The beautifier handles standard JavaScript. JSX may not format perfectly." },
      { q: "How much does minification reduce size?", a: "Typically 20-40% for readable code with comments and whitespace." },
    ],
  }),

  // Utility tools
  "random-number-generator": make("Random Number Generator", {
    title: "Random Number Generator Online Free — Generate Random Numbers",
    description: "Generate random numbers within any range. Supports decimals and bulk generation. All browser-based.",
    ogTitle: "Random Number Generator — Free Online Tool",
    ogDesc: "Create random numbers instantly in your browser. No server, no tracking.",
    body: ["Generate random numbers for giveaways, sampling, games, or any purpose. Set min and max values, choose how many to generate, and optionally allow decimals."],
    howTo: ["Set the minimum and maximum values", "Set how many numbers to generate", "Toggle decimals on/off", 'Click "Generate"'],
    faq: [
      { q: "Are these cryptographically random?", a: "For most purposes the randomness is sufficient. For cryptographic use, use the Password Generator instead." },
    ],
  }),
  "unit-converter": make("Unit Converter", {
    title: "Unit Converter Online Free — Length, Weight, Temperature & More",
    description: "Convert between hundreds of units across 8 categories: length, weight, temperature, volume, area, speed, time, data.",
    ogTitle: "Unit Converter — Free Online Tool",
    ogDesc: "Convert units of measurement instantly in your browser. All processing is local.",
    body: ["Our comprehensive Unit Converter supports 8 measurement categories with hundreds of unit pairs. Length (mm to miles), weight (mg to pounds), temperature (°C to °F to K), volume, area, speed, time, and data storage."],
    howTo: ["Select a category", "Choose the source and target units", "Enter a value — the result updates live"],
    faq: [
      { q: "How many units are supported?", a: "Units across 8 categories including metric, imperial, and specialized units." },
    ],
  }),
  "age-calculator": make("Age Calculator", {
    title: "Age Calculator Online Free — Calculate Exact Age",
    description: "Calculate exact age in years, months, days, hours, and minutes. Shows next birthday countdown. All browser-based.",
    ogTitle: "Age Calculator — Free Online Tool",
    ogDesc: "Find your exact age down to the second. No server needed.",
    body: ["Calculate your exact age from any birth date. Shows years, months, days, hours, minutes, and even a countdown to your next birthday. All calculations use JavaScript's Date object."],
    howTo: ["Enter your date of birth", "Optionally set a target date (defaults to today)", 'Click "Calculate"', "View your exact age"],
    faq: [
      { q: "Is this accurate for leap years?", a: "Yes. JavaScript's Date object handles leap years automatically." },
    ],
  }),
  // Video tools
  "video-to-frames": make("Video to Frames", {
    title: "Extract Frames from Video Online Free — Video to JPG/PNG Sequence",
    description: "Extract still frames from MP4, MOV, and WebM videos as JPG or PNG images. All processing happens in your browser — video never leaves your device.",
    ogTitle: "Video to Frames — Free Online Tool",
    ogDesc: "Extract frames from any video in your browser. No upload, no server — 100% private.",
    body: [
      "Need to extract frames from a video for thumbnails, sprite sheets, animation prep, or still analysis? Our Video to Frames tool lets you capture a sequence of frames from any video file — all in your browser with zero uploads.",
      "Unlike upload-based converters such as ezgif which require sending your video to their servers (a genuine concern for private footage, large files, or sensitive content), this tool processes everything locally using the HTML5 Video API and Canvas. You control the output resolution, frame rate, time range, and quality — and your video never leaves your device.",
      "Supports resolution scaling (preset sizes or custom), JPG quality adjustment, start/end time trimming, and one-click ZIP download of all frames.",
    ],
    howTo: [
      "Upload your video file (MP4, MOV, or WebM)",
      "Set output resolution, frame rate (FPS), and time range",
      "Choose JPG or PNG output and adjust quality",
      'Click "Extract Frames" to begin processing, then download individual frames or the entire set as a ZIP',
    ],
    faq: [
      { q: "What video formats are supported?", a: "MP4 (H.264), MOV, and WebM formats are supported. Support depends on your browser's video codec capabilities." },
      { q: "Is my video uploaded to a server?", a: "No. Everything runs in your browser using the HTML5 Video API and Canvas. Unlike upload-based converters (ezgif, etc.), your video never leaves your device — this is a genuine privacy advantage for private or sensitive footage." },
      { q: "Is there a file size or duration limit?", a: "There is no hard limit, but very large videos (over 200MB or longer than 5 minutes) may be slow or unstable since all processing happens in your browser's memory. The tool shows a warning for large files." },
      { q: "Can I control the output resolution?", a: "Yes. Choose from preset sizes (1920x1080, 1280x720, 854x480, 640x360) or keep the original resolution. The frame is drawn at your chosen size for consistent output." },
      { q: "What is the output quality?", a: "JPG output has an adjustable quality slider from 10% to 100%. PNG output is lossless. You can choose either format before extraction." },
    ],
  }),
  "bmi-calculator": make("BMI Calculator", {
    title: "BMI Calculator Online Free — Body Mass Index",
    description: "Calculate your BMI and see your weight category. Supports metric and imperial units. All in your browser.",
    ogTitle: "BMI Calculator — Free Online Tool",
    ogDesc: "Check your Body Mass Index and weight category instantly. No upload, no server.",
    body: ["Our BMI Calculator helps you determine your Body Mass Index using either metric (kg/cm) or imperial (lbs/ft/in) units. See your BMI value, category (Underweight to Obese Class III), and a color-coded indicator."],
    howTo: ["Enter your weight and height", "Toggle between metric and imperial", 'Click "Calculate"', "View your BMI and category"],
    faq: [
      { q: "Is BMI an accurate health measure?", a: "BMI is a screening tool, not a diagnostic. It doesn't account for muscle mass, bone density, or body composition." },
      { q: "What are the BMI categories?", a: "Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese Class I (30-34.9), Class II (35-39.9), Class III (40+)." },
    ],
  }),
  "screen-recorder": make("Screen & Webcam Recorder", {
    title: "Screen & Webcam Recorder Online Free — No Download, No Upload",
    description: "Record your screen, webcam, or picture-in-picture with audio directly in your browser. 100% private, no watermarks, no sign-up.",
    ogTitle: "Screen & Webcam Recorder — Free & Private",
    ogDesc: "Record your screen, camera, and microphone directly in browser. Files stay on your device.",
    body: [
      "Capture presentations, software tutorials, bug reports, and video meetings without downloading heavy software or paying subscription fees.",
      "Everything is recorded directly in your browser using the MediaStream and MediaRecorder APIs. Your recordings are encoded locally on your computer and never uploaded to any server.",
    ],
    howTo: [
      "Select your recording source: Screen, Webcam, or Picture-in-Picture",
      "Choose your preferred audio input: Microphone, System Audio, Both, or Muted",
      "Click 'Start Recording' and select which window, screen, or tab to share",
      "Pause and resume as needed, then click 'Stop Recording' to preview and download your video",
    ],
    faq: [
      { q: "Is there a recording time limit or watermark?", a: "No! There are zero artificial time limits and no watermarks. You can record as long as your device has available memory." },
      { q: "Are my recordings uploaded to any cloud server?", a: "Never. All audio and video streams are processed, composited, and encoded 100% locally on your machine." },
      { q: "What formats can I download?", a: "Recordings are saved in high-efficiency WebM or MP4 formats that play smoothly in all modern media players and browsers." },
    ],
  }),
  "video-trimmer": make("Video Trimmer", {
    title: "Video Trimmer Online Free — Cut & Trim Video in Browser",
    description: "Cut and trim video clips quickly with millisecond precision without uploading to a server. 100% client-side privacy.",
    ogTitle: "Video Trimmer — Free & Private",
    ogDesc: "Trim and cut videos directly in your browser. No files uploaded.",
    body: [
      "Trim unwanted introductions, cut out pauses, or slice clips to the exact section you need without installing video editing software.",
      "Using modern browser APIs, your video is loaded and cut right in your browser's memory with zero uploads.",
    ],
    howTo: [
      "Drop or select the video file you want to trim",
      "Drag the start and end sliders or enter precise timestamps to frame the desired segment",
      "Click 'Play Segment' to preview the trimmed clip in a continuous loop",
      "Click 'Trim & Export' to generate and download your trimmed video clip",
    ],
    faq: [
      { q: "Are my video files uploaded to your servers?", a: "No. The entire trimming operation executes locally inside your browser. Your video files never leave your computer." },
      { q: "What video file formats are supported?", a: "Supports all browser-compatible video formats including MP4, WebM, MOV, and MKV." },
    ],
  }),
  "extract-audio": make("Extract Audio", {
    title: "Extract Audio from Video Online Free — MP4 to WAV Converter",
    description: "Extract the audio track from video files into lossless, studio-quality WAV audio directly in your browser. Fast, free, and completely private.",
    ogTitle: "Extract Audio from Video — Free & Private",
    ogDesc: "Strip audio from MP4 and WebM videos into studio-quality WAV files with no uploads.",
    body: [
      "Extract voice recordings, background music, or dialogue from any video file without loss of quality.",
      "Our tool utilizes the browser Web Audio API to decode the audio stream and encode it into an uncompressed, crystal-clear 16-bit PCM WAV audio file.",
    ],
    howTo: [
      "Drop or select a video file (MP4, WebM, MOV, or MKV)",
      "View the decoded audio waveform, duration, channels, and sample rate",
      "Listen to the preview using the integrated audio player",
      "Click 'Download WAV' to save the extracted audio directly to your device",
    ],
    faq: [
      { q: "Is the extracted audio compressed or degraded?", a: "No! The audio track is decoded and saved as uncompressed 16-bit PCM WAV at the original sample rate for pristine sound quality." },
      { q: "Can I extract audio from large video files?", a: "Yes. Processing is performed locally on your device without file size limits imposed by network upload caps." },
    ],
  }),
  "protect-pdf": make("Protect PDF", {
    title: "Protect PDF Online Free — Password Protect & Encrypt PDF",
    description: "Password protect and encrypt your PDF files with 128-bit standard encryption directly in your browser. 100% private, no uploads.",
    ogTitle: "Protect PDF — Free Password Protection & Encryption",
    ogDesc: "Set open passwords and restrict printing or copying on PDF files. Files never leave your device.",
    body: [
      "Keep confidential contracts, financial sheets, and personal documents secure from unauthorized eyes. Our Protect PDF tool lets you set a strong open password and adjust printing and copying permissions without ever uploading your files to an external server.",
      "Using client-side cryptographic hashing and standard PDF encryption, your protected file opens in Adobe Acrobat, Google Chrome, and standard PDF readers with a password prompt.",
    ],
    howTo: [
      "Upload or drop the PDF file you want to protect",
      "Enter an open password and confirm it",
      "Optionally configure permissions for printing and copying",
      "Click 'Protect PDF' and download your encrypted document",
    ],
    faq: [
      { q: "Does the recipient need special software to open the PDF?", a: "No. The encrypted PDF adheres to standard PDF encryption specifications and opens in Adobe Acrobat, Chrome, Safari, Preview, and standard mobile readers." },
      { q: "Is it safe to protect sensitive files?", a: "Yes. All encryption is calculated locally inside your browser. No passwords or documents are sent to any server." },
    ],
  }),
  "unlock-pdf": make("Unlock PDF", {
    title: "Unlock PDF Online Free — Remove PDF Password & Restrictions",
    description: "Remove passwords and printing/editing restrictions from PDF files directly in your browser. 100% client-side privacy.",
    ogTitle: "Unlock PDF — Remove Password & Restrictions",
    ogDesc: "Unlock password-protected PDFs and strip permission restrictions in your browser.",
    body: [
      "Tired of having to type a password every single time you open your own document? Or need to print a restricted PDF? Our Unlock PDF tool decrypts and strips security restrictions directly on your device.",
      "If the PDF requires an open password, enter it once to verify ownership and the tool produces a permanently unlocked, restriction-free version.",
    ],
    howTo: [
      "Upload your password-protected or restricted PDF",
      "If prompted, enter the document password",
      "Click 'Unlock PDF' to decrypt the file",
      "Download the restriction-free PDF document",
    ],
    faq: [
      { q: "Can this unlock any PDF without knowing the password?", a: "For PDFs protected by an open password, the correct password must be entered once to verify authorization and decrypt the content. For permission-restricted PDFs without an open password, restrictions are removed automatically." },
      { q: "Is my password sent over the internet?", a: "No. Password verification and decryption run 100% locally in your browser memory." },
    ],
  }),
  "fill-and-sign-pdf": make("Fill and Sign PDF", {
    title: "Fill and Sign PDF Online Free — Electronic Signatures & Form Filling",
    description: "Sign PDF documents and fill out forms online for free. Draw, type, or upload your signature with zero file uploads.",
    ogTitle: "Fill and Sign PDF Online — Free & Private",
    ogDesc: "Add signatures, dates, checkmarks, and text to any PDF in your browser.",
    body: [
      "Complete agreements, sign contracts, and fill out PDF forms without printing or scanning. Our Fill and Sign tool lets you draw your signature, type it in realistic cursive handwriting, or upload an existing image.",
      "Add custom text fields, date stamps, and checkmarks anywhere on the document, then download your finalized signed PDF.",
    ],
    howTo: [
      "Drop or select the PDF document you need to sign",
      "Click 'Add Signature' to draw, type, or upload your signature",
      "Drag and position your signature and annotations onto the page",
      "Add text boxes, date stamps, or checkmarks as needed",
      "Click 'Sign & Download PDF' to export the signed document",
    ],
    faq: [
      { q: "Can I save my signature for future documents?", a: "Yes. Check the 'Remember signature' box and your signature will be securely saved in your browser's local storage for 1-click reuse." },
      { q: "Does the output have a watermark?", a: "No. All tools are 100% free with no watermarks, no account requirement, and no hidden fees." },
    ],
  }),
  "extract-pages": make("Extract Pages", {
    title: "Extract PDF Pages Online Free — Save Selected Pages as PDF",
    description: "Extract specific pages from a PDF document into a new file. Select by thumbnails or page range. Fast and private.",
    ogTitle: "Extract PDF Pages — Free & Private",
    ogDesc: "Select and pull pages from any PDF into a new document. No uploads required.",
    body: [
      "Need to extract just pages 3 to 7 from a 50-page document? Our Extract Pages tool provides a visual thumbnail picker and flexible range syntax to pull exactly the pages you need.",
      "The extracted document preserves original vector fonts, images, and formatting with zero quality loss.",
    ],
    howTo: [
      "Upload your PDF document",
      "Click on page thumbnails to select pages, or type a page range (e.g. 1-3, 5, 8)",
      "Use quick presets like 'Odd Pages' or 'Even Pages' if desired",
      "Click 'Extract Pages' to create and download your new PDF",
    ],
    faq: [
      { q: "Is the original PDF altered?", a: "No. Your original file remains untouched on your device; a new PDF containing only the selected pages is generated." },
      { q: "Is there a limit on how many pages I can extract?", a: "No arbitrary limits! Extract as few or as many pages as you like." },
    ],
  }),
  "remove-pages": make("Remove Pages", {
    title: "Remove PDF Pages Online Free — Delete Unwanted Pages",
    description: "Delete unwanted pages or auto-detect and remove blank pages from PDF files in your browser. 100% private.",
    ogTitle: "Remove PDF Pages — Free & Private",
    ogDesc: "Delete unwanted or blank pages from any PDF document without uploading.",
    body: [
      "Clean up scanned documents and remove accidental blank pages, duplicate sheets, or irrelevant sections with ease.",
      "Features intelligent blank page auto-detection that analyzes page canvas pixels to detect and delete blank pages in one click.",
    ],
    howTo: [
      "Upload the PDF you want to clean up",
      "Click any page to mark it for deletion, or enter page numbers in the range box",
      "Optionally click 'Auto-detect blank pages' to identify empty sheets automatically",
      "Click 'Delete Pages' and download the pruned PDF",
    ],
    faq: [
      { q: "Can I undo page deletions before downloading?", a: "Yes. You can unmark individual pages or click 'Reset All' at any point before saving." },
      { q: "Does the auto-detect feature catch slightly off-white blank pages?", a: "Yes. Our pixel sampler accounts for scanner noise and subtle paper tints." },
    ],
  }),
  "crop-pdf": make("Crop PDF", {
    title: "Crop PDF Online Free — Trim Margins & Adjust Page Size",
    description: "Crop PDF pages and trim white margins with live preview. Apply to all pages, odd/even, or specific pages. Fast & free.",
    ogTitle: "Crop PDF Margins — Free & Private",
    ogDesc: "Trim margins and adjust visible area of PDF pages directly in your browser.",
    body: [
      "Remove excessive whitespace margins from PDF documents, trim headers and footers, or standardize page layouts for reading on e-readers and tablets.",
      "Includes a visual crop overlay with real-time margin adjustments in inches, millimeters, or PDF points.",
    ],
    howTo: [
      "Upload your PDF document",
      "Adjust top, bottom, left, and right margins or choose a preset like 'Standard' or 'Tight'",
      "Preview the crop box directly on the page viewer",
      "Select whether to apply to all pages, current page, or odd/even pages",
      "Click 'Crop PDF' and download your trimmed document",
    ],
    faq: [
      { q: "Does cropping reduce image resolution?", a: "No. Cropping modifies the document's CropBox and MediaBox boundaries without compressing or degrading any images or text." },
      { q: "Can I crop odd and even pages differently?", a: "Yes. Use the scope selector to apply specific margins to odd or even pages independently." },
    ],
  }),
  "extract-images": make("Extract Images", {
    title: "Extract Images from PDF Online Free — Save PDF Photos as PNG",
    description: "Extract all embedded photos and images from any PDF document in high resolution. Download individually or as a ZIP package.",
    ogTitle: "Extract Images from PDF — Free & Private",
    ogDesc: "Pull original embedded photos and artwork from PDF documents without quality loss.",
    body: [
      "Extract embedded photographs, diagrams, and artwork from PDF documents without taking blurry screenshots.",
      "Scans the PDF structure, pulls images at their original resolution, and lets you filter by size and download all images in a convenient ZIP archive.",
    ],
    howTo: [
      "Upload your PDF document",
      "Browse the gallery of extracted embedded images with dimensions",
      "Filter by image size to exclude tiny icons or bullets",
      "Download individual images or click 'Download All (ZIP)'",
    ],
    faq: [
      { q: "Are the images extracted at full resolution?", a: "Yes. Images are extracted at their exact native resolution and color depth as embedded inside the PDF." },
      { q: "What format are the extracted images saved in?", a: "Images are exported in lossless PNG format for maximum clarity and compatibility." },
    ],
  }),
  "pdf-metadata": make("PDF Metadata Editor", {
    title: "PDF Metadata Editor Online Free — View, Edit & Strip PDF Properties",
    description: "View and edit PDF Title, Author, Subject, Keywords, and Creator properties, or strip all metadata for privacy. 100% client-side.",
    ogTitle: "PDF Metadata Editor — View, Edit & Scrub Metadata",
    ogDesc: "Edit document properties or wipe author and application metadata before sharing.",
    body: [
      "Protect your personal privacy and present professional documents by editing or cleaning PDF metadata. Many PDF authoring programs automatically embed your computer name, username, and editing software.",
      "View all metadata fields, edit values, or click 'Strip All Metadata' to completely anonymize your PDF before sharing.",
    ],
    howTo: [
      "Upload your PDF file to inspect its current metadata properties",
      "Edit the Title, Author, Subject, Keywords, and Software fields as desired",
      "Or click 'Strip All Metadata' to wipe all identifying data in one click",
      "Click 'Save & Download PDF' to export your updated file",
    ],
    faq: [
      { q: "Why should I strip PDF metadata?", a: "Metadata often contains private information like your full name, software version, exact file paths, and creation timestamps that you may not want to share publicly." },
      { q: "Does editing metadata alter document text or formatting?", a: "No. Only the document's information dictionary is updated; the page contents, fonts, and layout remain completely untouched." },
    ],
  }),
};

