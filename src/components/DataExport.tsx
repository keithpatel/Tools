"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";

/** Export/import Favorites + History as JSON (local-first, no server). */
export function DataExport() {
  const [msg, setMsg] = useState("");

  const exportAll = () => {
    try {
      const data = {
        favorites: localStorage.getItem("multitool-favorites"),
        history: localStorage.getItem("multitool-history"),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "multitool-settings.json";
      a.click();
      setMsg("Exported ✓");
    } catch {
      setMsg("Export failed");
    }
    setTimeout(() => setMsg(""), 2000);
  };

  const importAll = async (f: File) => {
    try {
      const raw = await f.text();
      const data = JSON.parse(raw) as { favorites?: string; history?: string };
      if (data.favorites) localStorage.setItem("multitool-favorites", data.favorites);
      if (data.history) localStorage.setItem("multitool-history", data.history);
      setMsg("Imported — reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setMsg("Invalid file");
      setTimeout(() => setMsg(""), 2000);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <button onClick={exportAll} className="inline-flex items-center gap-1 px-3 py-2 min-h-[36px] rounded-full text-text-secondary hover:text-accent hover:bg-surface-hover transition-all font-medium cursor-pointer" title="Export favorites + history">
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      <label className="inline-flex items-center gap-1 px-3 py-2 min-h-[36px] rounded-full text-text-secondary hover:text-accent hover:bg-surface-hover transition-all font-medium cursor-pointer" title="Import favorites + history">
        <Upload className="w-3.5 h-3.5" /> Import
        <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importAll(f); e.target.value = ""; }} />
      </label>
      {msg && <span className="text-[11px] text-text-secondary">{msg}</span>}
    </span>
  );
}
