"use client";

import { useState } from "react";
import { Copy, Check, Dice1 } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

export default function RandomNumberGenerator() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("10");
  const [allowDecimals, setAllowDecimals] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    const countVal = Math.min(Math.max(parseInt(count) || 1, 1), 100);
    if (isNaN(minVal) || isNaN(maxVal)) return;
    const results: number[] = [];
    for (let i = 0; i < countVal; i++) {
      const r = minVal + Math.random() * (maxVal - minVal);
      results.push(allowDecimals ? r : Math.floor(r));
    }
    setNumbers(results);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(numbers.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actualMin = numbers.length ? Math.min(...numbers) : null;
  const actualMax = numbers.length ? Math.max(...numbers) : null;

  return (
    <ToolLayout
      title="Random Number Generator"
      description="Generate random numbers within a range."
      faq={[
        { q: "Are the numbers truly random?", a: "They are generated using JavaScript's Math.random(), which provides pseudo-random numbers suitable for most non-cryptographic purposes." },
        { q: "Can I generate decimal numbers?", a: "Yes, toggle the 'Allow Decimals' option to include fractional values." },
      ]}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Min</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Max</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Count (1-100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allowDecimals}
            onChange={() => setAllowDecimals(!allowDecimals)}
            className="accent-accent"
          />
          <span className="text-sm">Allow Decimals</span>
        </label>

        <button
          onClick={generate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
        >
          <Dice1 className="w-4 h-4" /> Generate
        </button>

        {numbers.length > 0 && (
          <div>
            {actualMin !== null && (
              <div className="flex gap-4 mb-3 text-sm text-gray-500">
                <span>Min: <strong className="text-gray-900 dark:text-gray-100">{allowDecimals ? actualMin : actualMin}</strong></span>
                <span>Max: <strong className="text-gray-900 dark:text-gray-100">{allowDecimals ? actualMax : actualMax}</strong></span>
                <span>Count: <strong className="text-gray-900 dark:text-gray-100">{numbers.length}</strong></span>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Generated Numbers</span>
              <button
                onClick={copyAll}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy All
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-3 font-mono text-sm space-y-1">
              {numbers.map((n, i) => (
                <div key={i} className="px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded">
                  {allowDecimals ? n.toFixed(4) : n}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
