"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";

export default function FindReplace() {
  const [input, setInput] = useState("");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [regex, setRegex] = useState(false);

  let result = input;
  let count = 0;

  if (find) {
    try {
      if (regex) {
        const re = new RegExp(find, "g");
        const matches = input.match(re);
        count = matches ? matches.length : 0;
        result = input.replace(re, replace);
      } else {
        const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(escaped, "g");
        const matches = input.match(re);
        count = matches ? matches.length : 0;
        result = input.replace(re, replace);
      }
    } catch {
      result = "Invalid regex pattern";
      count = 0;
    }
  }

  return (
    <ToolLayout
      title="Find and Replace"
      description="Find and replace text with optional regex support."
    >
      <textarea
        className="w-full h-32 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Input text..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex flex-wrap gap-4 mt-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Find</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Text to find..."
            value={find}
            onChange={(e) => setFind(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Replace with</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Replacement text..."
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input
            type="checkbox"
            checked={regex}
            onChange={(e) => setRegex(e.target.checked)}
            className="rounded"
          />
          Regex mode
        </label>
      </div>
      {find && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Result ({count} replacement{count !== 1 ? "s" : ""})</div>
          <div className="whitespace-pre-wrap break-all">{result}</div>
        </div>
      )}
    </ToolLayout>
  );
}
