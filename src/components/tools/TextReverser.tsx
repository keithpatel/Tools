"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";

export default function TextReverser() {
  const [input, setInput] = useState("");

  const reverseText = () => setInput(input.split("").reverse().join(""));
  const reverseWords = () => setInput(input.split(/\s+/).reverse().join(" "));
  const reverseLines = () => setInput(input.split("\n").reverse().join("\n"));

  return (
    <ToolLayout
      title="Text Reverser"
      description="Reverse text, words, or lines in your content."
      faq={[
        { q: "What is the difference between the modes?", a: "Reverse Text flips every character. Reverse Words reverses the word order. Reverse Lines flips the line order." },
      ]}
    >
      <textarea
        className="w-full h-40 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Type or paste your text..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={reverseText} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Reverse Text</button>
        <button onClick={reverseWords} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Reverse Words</button>
        <button onClick={reverseLines} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors">Reverse Lines</button>
      </div>
    </ToolLayout>
  );
}
