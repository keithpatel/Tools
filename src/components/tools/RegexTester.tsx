"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/ToolLayout";

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gm");
  const [testStr, setTestStr] = useState("");

  const result = useMemo(() => {
    if (!pattern) return { matches: [], count: 0 };
    try {
      const re = new RegExp(pattern, flags);
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(testStr)) !== null) {
        matches.push(m[0]);
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      return { matches, count: matches.length };
    } catch {
      return { matches: [], count: 0, error: "Invalid regex" };
    }
  }, [pattern, flags, testStr]);

  const highlighted = useMemo(() => {
    if (!pattern || !testStr) return testStr;
    try {
      const re = new RegExp(`(${pattern})`, flags);
      return testStr.split(re).map((part, i) => {
        if (re.test(part)) {
          return <mark key={i} className="bg-yellow-300 dark:bg-yellow-700 rounded px-0.5">{part}</mark>;
        }
        return part;
      });
    } catch {
      return testStr;
    }
  }, [pattern, flags, testStr]);

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test regular expressions in real-time."
      faq={[
        { q: "What flags are available?", a: "g (global), i (case-insensitive), m (multiline). Combine them like 'gmi'." },
        { q: "Which regex engine is used?", a: "This tool uses JavaScript's built-in RegExp engine." },
      ]}
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Regex Pattern</label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="/pattern/"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
            <input
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="gmi"
              value={flags}
              onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Test String</label>
          <textarea
            className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
            placeholder="Enter test string..."
            value={testStr}
            onChange={(e) => setTestStr(e.target.value)}
          />
        </div>
        {testStr && pattern && (
          <div>
            <div className="text-xs text-gray-500 mb-1">
              {result.count} match{result.count !== 1 ? "es" : ""}
              {result.count > 0 && (
                <span className="ml-2 font-mono">
                  {result.matches.slice(0, 20).map((m, i) => (
                    <span key={i} className="inline-block bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 mr-1 mb-1 text-xs">&quot;{m}&quot;</span>
                  ))}
                  {result.matches.length > 20 && <span className="text-gray-400">+{result.matches.length - 20} more</span>}
                </span>
              )}
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap break-all font-mono leading-relaxed">
              {highlighted || <span className="text-gray-400">No matches</span>}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
