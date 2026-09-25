"use client";

import { useState, useMemo } from "react";
import { diffChars } from "diff";
import { ToolLayout } from "@/components/ToolLayout";

export default function TextDiffChecker() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  const diffResult = useMemo(() => diffChars(left, right), [left, right]);

  return (
    <ToolLayout
      title="Text Diff Checker"
      description="Compare two texts and see what has changed."
      faq={[
        { q: "How does diffing work?", a: "The tool compares character by character and highlights additions in green and removals in red." },
      ]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <textarea
          className="w-full h-44 sm:h-64 p-3.5 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Original text..."
          value={left}
          onChange={(e) => setLeft(e.target.value)}
        />
        <textarea
          className="w-full h-44 sm:h-64 p-3.5 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Modified text..."
          value={right}
          onChange={(e) => setRight(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-2">Diff Result (added / removed)</div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm whitespace-pre-wrap break-all">
          {diffResult.length === 1 && diffResult[0].added === undefined && diffResult[0].removed === undefined ? (
            <span className="text-gray-400">No differences found</span>
          ) : (
            diffResult.map((part, i) => {
              if (part.added) {
                return <span key={i} className="bg-green-300 dark:bg-green-800">{part.value}</span>;
              }
              if (part.removed) {
                return <span key={i} className="bg-red-300 dark:bg-red-800">{part.value}</span>;
              }
              return <span key={i}>{part.value}</span>;
            })
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
