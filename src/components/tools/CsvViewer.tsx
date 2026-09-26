"use client";

import { useState, useCallback } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { DropZone } from "@/components/DropZone";
import { Button } from "@/components/ui/Button";

export default function CsvViewer() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    setError(null);
    const f = files[0];
    if (!f) return;
    try {
      const Papa = (await import("papaparse")).default;
      Papa.parse<string[]>(f, {
        skipEmptyLines: true,
        complete: (res) => {
          const data = res.data as string[][];
          if (!data.length) { setError("Empty CSV."); return; }
          setHeaders(data[0]);
          setRows(data.slice(1, 2001));
        },
        error: () => setError("Could not parse CSV."),
      });
    } catch { setError("Could not parse CSV."); }
  }, []);

  const filtered = query ? rows.filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase())) : rows;

  const downloadCsv = () => {
    const csv = [headers.join(","), ...filtered.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "filtered.csv";
    a.click();
  };

  return (
    <ToolLayout title="" description="">
      {rows.length === 0 ? (
        <DropZone onFiles={handleFiles} accept=".csv,text/csv" label="Drop a CSV file here" />
      ) : (
        <div>
          <div className="flex gap-2 mb-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rows..." className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            <Button variant="secondary" onClick={downloadCsv}>Export</Button>
            <Button variant="ghost" onClick={() => { setRows([]); setHeaders([]); }}>Reset</Button>
          </div>
          <p className="text-xs text-text-secondary mb-2">{filtered.length} of {rows.length} rows</p>
          <div className="overflow-auto max-h-[480px] border border-border-soft rounded-lg">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-hover"><tr>{headers.map((h, i) => <th key={i} className="text-left px-2 py-2 font-semibold whitespace-nowrap border-b border-border-soft">{h}</th>)}</tr></thead>
              <tbody>{filtered.slice(0, 300).map((r, i) => <tr key={i} className="border-b border-border-soft/50">{r.map((c, j) => <td key={j} className="px-2 py-1.5 whitespace-nowrap max-w-[240px] truncate">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          {error && <p className="text-sm text-error-text mt-2">{error}</p>}
        </div>
      )}
    </ToolLayout>
  );
}
