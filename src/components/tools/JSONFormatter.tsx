"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Copy, Check } from "lucide-react";

export default function JSONFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const format = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
    } catch {
      setError("Invalid JSON");
      setOutput("");
    }
  };

  const minify = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch {
      setError("Invalid JSON");
      setOutput("");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="JSON Formatter"
      description="Format, validate, and minify JSON data."
      faq={[
        { q: "Is my JSON data sent to a server?", a: "No, all processing happens locally in your browser." },
        { q: "What counts as valid JSON?", a: "JSON must follow the ECMA-404 specification. Trailing commas are not allowed." },
      ]}
    >
      <textarea
        className="w-full h-48 p-4 border border-border rounded-lg bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
        placeholder='Enter JSON here...'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={format} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">Format</button>
        <button onClick={minify} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">Minify</button>
      </div>
      {error && <p className="text-error-text text-sm mt-2">{error}</p>}
      {output && (
        <div className="mt-4 relative">
          <div className="absolute top-2 right-2">
            <button onClick={copy} className="p-1.5 bg-surface-hover rounded hover:bg-border transition-colors">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 bg-surface-hover checkerboard rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </ToolLayout>
  );
}
