"use client";

import { useState, useCallback, useRef } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Download } from "lucide-react";

let Cropper: any = null;
try {
  Cropper = require("react-easy-crop").default;
} catch {
  // react-easy-crop not available
}

const ASPECTS = [
  { label: "Free", value: NaN },
  { label: "1:1", value: 1 / 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
];

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getCroppedImg(imageSrc: string, crop: { x: number; y: number }, zoom: number, aspect: number): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const img = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const outputSize = 600;
    const cropWidth = img.naturalWidth / zoom;
    const cropHeight = cropWidth / aspect;
    const cropX = (crop.x / 100) * img.naturalWidth + (img.naturalWidth - cropWidth) / 2;
    const cropY = (crop.y / 100) * img.naturalHeight + (img.naturalHeight - cropHeight) / 2;

    canvas.width = outputSize;
    canvas.height = outputSize / aspect;

    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas empty")), "image/png");
  });
}

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(NaN);
  const [aspectLabel, setAspectLabel] = useState("Free");
  const [resultUrl, setResultUrl] = useState("");
  const [cropping, setCropping] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setResultUrl("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCrop({ x: croppedAreaPixels.x, y: croppedAreaPixels.y });
  }, []);

  const handleCropImage = async () => {
    if (!file) return;
    setCropping(true);
    try {
      const a = isNaN(aspect) ? 1 : aspect;
      const blob = await getCroppedImg(imageUrl, crop, zoom, a);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
    }
    setCropping(false);
  };

  const currentAspect = isNaN(aspect) ? undefined : aspect;

  return (
    <ToolLayout
      title="Image Cropper"
      description="Crop images to your desired aspect ratio. Supports freeform, square, and standard ratios."
      faq={[
        { q: "Is react-easy-crop available?", a: Cropper ? "Yes, it is installed and loaded." : "No, the library could not be loaded. A fallback is used." },
      ]}
    >
      {!file ? (
        <DropZone onFiles={handleFiles} accept="image/*" enableCamera />
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-64 sm:h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden touch-none">
            {Cropper ? (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={currentAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                react-easy-crop not available. Using simplified view.
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium self-center mr-1 w-full sm:w-auto">Aspect:</span>
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                onClick={() => { setAspect(a.value); setAspectLabel(a.label); }}
                className={`px-3 py-2 sm:py-1 rounded-lg text-xs font-medium transition-colors min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                  aspectLabel === a.label
                    ? "bg-accent text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium">Zoom: {zoom.toFixed(1)}x</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-7 sm:h-5 mt-1"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCropImage}
              disabled={cropping}
              className="w-full sm:w-auto px-5 py-3 sm:py-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-base sm:text-sm font-medium transition-all min-h-[44px] flex items-center justify-center shadow-sm"
            >
              {cropping ? "Cropping..." : "Crop"}
            </button>
            <button
              onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); }}
              className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-base sm:text-sm transition-colors min-h-[44px] flex items-center justify-center"
            >
              Reset
            </button>
          </div>

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Cropped Result</p>
              <img src={resultUrl} alt="Cropped" className="max-w-full max-h-56 sm:max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-3 mx-auto sm:mx-0" />
              <a
                href={resultUrl}
                download={`cropped-${file.name}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base sm:text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}

          {/* Mobile sticky action bar */}
          <div
            className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 flex gap-2"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            {resultUrl ? (
              <a
                href={resultUrl}
                download={`cropped-${file.name}`}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl font-medium text-base active:bg-green-700 transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" /> Download
              </a>
            ) : (
              <button
                onClick={handleCropImage}
                disabled={cropping}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-accent text-white rounded-xl font-medium text-base active:opacity-90 disabled:opacity-50 transition-colors shadow-lg"
              >
                {cropping ? "Cropping..." : "Crop Image"}
              </button>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
