"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function XmlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async (minify: boolean) => {
    setError(null); setOutput("");
    try {
      const { XMLParser, XMLBuilder, XMLValidator } = await import("fast-xml-parser");
      const v = XMLValidator.validate(input);
      if (v !== true) { setError(typeof v === "object" ? v.err.msg : "Invalid XML."); return; }
      const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
      const obj = parser.parse(input);
      const builder = new XMLBuilder({ ignoreAttributes: false, format: !minify, indentBy: "  " });
      setOutput(minify ? builder.build(obj).replace(/>\s+</g, "><").trim() : builder.build(obj));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to format XML.");
    }
  };

  return (
    <ToolLayout title="" description="">
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} spellCheck={false} placeholder="<root><item id=&quot;1&quot;>hello</item></root>" className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
      <div className="flex gap-2 mt-3">
        <Button onClick={() => run(false)}>Format</Button>
        <Button variant="secondary" onClick={() => run(true)}>Minify</Button>
        {output && <Button variant="secondary" onClick={() => navigator.clipboard.writeText(output)}>Copy</Button>}
      </div>
      {error && <p className="text-sm text-error-text mt-2">{error}</p>}
      {output && <pre className="mt-3 p-4 bg-surface-hover rounded-lg font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap">{output}</pre>}
    </ToolLayout>
  );
}
