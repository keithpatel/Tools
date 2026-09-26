"use client";

import { useState, useEffect } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function TimestampConverter() {
  const [now, setNow] = useState(() => Date.now());
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const convert = () => {
    setError(null);
    const v = input.trim();
    if (!v) { setError("Enter a timestamp or date string."); setOutput(""); return; }
    // Numeric timestamp?
    if (/^-?\d+(\.\d+)?$/.test(v)) {
      let n = Number(v);
      // Heuristic: seconds (10 digits) vs ms (13 digits)
      if (v.replace(/[-.]/g, "").length <= 11) n = n * 1000;
      const d = new Date(n);
      if (isNaN(d.getTime())) { setError("Invalid timestamp."); return; }
      setOutput(d.toString() + "\n" + d.toISOString() + "\nUTC: " + d.toUTCString());
      return;
    }
    const d = new Date(v);
    if (isNaN(d.getTime())) { setError("Could not parse date. Try ISO like 2026-01-01T00:00:00Z or a number."); setOutput(""); return; }
    setOutput(`Seconds: ${Math.floor(d.getTime() / 1000)}\nMilliseconds: ${d.getTime()}\nISO: ${d.toISOString()}`);
  };

  return (
    <ToolLayout title="" description="">
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">Now (s)</p><p className="font-mono text-sm">{Math.floor(now / 1000)}</p></div>
        <div className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">Now (ms)</p><p className="font-mono text-sm">{now}</p></div>
        <div className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">ISO</p><p className="font-mono text-xs truncate">{new Date(now).toISOString()}</p></div>
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && convert()} placeholder="1717833600 or 2026-05-01T12:00:00Z" className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
        <Button onClick={convert}>Convert</Button>
      </div>
      {error && <p className="text-sm text-error-text mt-2">{error}</p>}
      {output && (
        <div className="mt-3">
          <pre className="p-4 bg-surface-hover rounded-lg font-mono text-sm whitespace-pre-wrap">{output}</pre>
          <Button variant="secondary" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(output)}>Copy result</Button>
        </div>
      )}
    </ToolLayout>
  );
}
