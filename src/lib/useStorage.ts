"use client";

import { useState, useEffect, useCallback } from "react";

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function createStorageHook<T>(key: string, fallback: T) {
  return function () {
    const [val, setVal] = useState<T>(fallback);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      setVal(get(key, fallback));
    }, []);

    const update = useCallback((next: T | ((prev: T) => T)) => {
      setVal((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        set(key, resolved);
        return resolved;
      });
    }, []);

    return { value: mounted ? val : fallback, update, mounted } as const;
  };
}
