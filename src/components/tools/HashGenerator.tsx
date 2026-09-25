"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Copy, Check } from "lucide-react";
import CryptoJS from "crypto-js";

type Algorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-512";

const algorithms: Algorithm[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"];

const hashFn: Record<Algorithm, (text: string) => string> = {
  "MD5": (t) => CryptoJS.MD5(t).toString(),
  "SHA-1": (t) => CryptoJS.SHA1(t).toString(),
  "SHA-256": (t) => CryptoJS.SHA256(t).toString(),
  "SHA-512": (t) => CryptoJS.SHA512(t).toString(),
};

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("MD5");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setOutput(hashFn[algorithm](input));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate MD5, SHA-1, SHA-256, and SHA-512 hashes."
      faq={[
        { q: "Are hashes reversible?", a: "No, hashes are one-way functions. You cannot retrieve the original input from a hash." },
        { q: "What is SHA-256 used for?", a: "SHA-256 is commonly used in SSL/TLS certificates, blockchain, and password hashing." },
      ]}
    >
      <textarea
        className="w-full h-40 p-4 border border-border rounded-lg bg-surface resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
        placeholder="Enter text to hash..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex gap-2 mt-3 items-center">
        <select
          className="px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
        >
          {algorithms.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button onClick={generate} className="px-4 py-2 bg-surface-hover rounded-lg hover:bg-border text-sm font-medium transition-colors">Generate</button>
      </div>
      {output && (
        <div className="mt-4 relative">
          <div className="absolute top-2 right-2">
            <button onClick={copy} className="p-1.5 bg-surface-hover rounded hover:bg-border transition-colors">
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <pre className="p-4 bg-surface-hover checkerboard rounded-lg overflow-x-auto text-sm font-mono break-all">{output}</pre>
        </div>
      )}
    </ToolLayout>
  );
}
