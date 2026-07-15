"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "").match(/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function parseRgb(input: string): { r: number; g: number; b: number } | null {
  const m = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (!m) return null;
  return { r: Math.min(255, Math.max(0, Number(m[1]))), g: Math.min(255, Math.max(0, Number(m[2]))), b: Math.min(255, Math.max(0, Number(m[3]))) };
}

function parseHsl(input: string): { h: number; s: number; l: number } | null {
  const m = input.match(/^hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/);
  if (!m) return null;
  return { h: ((Number(m[1]) % 360) + 360) % 360, s: Math.min(100, Math.max(0, Number(m[2]))), l: Math.min(100, Math.max(0, Number(m[3]))) };
}

export default function ColorConverter() {
  const [hex, setHex] = useState("#3498db");
  const [rgb, setRgb] = useState("rgb(52,152,219)");
  const [hsl, setHsl] = useState("hsl(210,70%,53%)");
  const [preview, setPreview] = useState("#3498db");

  const fromHex = useCallback((value: string) => {
    setHex(value);
    const c = hexToRgb(value);
    if (c) {
      setRgb(`rgb(${c.r},${c.g},${c.b})`);
      const h = rgbToHsl(c.r, c.g, c.b);
      setHsl(`hsl(${h.h},${h.s}%,${h.l}%)`);
      setPreview(value);
    }
  }, []);

  const fromRgb = useCallback((value: string) => {
    setRgb(value);
    const c = parseRgb(value);
    if (c) {
      setHex(rgbToHex(c.r, c.g, c.b));
      const h = rgbToHsl(c.r, c.g, c.b);
      setHsl(`hsl(${h.h},${h.s}%,${h.l}%)`);
      setPreview(rgbToHex(c.r, c.g, c.b));
    }
  }, []);

  const fromHsl = useCallback((value: string) => {
    setHsl(value);
    const c = parseHsl(value);
    if (c) {
      const rgb_ = hslToRgb(c.h, c.s, c.l);
      setRgb(`rgb(${rgb_.r},${rgb_.g},${rgb_.b})`);
      setHex(rgbToHex(rgb_.r, rgb_.g, rgb_.b));
      setPreview(rgbToHex(rgb_.r, rgb_.g, rgb_.b));
    }
  }, []);

  return (
    <ToolLayout
      title="Color Converter"
      description="Convert between HEX, RGB, and HSL color formats."
      faq={[
        { q: "What is HSL?", a: "HSL stands for Hue, Saturation, Lightness — a cylindrical color model." },
        { q: "Are there invalid color values?", a: "RGB values should be 0–255, HSL 0–360 for hue and 0–100% for saturation and lightness." },
      ]}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-700 shrink-0" style={{ backgroundColor: preview }} />
        <div className="text-xs text-gray-500 font-mono">{preview}</div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">HEX</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="#000000"
            value={hex}
            onChange={(e) => fromHex(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">RGB</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="rgb(0,0,0)"
            value={rgb}
            onChange={(e) => fromRgb(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">HSL</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="hsl(0,0%,0%)"
            value={hsl}
            onChange={(e) => fromHsl(e.target.value)}
          />
        </div>
      </div>
    </ToolLayout>
  );
}
