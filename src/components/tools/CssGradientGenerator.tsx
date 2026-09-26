"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";
import { Share2, Check } from "lucide-react";

function initialParams() {
  const d = { c1: "#6366f1", c2: "#ec4899", angle: "135", shadow: "0 10px 30px rgba(0,0,0,0.25)" };
  if (typeof window === "undefined") return d;
  try {
    const sp = new URLSearchParams(window.location.search);
    const c1 = sp.get("c1");
    const c2 = sp.get("c2");
    const angle = sp.get("angle");
    const shadow = sp.get("shadow");
    if (c1 && /^#[0-9a-fA-F]{6}$/.test(c1)) d.c1 = c1;
    if (c2 && /^#[0-9a-fA-F]{6}$/.test(c2)) d.c2 = c2;
    const a = Number(angle);
    if (angle !== null && !isNaN(a)) d.angle = String(Math.min(360, Math.max(0, a)));
    if (shadow) d.shadow = shadow.slice(0, 120);
  } catch {}
  return d;
}

export default function CssGradientGenerator() {
  const [init] = useState(initialParams);
  const [c1, setC1] = useState(init.c1);
  const [c2, setC2] = useState(init.c2);
  const [angle, setAngle] = useState(Number(init.angle) || 135);
  const [shadow, setShadow] = useState(init.shadow);
  const [copied, setCopied] = useState(false);
  const css = `background: linear-gradient(${angle}deg, ${c1}, ${c2});`;
  const full = `${css}\nbox-shadow: ${shadow};`;

  const sharePreset = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("c1", c1);
      url.searchParams.set("c2", c2);
      url.searchParams.set("angle", String(angle));
      url.searchParams.set("shadow", shadow);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <ToolLayout title="" description="">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">Color 1 <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="w-10 h-10" /></label>
          <label className="flex items-center gap-2 text-sm">Color 2 <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="w-10 h-10" /></label>
          <label className="text-sm block">Angle: {angle}°<input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full" /></label>
          <label className="text-sm block">Box shadow<input value={shadow} onChange={(e) => setShadow(e.target.value)} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface text-xs font-mono" /></label>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(full)}>Copy CSS</Button>
            <Button variant="secondary" size="sm" onClick={sharePreset}>{copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}{copied ? "Link copied" : "Share preset"}</Button>
          </div>
          <pre className="p-3 bg-surface-hover rounded-lg font-mono text-xs whitespace-pre-wrap">{full}</pre>
        </div>
        <div className="flex items-center justify-center p-6 bg-surface-hover rounded-[18px] min-h-[240px]">
          <div style={{ background: `linear-gradient(${angle}deg, ${c1}, ${c2})`, boxShadow: shadow }} className="w-full h-48 rounded-2xl flex items-center justify-center text-white font-bold">Preview</div>
        </div>
      </div>
    </ToolLayout>
  );
}
