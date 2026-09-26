"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";

export default function SvgOptimizer() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [saved, setSaved] = useState("");

  const optimize = (svg: string) => {
    const before = svg.length;
    let out = svg
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<\?xml[^?]*\?>/g, "")
      .replace(/<!DOCTYPE[^>]*>/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/\s+(version|xmlns:xlink|xlink:href)="[^"]*"/g, (m) => (m.includes("xmlns=") ? m : m.startsWith(" version") ? "" : m))
      .trim();
    setOutput(out);
    setSaved(`${before} → ${out.length} bytes (${Math.max(0, Math.round((1 - out.length / Math.max(1, before)) * 100))}% smaller)`);
  };

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const text = await f.text();
    setInput(text);
    optimize(text);
  }, []);

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([output], { type: "image/svg+xml" }));
    a.download = "optimized.svg";
    a.click();
  };

  return (
    <ToolLayout title="" description="">
      <DropZone onFiles={handleFiles} accept=".svg,image/svg+xml" label="Drop an SVG file here (or paste below)" />
      <textarea value={input} onChange={(e) => { setInput(e.target.value); optimize(e.target.value); }} rows={6} spellCheck={false} placeholder="Paste SVG markup..." className="mt-3 w-full px-3 py-2 border border-border rounded-lg bg-surface text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
      {output && (
        <div className="mt-3">
          <p className="text-xs text-success font-semibold">{saved}</p>
          <pre className="mt-1 p-3 bg-surface-hover rounded-lg font-mono text-xs overflow-auto max-h-64 whitespace-pre-wrap">{output.slice(0, 4000)}</pre>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={download}>Download SVG</Button>
            <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(output)}>Copy</Button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
