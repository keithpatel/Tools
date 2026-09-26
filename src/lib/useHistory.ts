"use client";

import { createStorageHook } from "./useStorage";

export interface HistoryEntry {
  slug: string;
  ts: number;
}

export const useHistory = createStorageHook<HistoryEntry[]>("multitool-history", []);

export function addHistory(slug: string) {
  try {
    const raw = localStorage.getItem("multitool-history");
    const parsed = raw ? JSON.parse(raw) : [];
    const arr: HistoryEntry[] = Array.isArray(parsed) ? parsed : [];
    const next = [{ slug, ts: Date.now() }, ...arr.filter((e) => e.slug !== slug)].slice(0, 10);
    localStorage.setItem("multitool-history", JSON.stringify(next));
  } catch {
    try {
      localStorage.setItem("multitool-history", JSON.stringify([{ slug, ts: Date.now() }]));
    } catch {}
  }
}
