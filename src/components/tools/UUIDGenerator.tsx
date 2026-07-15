"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Copy, Check, RefreshCw } from "lucide-react";

export default function UUIDGenerator() {
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const arr: string[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(crypto.randomUUID());
    }
    setUuids(arr);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(uuids.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate random UUIDs (v4)."
      faq={[
        { q: "What is a UUID?", a: "A UUID (Universally Unique Identifier) is a 128-bit label used for unique identification." },
        { q: "Are these truly random?", a: "crypto.randomUUID() uses cryptographically strong randomness." },
      ]}
    >
      <div className="flex gap-3 items-center mb-4">
        <label className="text-sm text-gray-500">Count:</label>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
          className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button onClick={generate} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">
          <RefreshCw className="w-4 h-4" /> Generate
        </button>
      </div>
      {uuids.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute top-2 right-2">
              <button onClick={copyAll} className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-1">
              {uuids.map((uuid, i) => (
                <div key={i} className="font-mono text-sm">{uuid}</div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Generated {uuids.length} UUID{uuids.length > 1 ? "s" : ""}</p>
        </>
      )}
    </ToolLayout>
  );
}
