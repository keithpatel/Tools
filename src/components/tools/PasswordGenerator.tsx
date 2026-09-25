"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, RefreshCw, Share2 } from "lucide-react";
import { ToolLayout } from "@/components/ToolLayout";

function generatePassword(length: number, upper: boolean, lower: boolean, numbers: boolean, symbols: boolean): string {
  const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerChars = "abcdefghijklmnopqrstuvwxyz";
  const numberChars = "0123456789";
  const symbolChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  let pool = "";
  if (upper) pool += upperChars;
  if (lower) pool += lowerChars;
  if (numbers) pool += numberChars;
  if (symbols) pool += symbolChars;
  if (!pool) return "";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += pool[Math.floor(Math.random() * pool.length)];
  }
  return password;
}

function getStrength(pw: string): { label: string; color: string; width: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (score <= 3) return { label: "Medium", color: "bg-yellow-500", width: "w-2/4" };
  if (score <= 4) return { label: "Strong", color: "bg-green-500", width: "w-3/4" };
  return { label: "Very Strong", color: "bg-emerald-500", width: "w-full" };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize from URL parameters if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qLen = params.get("length");
    if (qLen && !isNaN(parseInt(qLen))) {
      setLength(Math.min(64, Math.max(4, parseInt(qLen))));
    }
    if (params.has("upper")) setUpper(params.get("upper") === "true");
    if (params.has("lower")) setLower(params.get("lower") === "true");
    if (params.has("numbers")) setNumbers(params.get("numbers") === "true");
    if (params.has("symbols")) setSymbols(params.get("symbols") === "true");
  }, []);

  const generate = useCallback(() => {
    setPassword(generatePassword(length, upper, lower, numbers, symbols));
  }, [length, upper, lower, numbers, symbols]);

  useEffect(() => { generate(); }, [generate]);

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("length", length.toString());
    url.searchParams.set("upper", upper.toString());
    url.searchParams.set("lower", lower.toString());
    url.searchParams.set("numbers", numbers.toString());
    url.searchParams.set("symbols", symbols.toString());
    await navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const strength = password ? getStrength(password) : { label: "", color: "", width: "" };

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate secure random passwords with customisable options."
      faq={[
        { q: "Where does the password generation happen?", a: "Entirely in your browser. No data is sent to any server." },
        { q: "What makes a strong password?", a: "A strong password is at least 12 characters long and includes uppercase letters, lowercase letters, numbers, and symbols." },
      ]}
    >
      <div className="space-y-6">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between gap-4">
          <div className="font-mono text-xl sm:text-2xl break-all select-all">{password || "—"}</div>
          <button
            onClick={copy}
            className="shrink-0 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {password && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
            </div>
            <span className="text-sm font-medium whitespace-nowrap">{strength.label}</span>
          </div>
        )}

        <div>
          <label className="flex items-center justify-between text-sm mb-2">
            <span>Length: <strong>{length}</strong></span>
          </label>
          <input
            type="range"
            min={4}
            max={128}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>4</span><span>128</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Uppercase (A-Z)", value: upper, set: setUpper },
            { label: "Lowercase (a-z)", value: lower, set: setLower },
            { label: "Numbers (0-9)", value: numbers, set: setNumbers },
            { label: "Symbols (!@#)", value: symbols, set: setSymbols },
          ].map(({ label, value, set }) => (
            <label
              key={label}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                value
                  ? "border-accent bg-accent/10"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={value}
                onChange={() => set(!value)}
                className="accent-accent"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={generate}
            className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
          <button
            onClick={copyShareLink}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors font-medium text-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? "Link Copied!" : "Share Preset"}
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
