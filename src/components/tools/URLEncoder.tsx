"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Copy, Check } from "lucide-react";

export default function URLEncoder() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const encode = () => {
    setError("");
    try {
      setOutput(encodeURIComponent(input));
    } catch {
      setError("Failed to encode input");
    }
  };

  const decode = () => {
    setError("");
    try {
      setOutput(decodeURIComponent(input));
    } catch {
      setError("Invalid URL-encoded string");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="URL Encode / Decode"
      description="Encode or decode URL strings."
      faq={[
        { q: "What characters are encoded?", a: "Special characters like ?, &, =, space, and non-ASCII characters are percent-encoded." },
        { q: "Is this the same as encodeURI?", a: "No, encodeURIComponent encodes more characters including /, ?, &, and #." },
      ]}
    >
      <textarea
        className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
        placeholder="Enter text to URL encode or decode..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={encode} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Encode</button>
        <button onClick={decode} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Decode</button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {output && (
        <div className="mt-4 relative">
          <div className="absolute top-2 right-2">
            <button onClick={copy} className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap break-all">{output}</pre>
        </div>
      )}
    </ToolLayout>
  );
}
