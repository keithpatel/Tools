"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function YamlConverter() {
  const [mode, setMode] = useState<"yaml2json" | "json2yaml">("yaml2json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    setError(null); setOutput("");
    try {
      const yaml = (await import("js-yaml")).default;
      if (mode === "yaml2json") {
        const obj = yaml.load(input) as unknown;
        setOutput(JSON.stringify(obj, null, 2));
      } else {
        const obj = JSON.parse(input);
        setOutput(yaml.dump(obj));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Conversion failed. Check your syntax.");
    }
  };

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2 mb-3">
        <Button variant={mode === "yaml2json" ? "primary" : "secondary"} onClick={() => setMode("yaml2json")}>YAML → JSON</Button>
        <Button variant={mode === "json2yaml" ? "primary" : "secondary"} onClick={() => setMode("json2yaml")}>JSON → YAML</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={12} spellCheck={false} placeholder={mode === "yaml2json" ? "name: app\nport: 3000" : '{"name":"app","port":3000}'} className="px-3 py-2 border border-border rounded-lg bg-surface text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
        <pre className="p-3 bg-surface-hover rounded-lg font-mono text-xs overflow-auto min-h-[200px] whitespace-pre-wrap">{output || "Output appears here"}</pre>
      </div>
      {error && <p className="text-sm text-error-text mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <Button onClick={convert}>Convert</Button>
        {output && <Button variant="secondary" onClick={() => navigator.clipboard.writeText(output)}>Copy output</Button>}
      </div>
    </ToolLayout>
  );
}
