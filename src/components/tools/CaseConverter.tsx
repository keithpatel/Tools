"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ResultPanel } from "@/components/ResultPanel";
import { useWorkflowStore } from "@/lib/useWorkflowStore";

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [converted, setConverted] = useState("");
  const [activeCase, setActiveCase] = useState("");
  const { sendOutput } = useWorkflowStore();

  const applyCase = (label: string, fn: (s: string) => string) => {
    if (!text) return;
    const result = fn(text);
    setConverted(result);
    setActiveCase(label);
    sendOutput({ type: "text", data: result, filename: "converted.txt", sourceToolSlug: "case-converter", createdAt: Date.now() });
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(converted);
  };

  const reset = () => { setConverted(""); setActiveCase(""); };

  return (
    <ToolLayout title="" description="">
      <textarea
        className="w-full h-40 p-4 border border-border rounded-lg bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Type or paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => applyCase("UPPER CASE", (s) => s.toUpperCase())} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">UPPER</button>
        <button onClick={() => applyCase("lower case", (s) => s.toLowerCase())} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">lower</button>
        <button onClick={() => applyCase("Title Case", (s) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">Title Case</button>
        <button onClick={() => applyCase("Sentence case", (s) => s.replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()))} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">Sentence case</button>
        <button onClick={() => applyCase("camelCase", (s) => s.replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, (c) => c.toLowerCase()))} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">camelCase</button>
      </div>

      <ResultPanel
        onCopy={converted ? copyResult : undefined}
        copyLabel="Copy Result"
        onReset={converted ? reset : undefined}
        resetLabel="Clear"
        sourceToolSlug="case-converter"
        outputType="text"
      >
        {converted && (
          <div className="text-sm space-y-2">
            <p className="text-xs text-text-secondary/70 font-medium">{activeCase}</p>
            <div className="whitespace-pre-wrap break-all bg-surface p-3 rounded-lg border border-border-soft font-mono text-sm">
              {converted}
            </div>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
