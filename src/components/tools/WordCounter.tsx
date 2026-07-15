"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";

export default function WordCounter() {
  const [text, setText] = useState("");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, "").length;
  const sentences = text.trim()
    ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    : 0;
  const paragraphs = text.trim()
    ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    : text.length > 0 ? 1 : 0;

  return (
    <ToolLayout
      title="Word Counter"
      description="Count words, characters, sentences, and paragraphs in your text."
      faq={[
        { q: "Does it count in real time?", a: "Yes, all counts update live as you type or paste text." },
        { q: "What counts as a word?", a: "Any sequence of characters separated by whitespace." },
      ]}
    >
      <textarea
        className="w-full h-48 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent"
        placeholder="Paste or type your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{words}</div>
          <div className="text-xs text-gray-500">Words</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{charsWithSpaces}</div>
          <div className="text-xs text-gray-500">Chars (with spaces)</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{charsWithoutSpaces}</div>
          <div className="text-xs text-gray-500">Chars (no spaces)</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{sentences}</div>
          <div className="text-xs text-gray-500">Sentences</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center col-span-2 sm:col-span-4">
          <div className="text-2xl font-bold">{paragraphs}</div>
          <div className="text-xs text-gray-500">Paragraphs</div>
        </div>
      </div>
    </ToolLayout>
  );
}
