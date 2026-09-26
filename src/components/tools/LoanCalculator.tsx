"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function LoanCalculator() {
  const [tab, setTab] = useState<"emi" | "tip" | "pct">("emi");
  const [p, setP] = useState(100000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(20);
  const [bill, setBill] = useState(100);
  const [tip, setTip] = useState(15);
  const [val, setVal] = useState("");
  const [pct, setPct] = useState("");

  const r = rate / 1200, n = years * 12;
  const emi = r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
  const total = emi * n;

  return (
    <ToolLayout title="" description="">
      <div className="flex gap-2 mb-4">
        {(["emi", "tip", "pct"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "primary" : "secondary"} onClick={() => setTab(t)}>{t === "emi" ? "Loan / EMI" : t === "tip" ? "Tip" : "%"}</Button>
        ))}
      </div>
      {tab === "emi" && (
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm">Principal<input type="number" value={p} onChange={(e) => setP(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
          <label className="text-sm">Rate %<input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
          <label className="text-sm">Years<input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
          <div className="sm:col-span-3 grid grid-cols-3 gap-2 mt-1">
            <div className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">EMI</p><p className="font-bold">{emi.toFixed(2)}</p></div>
            <div className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">Total</p><p className="font-bold">{total.toFixed(2)}</p></div>
            <div className="p-3 bg-surface-hover rounded-lg"><p className="text-[11px] text-text-secondary">Interest</p><p className="font-bold">{(total - p).toFixed(2)}</p></div>
          </div>
        </div>
      )}
      {tab === "tip" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Bill<input type="number" value={bill} onChange={(e) => setBill(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
          <label className="text-sm">Tip %<input type="number" value={tip} onChange={(e) => setTip(Number(e.target.value))} className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-surface" /></label>
          <p className="sm:col-span-2 font-bold">Total: {(bill * (1 + tip / 100)).toFixed(2)} (tip {(bill * tip / 100).toFixed(2)})</p>
        </div>
      )}
      {tab === "pct" && (
        <div className="flex gap-2">
          <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="e.g. 20% of 150 = ? → enter 20*150/100 or use fields" className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
          <input value={pct} onChange={(e) => setPct(e.target.value)} placeholder="expression, e.g. 20*150/100" className="flex-1 px-3 py-2 border border-border rounded-lg bg-surface text-sm font-mono" />
        </div>
      )}
      {tab === "pct" && <p className="text-xs text-text-secondary mt-2">Quick: what is X% of Y → (X*Y/100). Percentage change: ((new-old)/old*100).</p>}
    </ToolLayout>
  );
}
