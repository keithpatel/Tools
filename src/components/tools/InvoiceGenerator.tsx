"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/ToolLayout";
import { Button } from "@/components/ui/Button";
import { Share2, Check } from "lucide-react";

interface Row { desc: string; qty: number; price: number }

function initialInvoice() {
  const d = { from: "Your Company", to: "Client", num: "INV-001", currency: "USD" };
  if (typeof window === "undefined") return d;
  try {
    const sp = new URLSearchParams(window.location.search);
    const f = sp.get("from");
    const t = sp.get("to");
    const n = sp.get("num");
    const c = sp.get("currency");
    if (f) d.from = f.slice(0, 80);
    if (t) d.to = t.slice(0, 80);
    if (n) d.num = n.slice(0, 20);
    if (c) d.currency = c.slice(0, 8).toUpperCase();
  } catch {}
  return d;
}

export default function InvoiceGenerator() {
  const [initInv] = useState(initialInvoice);
  const [from, setFrom] = useState(initInv.from);
  const [to, setTo] = useState(initInv.to);
  const [num, setNum] = useState(initInv.num);
  const [currency, setCurrency] = useState(initInv.currency);
  const [rows, setRows] = useState<Row[]>([{ desc: "Service", qty: 1, price: 100 }]);
  const [copiedLink, setCopiedLink] = useState(false);

  const sharePreset = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      url.searchParams.set("num", num);
      url.searchParams.set("currency", currency);
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const total = rows.reduce((a, r) => a + r.qty * r.price, 0);
  const set = (i: number, k: keyof Row, v: string) => {
    const c = [...rows];
    c[i] = { ...c[i], [k]: k === "desc" ? v : Number(v) || 0 };
    setRows(c);
  };

  return (
    <ToolLayout title="" description="">
      <div className="grid sm:grid-cols-4 gap-2 mb-3">
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Bill to" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Invoice #" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
        <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 8))} placeholder="USD" aria-label="Currency" className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_64px_88px_32px] gap-2 mb-2">
          <input value={r.desc} onChange={(e) => set(i, "desc", e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-surface text-sm" />
          <input type="number" value={r.qty} onChange={(e) => set(i, "qty", e.target.value)} className="px-2 py-2 border border-border rounded-lg bg-surface text-sm" />
          <input type="number" value={r.price} onChange={(e) => set(i, "price", e.target.value)} className="px-2 py-2 border border-border rounded-lg bg-surface text-sm" />
          <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-error-text text-lg">×</button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button variant="secondary" size="sm" onClick={() => setRows([...rows, { desc: "", qty: 1, price: 0 }])}>+ Add row</Button>
        <Button size="sm" onClick={() => window.print()}>Print / Save PDF</Button>
        <Button variant="secondary" size="sm" onClick={sharePreset}>
          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copiedLink ? "Link copied" : "Share preset"}
        </Button>
      </div>
      <div className="mt-4 p-5 bg-white text-black rounded-lg border">
        <div className="flex justify-between"><div><p className="font-bold">{from}</p><p className="text-xs">Bill to: {to}</p></div><p className="font-bold">{num}</p></div>
        <table className="w-full text-sm mt-3"><thead><tr className="border-b"><th className="text-left">Item</th><th>Qty</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-b"><td>{r.desc}</td><td className="text-center">{r.qty}</td><td className="text-right">{(r.qty * r.price).toFixed(2)}</td></tr>)}</tbody></table>
        <p className="text-right font-bold mt-2">Total: {total.toFixed(2)} {currency}</p>
      </div>
    </ToolLayout>
  );
}
