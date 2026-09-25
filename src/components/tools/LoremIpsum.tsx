"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "reprehenderit", "in", "voluptate", "velit",
  "esse", "cillum", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateParagraph(wordCount: number): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(randomWord());
  }
  let sentence = words.join(" ") + ".";
  sentence = capitalize(sentence);
  return sentence;
}

export default function LoremIpsum() {
  const [paragraphs, setParagraphs] = useState(3);
  const [wordsPerPara, setWordsPerPara] = useState(20);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const result: string[] = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(generateParagraph(wordsPerPara));
    }
    setText(result.join("\n\n"));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="Lorem Ipsum Generator"
      description="Generate placeholder text for your projects."
    >
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Paragraphs</label>
          <input
            type="number"
            min={1}
            max={20}
            value={paragraphs}
            onChange={(e) => setParagraphs(Number(e.target.value))}
            className="w-20 px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Words per paragraph</label>
          <input
            type="number"
            min={1}
            max={200}
            value={wordsPerPara}
            onChange={(e) => setWordsPerPara(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          onClick={generate}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 text-sm font-medium transition-opacity"
        >
          Generate
        </button>
      </div>
      {text && (
        <div className="relative">
          <textarea
            className="w-full h-64 p-4 border border-border rounded-lg bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-accent"
            value={text}
            readOnly
          />
          <button
            onClick={copy}
            className="absolute top-2 right-2 p-2 bg-surface-hover rounded-lg hover:bg-border transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
