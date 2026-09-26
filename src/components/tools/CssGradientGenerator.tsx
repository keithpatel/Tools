"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function CssGradientGenerator() {
  const [c1, setC1] = useState("#6366f1");
  const [c2, setC2] = useState("#ec4899");
  const [angle, setAngle] = useState(135);
  const [shadow, setShadow] = useState("0 10px 30px rgba(0,0,0,0.25)");
  const css = `background: linear-gradient(${angle}deg, ${c1}, ${c2});`;
  const full = `${css}\nbox-shadow: ${shadow};`;

  return (
    <ToolLayout title="" description="">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">Color 1 <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="w-10 h-10" /></label>
          <label className="flex items-center gap-2 text-sm">Color 2 <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="w-10 h-10" /></label>
          <label className="text-sm block">Angle: {angle}°<input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full" /></label>
          <label className="text-sm block">Box shadow<input value={shadow} onChange={(e) => setShadow(e.target.value)} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface text-xs font-mono" /></label>
          <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(full)}>Copy CSS</Button>
          <pre className="p-3 bg-surface-hover rounded-lg font-mono text-xs whitespace-pre-wrap">{full}</pre>
        </div>
        <div className="flex items-center justify-center p-6 bg-surface-hover rounded-[18px] min-h-[240px]">
          <div style={{ background: `linear-gradient(${angle}deg, ${c1}, ${c2})`, boxShadow: shadow }} className="w-full h-48 rounded-2xl flex items-center justify-center text-white font-bold">Preview</div>
        </div>
      </div>
    </ToolLayout>
  );
}
