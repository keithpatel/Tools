"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";

export default function RemoveDuplicates() {
  const [input, setInput] = useState("");

  const lines = input.split("\n");
  const unique = [...new Set(lines)];
  const duplicateCount = lines.length - unique.length;

  return (
    <ToolLayout
      title="Remove Duplicate Lines"
      description="Remove duplicate lines from your text."
    >
      <textarea
        className="w-full h-40 p-4 border border-border rounded-lg bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Paste text with duplicate lines..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {input && (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-text-secondary">
            {lines.length} line{lines.length !== 1 ? "s" : ""}, {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} removed, {unique.length} unique
          </div>
          <textarea
            className="w-full h-40 p-4 border border-border rounded-lg bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-accent"
            value={unique.join("\n")}
            readOnly
          />
        </div>
      )}
    </ToolLayout>
  );
}
