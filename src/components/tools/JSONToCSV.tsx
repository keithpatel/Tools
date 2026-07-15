"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Copy, Check } from "lucide-react";
import Papa from "papaparse";

export default function JSONToCSV() {
  const [mode, setMode] = useState<"json-to-csv" | "csv-to-json">("json-to-csv");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const convert = () => {
    setError("");
    setOutput("");
    try {
      if (mode === "json-to-csv") {
        const parsed = JSON.parse(input);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        setOutput(Papa.unparse(arr));
      } else {
        const result = Papa.parse(input, { header: true });
        if (result.errors.length) {
          setError(result.errors[0].message);
          return;
        }
        setOutput(JSON.stringify(result.data, null, 2));
      }
    } catch {
      setError(mode === "json-to-csv" ? "Invalid JSON input" : "Invalid CSV input");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="JSON to CSV"
      description="Convert between JSON and CSV formats."
      faq={[
        { q: "Does JSON need to be an array?", a: "For JSON to CSV, the input should be an array of objects. A single object is also accepted." },
        { q: "Are commas in values handled?", a: "Yes, Papa Parse handles quoted fields correctly." },
      ]}
    >
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("json-to-csv")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "json-to-csv" ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700"}`}>JSON to CSV</button>
        <button onClick={() => setMode("csv-to-json")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "csv-to-json" ? "bg-accent text-white" : "bg-gray-200 dark:bg-gray-700"}`}>CSV to JSON</button>
      </div>
      <textarea
        className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
        placeholder={mode === "json-to-csv" ? '[{"key": "value"}]' : "key,value\nhello,world"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={convert} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Convert</button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {output && (
        <div className="mt-4 relative">
          <div className="absolute top-2 right-2">
            <button onClick={copy} className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </ToolLayout>
  );
}
