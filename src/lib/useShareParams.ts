"use client";

import { useState } from "react";

function readParams<T extends Record<string, string>>(defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try {
    const sp = new URLSearchParams(window.location.search);
    const next = { ...defaults };
    (Object.keys(defaults) as (keyof T)[]).forEach((k) => {
      const v = sp.get(String(k));
      if (v !== null) (next as Record<string, string>)[String(k)] = v;
    });
    return next;
  } catch {
    return defaults;
  }
}

/**
 * Shareable preset links via URL params (client-only; compatible with static export).
 * Usage:
 *   const { params, update, shareUrl, copyShareLink, copied } = useShareParams({ angle: "135" });
 */
export function useShareParams<T extends Record<string, string>>(defaults: T) {
  // Lazy init from URL — no effect needed, SSR-safe (window guard above).
  const [params, setParams] = useState<T>(() => readParams(defaults));
  const [copied, setCopied] = useState(false);

  const update = (patch: Partial<T>) => setParams((p) => ({ ...p, ...patch }));

  const shareUrl = () => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    return url.toString();
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  };

  return { params, update, setParams, shareUrl, copyShareLink, copied, ready: true };
}
