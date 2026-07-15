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
        <DropZone onFiles={handleFiles} accept="image/*" />
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
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
            <span className="text-xs font-medium self-center mr-1">Aspect:</span>
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                onClick={() => { setAspect(a.value); setAspectLabel(a.label); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
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
              className="w-full mt-1"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCropImage}
              disabled={cropping}
              className="px-5 py-2 bg-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 text-sm font-medium transition-all"
            >
              {cropping ? "Cropping..." : "Crop"}
            </button>
            <button
              onClick={() => { setFile(null); setImageUrl(""); setResultUrl(""); }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm transition-colors"
            >
              Reset
            </button>
          </div>

          {resultUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Cropped Result</p>
              <img src={resultUrl} alt="Cropped" className="max-h-48 rounded-lg object-contain bg-gray-100 dark:bg-gray-800 mb-2" />
              <a
                href={resultUrl}
                download={`cropped-${file.name}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
