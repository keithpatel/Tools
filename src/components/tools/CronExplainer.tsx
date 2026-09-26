"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { ResultPanel } from "@/components/ResultPanel";
import { Button } from "@/components/ui/Button";

const PRESETS = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Hourly", expr: "0 * * * *" },
  { label: "Daily 9am", expr: "0 9 * * *" },
  { label: "Weekdays 9am", expr: "0 9 * * 1-5" },
  { label: "Monthly", expr: "0 0 1 * *" },
];

export default function CronExplainer() {
  const [expr, setExpr] = useState("0 9 * * 1-5");
  const [human, setHuman] = useState("");
  const [runs, setRuns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const explain = async () => {
    setError(null); setHuman(""); setRuns([]); setLoading(true);
    try {
      const cronstrue = (await import("cronstrue")).default;
      const { CronExpressionParser } = await import("cron-parser");
      const text = cronstrue.toString(expr.trim(), { throwExceptionOnParseError: true });
      setHuman(text);
      const it = CronExpressionParser.parse(expr.trim());
      const next: string[] = [];
      for (let i = 0; i < 5; i++) next.push(it.next().toDate().toString());
      setRuns(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Invalid cron expression. Use 5-part format: minute hour day month weekday.");
    } finally { setLoading(false); }
  };

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2">
        <input value={expr} onChange={(e) => setExpr(e.target.value)} onKeyDown={(e) => e.key === "Enter" && explain()} placeholder="0 9 * * 1-5" spellCheck={false} className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
        <Button onClick={explain} loading={loading}>Explain</Button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {PRESETS.map((p) => (
          <button key={p.expr} onClick={() => setExpr(p.expr)} className="text-xs px-2.5 py-1.5 rounded-full bg-surface-hover border border-border-soft hover:border-accent/40 min-h-[32px]">{p.label}</button>
        ))}
      </div>
      <ResultPanel loading={loading} loadingLabel="Parsing cron..." error={error} sourceToolSlug="cron-explainer" outputType="text">
        {(human || runs.length > 0) && (
          <div>
            {human && <p className="font-semibold text-[15px]">{human}</p>}
            {runs.length > 0 && (
              <ul className="mt-3 space-y-1">
                {runs.map((r, i) => <li key={i} className="font-mono text-xs p-2 bg-surface-hover rounded">{r}</li>)}
              </ul>
            )}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
