"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Copy, Check } from "lucide-react";
import { html_beautify, css_beautify, js_beautify } from "js-beautify";

type Language = "html" | "css" | "js";

function minifyCode(code: string, lang: Language): string {
  if (lang === "html") {
    return code
      .replace(/\s+/g, " ")
      .replace(/>\s+</g, "><")
      .replace(/\s+\//g, "/")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();
  }
  if (lang === "css") {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s*\{\s*/g, "{")
      .replace(/\s*\}\s*/g, "}")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*;\s*/g, ";")
      .replace(/\s*,\s*/g, ",")
      .replace(/\s+/g, " ")
      .trim();
  }
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*=\s*/g, "=")
    .replace(/\s*\{\s*/g, "{")
    .replace(/\s*\}\s*/g, "}")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CodeMinifier() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState<Language>("js");
  const [copied, setCopied] = useState(false);

  const beautify = () => {
    const opts = { indent_size: 2, wrap_line_length: 80 };
    try {
      let result = input;
      if (language === "html") result = html_beautify(input, opts);
      else if (language === "css") result = css_beautify(input, opts);
      else result = js_beautify(input, opts);
      setOutput(result);
    } catch {
      setOutput("");
    }
  };

  const minify = () => {
    try {
      setOutput(minifyCode(input, language));
    } catch {
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
      title="Code Minifier"
      description="Minify or beautify HTML, CSS, and JavaScript."
      faq={[
        { q: "What is minification?", a: "Minification removes unnecessary whitespace and comments to reduce file size." },
        { q: "Is beautification reversible?", a: "Beautification improves readability but does not restore original formatting if comments/whitespace were removed." },
      ]}
    >
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <select
          className="flex-1 sm:flex-none px-3.5 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px] sm:min-h-0"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="js">JavaScript</option>
        </select>
        <button onClick={minify} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center">Minify</button>
        <button onClick={beautify} className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 flex items-center justify-center">Beautify</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Input ({input.length} chars)</div>
          <textarea
            className="w-full h-48 sm:h-64 p-3.5 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono text-base sm:text-sm"
            placeholder="Paste your code here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">
            Output ({output.length} chars)
            {input.length > 0 && output.length > 0 && (
              <span className="ml-2">
                ({((1 - output.length / input.length) * 100).toFixed(1)}% reduction)
              </span>
            )}
          </div>
          <div className="relative h-48 sm:h-64">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={copy}
                aria-label="Copy output"
                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="w-full h-full p-3.5 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto overflow-y-auto text-xs sm:text-sm font-mono whitespace-pre-wrap break-all">{output}</pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
