"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

export default function HTMLToMarkdown() {
  const [html, setHtml] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [copied, setCopied] = useState(false);
  const serviceRef = useRef<any>(null);

  useEffect(() => {
    import("turndown").then((mod) => {
      const Turndown = mod.default || mod;
      serviceRef.current = new Turndown({ headingStyle: "atx", codeBlockStyle: "fenced" });
    });
  }, []);

  useEffect(() => {
    if (!html.trim() || !serviceRef.current) {
      setMarkdown("");
      return;
    }
    try {
      setMarkdown(serviceRef.current.turndown(html));
    } catch {
      setMarkdown("Error converting HTML to Markdown");
    }
  }, [html]);

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="HTML to Markdown"
      description="Convert HTML code to clean Markdown."
    >
      <textarea
        className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Paste HTML here..."
        value={html}
        onChange={(e) => setHtml(e.target.value)}
      />
      {(markdown || html) && (
        <div className="mt-4 relative">
          <div className="text-xs text-gray-500 mb-1">Markdown Output</div>
          <textarea
            className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={markdown}
            readOnly
          />
          {markdown && (
            <button
              onClick={copy}
              className="absolute top-8 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
