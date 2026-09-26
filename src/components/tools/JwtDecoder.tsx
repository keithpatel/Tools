"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";

function b64UrlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);

  const decode = () => {
    setError(null);
    setHeader("");
    setPayload("");
    setExpiry(null);
    const t = token.trim();
    if (!t) { setError("Paste a JWT token first."); return; }
    const parts = t.split(".");
    if (parts.length !== 3) { setError("Invalid JWT — expected 3 dot-separated parts."); return; }
    try {
      const h = JSON.parse(b64UrlDecode(parts[0]));
      const p = JSON.parse(b64UrlDecode(parts[1]));
      setHeader(JSON.stringify(h, null, 2));
      setPayload(JSON.stringify(p, null, 2));
      if (typeof p.exp === "number") {
        const d = new Date(p.exp * 1000);
        const expired = d.getTime() < Date.now();
        setExpiry(`${expired ? "Expired" : "Valid"} — exp: ${d.toUTCString()}`);
      }
    } catch {
      setError("Could not decode — malformed base64 or JSON.");
    }
  };

  const copy = (text: string) => async () => { await navigator.clipboard.writeText(text); };
  const reset = () => { setToken(""); setHeader(""); setPayload(""); setError(null); setExpiry(null); };

  return (
    <ToolLayout title="" description="">
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste JWT here (eyJhbGciOi...)"
        rows={4}
        spellCheck={false}
        className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="flex gap-2 mt-3">
        <Button onClick={decode}>Decode JWT</Button>
        {(header || token) && <Button variant="secondary" onClick={reset}>Clear</Button>}
      </div>
      <ResultPanel error={error} sourceToolSlug="jwt-decoder" outputType="text">
        {(header || payload) && (
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold mb-1">Header</p>
              <pre className="p-3 bg-surface-hover rounded-lg font-mono text-xs overflow-auto max-h-64">{header}</pre>
              <Button variant="secondary" size="sm" className="mt-2" onClick={copy(header)}>Copy header</Button>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">Payload {expiry && <span className="ml-1 text-[11px] font-normal text-text-secondary">({expiry})</span>}</p>
              <pre className="p-3 bg-surface-hover rounded-lg font-mono text-xs overflow-auto max-h-64">{payload}</pre>
              <Button variant="secondary" size="sm" className="mt-2" onClick={copy(payload)}>Copy payload</Button>
            </div>
          </div>
        )}
      </ResultPanel>
      <p className="text-[11px] text-text-secondary mt-3">Signature is not verified — decoding only. Never paste production secrets into untrusted sites; here everything stays in your browser.</p>
    </ToolLayout>
  );
}
