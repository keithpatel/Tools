"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

export default function LineSorter() {
  const [input, setInput] = useState("");

  const lines = input.split("\n").filter((l) => l !== undefined);

  const sortAsc = () =>
    setInput([...lines].sort((a, b) => a.localeCompare(b)).join("\n"));
  const sortDesc = () =>
    setInput([...lines].sort((a, b) => b.localeCompare(a)).join("\n"));
  const shuffle = () =>
    setInput(
      [...lines]
        .map((l) => ({ line: l, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ line }) => line)
        .join("\n")
    );

  return (
    <ToolLayout
      title="Line Sorter"
      description="Sort lines alphabetically or randomly shuffle them."
    >
      <textarea
        className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Paste lines to sort..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={sortAsc} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
          <ArrowUpDown className="w-4 h-4" /> A-Z
        </button>
        <button onClick={sortDesc} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
          <ArrowUpDown className="w-4 h-4" /> Z-A
        </button>
        <button onClick={shuffle} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Shuffle</button>
      </div>
      {input && (
        <div className="mt-2 text-xs text-gray-500">{lines.length} line{lines.length !== 1 ? "s" : ""}</div>
      )}
    </ToolLayout>
  );
}
