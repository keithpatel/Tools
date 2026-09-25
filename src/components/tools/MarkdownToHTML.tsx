"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";

export default function MarkdownToHTML() {
  const [markdown, setMarkdown] = useState("");
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!markdown.trim()) {
      setHtml("");
      setError("");
      return;
    }
    import("marked").then(({ marked }) => {
      try {
        const result = marked(markdown, { breaks: true });
        setHtml(typeof result === "string" ? result : result.toString());
        setError("");
      } catch (e) {
        setError(String(e));
        setHtml("");
      }
    });
  }, [markdown]);

  return (
    <ToolLayout
      title="Markdown to HTML"
      description="Convert Markdown to HTML in real time."
    >
      <textarea
        className="w-full h-44 sm:h-48 p-3.5 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Type Markdown here..."
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Rendered HTML</div>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[160px] sm:min-h-[200px] prose dark:prose-invert max-w-none overflow-x-auto">
            {error ? <span className="text-red-500">{error}</span> : null}
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              !error && <span className="text-gray-400">Preview will appear here</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Raw HTML</div>
          <textarea
            className="w-full h-[160px] sm:h-[200px] p-3.5 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={html}
            readOnly
          />
        </div>
      </div>
    </ToolLayout>
  );
}
