"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

export default function SlugGenerator() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const copy = async () => {
    await navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="Slug Generator"
      description="Convert text into a URL-friendly slug."
      faq={[
        { q: "What makes a good slug?", a: "A slug should be short, lowercase, use hyphens instead of spaces, and exclude special characters." },
      ]}
    >
      <input
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Type your title or text here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {input && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between gap-4">
          <div className="font-mono text-sm break-all">{slug}</div>
          <button
            onClick={copy}
            className="shrink-0 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
